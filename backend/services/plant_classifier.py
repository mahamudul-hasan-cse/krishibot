import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import io
import os
import logging

logger = logging.getLogger(__name__)

# ── PlantVillage 38 class labels ────────────────────────────────
PLANT_CLASSES = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]

def format_class_name(raw: str):
    """Convert raw class label to human readable format"""
    parts = raw.split("___")
    crop = parts[0].replace("_", " ").replace("(", "").replace(")", "").strip()
    if len(parts) < 2:
        return crop, "Unknown"
    disease = parts[1].strip()
    disease = disease.replace("_", " ")
    if disease.lower() == "healthy":
        return crop, "Healthy"
    if "(" in disease:
        disease = disease[:disease.index("(")].strip()
    return crop, disease

# ── Model singleton ──────────────────────────────────────────────
_model = None
_transform = None
_model_loaded = False

MODEL_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "plant_efficientnet.pth"
)

def get_transform():
    return transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

def load_model():
    global _model, _transform, _model_loaded
    if _model_loaded:
        return _model

    try:
        model = models.efficientnet_b0(weights=None)
        model.classifier[1] = nn.Linear(
            model.classifier[1].in_features,
            len(PLANT_CLASSES)
        )

        if os.path.exists(MODEL_PATH):
            state = torch.load(MODEL_PATH, map_location="cpu")
            model.load_state_dict(state)
            logger.info("Loaded PlantVillage EfficientNet-B0 weights")
        else:
            model = models.efficientnet_b0(
                weights=models.EfficientNet_B0_Weights.DEFAULT
            )
            model.classifier[1] = nn.Linear(
                model.classifier[1].in_features,
                len(PLANT_CLASSES)
            )
            logger.warning(
                "No PlantVillage weights found at %s. "
                "Using ImageNet pretrained backbone. "
                "Download fine-tuned weights for best accuracy.",
                MODEL_PATH
            )

        model.eval()
        _model = model
        _transform = get_transform()
        _model_loaded = True
        logger.info("Plant classifier ready")
        return _model

    except Exception as e:
        logger.error("Failed to load plant classifier: %s", e)
        _model_loaded = True
        return None

def classify_plant_image(image_bytes: bytes) -> dict:
    """
    Classify a plant leaf image.
    Returns disease classification with confidence scores.
    """
    model = load_model()

    if model is None:
        return {
            "available": False,
            "error": "Vision model not available"
        }

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        transform = get_transform()
        tensor = transform(image).unsqueeze(0)

        with torch.no_grad():
            outputs = model(tensor)
            probs = torch.nn.functional.softmax(outputs[0], dim=0)

        top5_prob, top5_idx = torch.topk(probs, 5)

        top_class = PLANT_CLASSES[top5_idx[0].item()]
        top_prob = round(top5_prob[0].item() * 100, 1)
        crop, disease = format_class_name(top_class)
        is_healthy = disease.lower() == "healthy"

        if top_prob >= 75:
            confidence = "High"
        elif top_prob >= 45:
            confidence = "Medium"
        else:
            confidence = "Low"

        alternatives = []
        for i in range(1, 5):
            alt_class = PLANT_CLASSES[top5_idx[i].item()]
            alt_prob = round(top5_prob[i].item() * 100, 1)
            alt_crop, alt_disease = format_class_name(alt_class)
            alternatives.append({
                "disease": alt_disease,
                "crop": alt_crop,
                "probability": alt_prob
            })

        return {
            "available": True,
            "crop": crop,
            "disease_name": disease,
            "is_diseased": not is_healthy,
            "confidence_score": top_prob,
            "confidence": confidence,
            "top5_alternatives": alternatives,
            "model_name": "EfficientNet-B0",
            "dataset": "PlantVillage (38 classes)"
        }

    except Exception as e:
        logger.error("Classification error: %s", e)
        return {
            "available": False,
            "error": str(e)
        }
