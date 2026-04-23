from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.database import TreatmentCalendar
from schemas.schemas import TreatmentRequest
from services import ollama_service
from datetime import datetime
import json

router = APIRouter(prefix="/api/treatment", tags=["Treatment"])

@router.post("/generate")
async def generate_schedule(
        data: TreatmentRequest,
        db: Session = Depends(get_db)
):
    disease = data.disease_name
    crop = data.crop_name
    severity = data.severity_stage

    prompt = f"""You are an agriculture expert.
Generate a 14-day treatment schedule for {disease} in {crop} crop at {severity} severity.
Respond ONLY in this exact JSON with no extra text outside the JSON:
{{
  "schedule": [
        {{"day": 1, "action": "First treatment", "product": "Product name", "notes": "Note here"}},
        {{"day": 4, "action": "Follow up check", "product": "Product name", "notes": "Note here"}},
        {{"day": 7, "action": "Second application", "product": "Product name", "notes": "Note here"}},
        {{"day": 14, "action": "Final inspection", "product": "None", "notes": "Note here"}}
  ],
  "total_days": 14,
    "follow_up": "Advice after treatment ends"
}}"""

    full_response = await ollama_service.analyze_image("", prompt)

    try:
        clean = full_response.strip()
        if "```" in clean:
            parts = clean.split("```")
            clean = parts[1] if len(parts) > 1 else parts[0]
            if clean.startswith("json"):
                clean = clean[4:]
        clean = clean.strip()
        start = clean.find("{")
        end = clean.rfind("}") + 1
        if start != -1 and end > start:
            clean = clean[start:end]
        parsed = json.loads(clean)
    except Exception:
        parsed = {
            "schedule": [
                {"day": 1,
                 "action": f"Apply fungicide for {disease}",
                 "product": "Copper Oxychloride",
                 "notes": "Apply early morning, avoid midday heat"},
                {"day": 4,
                 "action": "Inspect treated plants",
                 "product": "None",
                 "notes": "Check for improvement in affected leaves"},
                {"day": 7,
                 "action": "Re-apply if symptoms persist",
                 "product": "Copper Oxychloride",
                 "notes": "Reduce dose if improvement is visible"},
                {"day": 14,
                 "action": "Final recovery assessment",
                 "product": "None",
                 "notes": "Consult local officer if no improvement"}
            ],
            "total_days": 14,
            "follow_up": "Monitor weekly. Consult local agricultural officer if disease returns."
        }

    record = TreatmentCalendar(
        disease_name=disease,
        crop_name=crop,
        severity_stage=severity,
        schedule_json=json.dumps(parsed),
        created_at=datetime.utcnow()
    )
    db.add(record)
    db.commit()
    return parsed

@router.get("/schedule/{disease_name}")
def get_schedule(
    disease_name: str,
    db: Session = Depends(get_db)
):
    record = db.query(TreatmentCalendar).filter(
        TreatmentCalendar.disease_name == disease_name
    ).order_by(
        TreatmentCalendar.created_at.desc()
    ).first()
    if not record:
        raise HTTPException(
            status_code=404,
            detail="No schedule found"
        )
    return json.loads(record.schedule_json)
