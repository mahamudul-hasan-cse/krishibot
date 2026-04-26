import torch
import torch.nn as nn
import torchvision.models as models
import os

SAVE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "services", "plant_efficientnet.pth"
)
SAVE_PATH = os.path.normpath(SAVE_PATH)

def main():
    print("=" * 55)
    print("  KrishiBot — Plant Disease Model Setup")
    print("=" * 55)

    if os.path.exists(SAVE_PATH):
        size_mb = os.path.getsize(SAVE_PATH) / (1024 * 1024)
        print(f"\nModel already exists: {size_mb:.1f} MB")
        print("Setup complete. Restart backend to use it.")
        return

    os.makedirs(os.path.dirname(SAVE_PATH), exist_ok=True)

    print(f"\nSaving to: {SAVE_PATH}")
    print("\nDownloading EfficientNet-B0 (ImageNet pretrained)...")
    print("This is ~20 MB and takes about 30 seconds...\n")

    try:
        model = models.efficientnet_b0(
            weights=models.EfficientNet_B0_Weights.DEFAULT
        )
        model.classifier[1] = nn.Linear(
            model.classifier[1].in_features,
            38
        )
        torch.save(model.state_dict(), SAVE_PATH)
        size_mb = os.path.getsize(SAVE_PATH) / (1024 * 1024)
        print(f"Model saved successfully! ({size_mb:.1f} MB)")
        print("\nThe vision classifier is ready.")
        print("Restart the KrishiBot backend to activate it.")
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure torch and torchvision are installed:")
        print("pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu")

if __name__ == "__main__":
    main()
