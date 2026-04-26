"""
Analyze router — accepts a crop/leaf image, produces a disease diagnosis
via the text model using filename-based crop hints, and persists the result.

Note: the image itself is NOT sent to Ollama (vision models require far more
memory than many users have available). We still preprocess and validate the
image so the UI works end-to-end, and we use the filename as a crop hint.
"""

import json as json_module
import logging
from datetime import datetime
from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models.database import AnalysisLog
from schemas.schemas import AnalysisResponse, MarketContext, PDFReportRequest
from services import image_service, llm_service, prompt_builder, market_service
from services.pdf_service import generate_disease_report_pdf
from services.plant_classifier import classify_plant_image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analyze", tags=["Analyze"])

# Guard against accidental uploads of non-image files.
_ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/tiff",
}

# Reject files larger than 10 MB before doing any processing.
_MAX_FILE_BYTES = 10 * 1024 * 1024


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _strip_markdown_fences(text: str) -> str:
    """
    Remove ```json ... ``` or ``` ... ``` wrapping if present.

    The model occasionally wraps its JSON in a code fence even when told not
    to; this normalises both variants back to a bare JSON string.
    """
    text = text.strip()

    if text.startswith("```"):
        lines = text.splitlines()
        # Drop first fence line (``` or ```json).
        lines = lines[1:]
        # Drop the closing fence if it's present.
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    return text


def _parse_model_response(raw: str, filename: str) -> AnalysisResponse:
    """
    Parse the text model's JSON response into an AnalysisResponse.

    The model is prompted to return pure JSON, but it occasionally wraps the
    object in markdown code fences. This function strips fences before parsing
    and raises HTTPException 422 with a clear message if parsing still fails.
    """
    text = _strip_markdown_fences(raw)

    try:
        parsed = json_module.loads(text)
    except json.JSONDecodeError as exc:
        logger.warning("Model returned non-JSON for %s: %s", filename, raw[:200])
        raise HTTPException(
            status_code=422,
            detail=(
                "The model did not return valid JSON. "
                f"Parse error: {exc}. Raw response (first 200 chars): {raw[:200]}"
            ),
        ) from exc

    # Normalise confidence — default to "Low" if missing or unexpected value.
    confidence = parsed.get("confidence", "Low")
    if confidence not in {"High", "Medium", "Low"}:
        confidence = "Low"

    severity_stage = parsed.get("severity_stage", "Moderate")
    leaf_area_affected = parsed.get("leaf_area_affected", "Unknown")

    return AnalysisResponse(
        is_diseased=bool(parsed.get("is_diseased", False)),
        disease_name=parsed.get("disease_name") or "Healthy",
        confidence=confidence,
        severity_stage=severity_stage,
        leaf_area_affected=leaf_area_affected,
        symptoms=parsed.get("symptoms") or [],
        treatment=parsed.get("treatment") or [],
        prevention=parsed.get("prevention") or [],
        raw_response=raw,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/image",
    response_model=AnalysisResponse,
    summary="Analyse a crop or leaf image for disease",
)
async def analyze_image(
    file: UploadFile = File(..., description="JPEG / PNG / WebP image of a crop or leaf"),
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    """
    Upload a crop/leaf image and receive a structured disease diagnosis.

    Processing steps:
    1. Validate content-type and file size.
    2. Validate that the bytes are actually a decodable image.
    3. Preprocess (resize to ≤1024 px, convert to JPEG).
    4. Derive a crop hint from the filename and ask the text model for a
       plausible disease analysis (no vision model involved).
    5. Parse the JSON response into ``AnalysisResponse``.
    6. Persist the result to ``AnalysisLog``.
    """
    # --- 1. Validate content-type ---
    content_type = (file.content_type or "").lower()
    if content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type '{content_type}'. "
                f"Accepted types: {', '.join(sorted(_ALLOWED_CONTENT_TYPES))}."
            ),
        )

    # --- 2. Read and size-check ---
    file_bytes = await file.read()
    if len(file_bytes) > _MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(file_bytes) // 1024} KB). Maximum allowed: 10 MB.",
        )

    # ── Vision model classification ─────────────────────────
    vision_result = classify_plant_image(file_bytes)
    vision_context = ""

    if vision_result.get("available") and vision_result.get("disease_name"):
        vision_context = f"""
COMPUTER VISION MODEL RESULT (EfficientNet-B0):
The vision classifier analyzed the image and detected:
- Detected Crop: {vision_result.get('crop', 'Unknown')}
- Detected Disease: {vision_result.get('disease_name', 'Unknown')}
- Confidence Score: {vision_result.get('confidence_score', 0)}%
- Confidence Level: {vision_result.get('confidence', 'Medium')}
- Is Diseased: {vision_result.get('is_diseased', False)}

Use this computer vision result as the PRIMARY basis
for your JSON response. Your role is to provide detailed
symptoms, treatment steps, and prevention tips based on
the detected disease. Set disease_name to match the
vision model result unless you have strong reason to
disagree.
"""

    # --- 3. Validate image bytes ---
    if not image_service.validate_image(file_bytes):
        raise HTTPException(
            status_code=422,
            detail="The uploaded file could not be decoded as a valid image.",
        )

    # --- 4. Preprocess ---
    try:
        processed = image_service.preprocess_image(file_bytes, max_size=1024)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    b64 = image_service.image_to_base64(processed)

    # --- 5. Run text model with filename-derived crop hint ---
    filename = file.filename or "unknown"
    prompt = prompt_builder.build_image_analysis_prompt(filename) + vision_context
    raw_response = await llm_service.analyze_image(b64, prompt)

    if not raw_response:
        raise HTTPException(
            status_code=502,
            detail="Model returned an empty response. Please try again.",
        )

    # --- 6. Parse ---
    analysis_result = _parse_model_response(raw_response, filename)

    # Attach vision model results
    analysis_result.vision_model_disease = vision_result.get("disease_name") if vision_result.get("available") else None
    analysis_result.vision_confidence_score = vision_result.get("confidence_score") if vision_result.get("available") else None
    analysis_result.vision_top5 = vision_result.get("top5_alternatives") if vision_result.get("available") else None
    analysis_result.vision_model_used = vision_result.get("model_name") if vision_result.get("available") else None
    analysis_result.vision_available = vision_result.get("available", False)

    result = analysis_result.model_dump()

    analysis_log = AnalysisLog(
        image_filename=file.filename or "image",
        disease_name=result.get("disease_name", "Unknown"),
        result_json=json_module.dumps(result),
        is_diseased=result.get("is_diseased", False),
        timestamp=datetime.utcnow(),
    )
    db.add(analysis_log)
    db.commit()

    # --- 6b. Enrich with market context ---
    # Only calculate market context if a disease was detected
    if analysis_result.is_diseased:
        try:
            crop_name = prompt_builder._detect_crop_from_filename(filename)
            # Map confidence to severity stage for market calculation
            severity_stage = {
                "High":   "Severe",
                "Medium": "Moderate",
                "Low":    "Early",
            }.get(analysis_result.confidence, "Moderate")

            market_data = market_service.calculate_market_context(
                crop_name=crop_name,
                disease_name=analysis_result.disease_name,
                severity_stage=severity_stage,
            )
            analysis_result.market_context = MarketContext(**market_data)
        except Exception as exc:
            # Market context enrichment failure should not block the API response
            logger.exception("Failed to enrich market context for %s", filename)

    return analysis_result


@router.post(
    "/report/pdf",
    summary="Generate a PDF report from a disease analysis result",
    response_class=StreamingResponse,
)
async def generate_pdf_report(body: PDFReportRequest) -> StreamingResponse:
    """
    Accept a completed AnalysisResponse payload and return a professionally
    formatted PDF report as a downloadable file attachment.
    """
    try:
        pdf_bytes = generate_disease_report_pdf(
            analysis_data={
                "disease_name": body.disease_name,
                "is_diseased":  body.is_diseased,
                "confidence":   body.confidence,
                "symptoms":     body.symptoms,
                "treatment":    body.treatment,
                "prevention":   body.prevention,
            },
            filename=body.filename,
        )
    except Exception as exc:
        logger.exception("PDF generation failed")
        raise HTTPException(status_code=500, detail="Failed to generate PDF report.") from exc

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=krishibot_report_{timestamp}.pdf"
        },
    )
