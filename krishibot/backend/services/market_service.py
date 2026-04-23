"""
Market context service — provides financial insights for disease treatment decisions.

Shows farmers whether treating a detected disease is financially worth it, based on:
- Crop market price and average yield
- Disease severity and expected loss
- Treatment cost and recommended product
"""

# Crop prices and yields (based on Bangladesh market averages)
CROP_PRICES = {
    "rice":   {"price_per_kg": 35, "avg_yield_kg": 3000, "unit": "kg/bigha"},
    "tomato": {"price_per_kg": 80, "avg_yield_kg": 2000, "unit": "kg/bigha"},
    "potato": {"price_per_kg": 25, "avg_yield_kg": 4000, "unit": "kg/bigha"},
    "wheat":  {"price_per_kg": 30, "avg_yield_kg": 1500, "unit": "kg/bigha"},
    "jute":   {"price_per_kg": 45, "avg_yield_kg": 1200, "unit": "kg/bigha"},
}

# Treatment costs and recommended products (fungicides, bactericides, removal advice)
DISEASE_TREATMENT_COSTS = {
    "late blight":     {"cost_bdt": 800,  "product": "Ridomil Gold MZ"},
    "early blight":    {"cost_bdt": 500,  "product": "Mancozeb 80WP"},
    "bacterial wilt":  {"cost_bdt": 600,  "product": "Copper Oxychloride"},
    "rice blast":      {"cost_bdt": 700,  "product": "Tricyclazole 75WP"},
    "brown spot":      {"cost_bdt": 400,  "product": "Propiconazole"},
    "mosaic virus":    {"cost_bdt": 300,  "product": "Remove infected plants"},
    "leaf spot":       {"cost_bdt": 450,  "product": "Chlorothalonil"},
    "fusarium wilt":   {"cost_bdt": 650,  "product": "Carbendazim"},
    "sheath blight":   {"cost_bdt": 500,  "product": "Hexaconazole"},
    "leaf curl":       {"cost_bdt": 350,  "product": "Remove infected plants"},
    "default":         {"cost_bdt": 500,  "product": "Consult agronomist"},
}

# Crop loss percentage by disease severity stage
LOSS_BY_SEVERITY = {
    "Early":    0.15,
    "Moderate": 0.35,
    "Severe":   0.60,
    "Healthy":  0.0,
}


def calculate_market_context(
    crop_name: str,
    disease_name: str,
    severity_stage: str,
) -> dict:
    """
    Calculate financial viability of treating a detected disease.

    Args:
        crop_name: Name of the crop (e.g., 'tomato', 'rice')
        disease_name: Name of the disease (e.g., 'Late Blight')
        severity_stage: "Early", "Moderate", "Severe", or "Healthy"

    Returns:
        dict with financial metrics and treatment recommendation verdict
    """
    crop = crop_name.lower()
    disease = disease_name.lower()

    # Lookup crop pricing; default to tomato if unknown
    crop_data = CROP_PRICES.get(crop, CROP_PRICES["tomato"])

    # Find matching disease treatment cost
    disease_key = next(
        (k for k in DISEASE_TREATMENT_COSTS if k in disease),
        "default",
    )
    treatment_data = DISEASE_TREATMENT_COSTS[disease_key]

    # Get crop loss percentage for this severity
    loss_pct = LOSS_BY_SEVERITY.get(severity_stage, 0.35)

    # Calculate financial metrics
    total_value = crop_data["price_per_kg"] * crop_data["avg_yield_kg"]
    potential_loss = total_value * loss_pct
    treatment_cost = treatment_data["cost_bdt"]
    net_saving = potential_loss - treatment_cost
    worth_treating = net_saving > 0

    # Build verdict message
    if worth_treating:
        verdict = (
            f"Treating costs {treatment_cost:,} BDT and saves ~{int(potential_loss):,} BDT in crop loss. "
            f"Net saving: {int(net_saving):,} BDT. Recommended treatment: {treatment_data['product']}"
        )
    else:
        verdict = (
            f"Treatment cost ({treatment_cost:,} BDT) may exceed recoverable value ({int(potential_loss):,} BDT). "
            f"Consult a local agricultural officer for confirmation."
        )

    return {
        "crop_price_per_kg": crop_data["price_per_kg"],
        "avg_yield": crop_data["avg_yield_kg"],
        "yield_unit": crop_data["unit"],
        "total_crop_value_bdt": int(total_value),
        "estimated_loss_pct": int(loss_pct * 100),
        "estimated_loss_bdt": int(potential_loss),
        "treatment_cost_bdt": treatment_cost,
        "recommended_product": treatment_data["product"],
        "net_saving_bdt": int(net_saving),
        "worth_treating": worth_treating,
        "verdict": verdict,
    }
