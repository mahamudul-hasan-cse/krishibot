"""
Fine-tune EfficientNet-B0 on the PlantVillage dataset for the 38 classes
used by KrishiBot's vision classifier.

Usage:
    python scripts/train_classifier.py --epochs 5 --batch-size 32

Outputs weights to backend/services/plant_efficientnet.pth.

Data source:
    Mendeley Data — Plant Village (color, segmented, grayscale variants):
    https://data.mendeley.com/datasets/tywbtsjrjv/1
    (~700 MB zipped; expand into ./data/PlantVillage/<class>/<image>.jpg)

Hardware:
    CPU: ~45-90 minutes per epoch on a modern laptop (5 epochs = several hours).
    CUDA GPU: ~3-6 minutes per epoch.

The script auto-detects a CUDA GPU if available.
"""

import argparse
import os
import sys
import time
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, models, transforms

# Allow `from services.plant_classifier import PLANT_CLASSES`
THIS_DIR = Path(__file__).resolve().parent
BACKEND_DIR = THIS_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))
from services.plant_classifier import PLANT_CLASSES  # noqa: E402

DEFAULT_DATA_DIR = BACKEND_DIR.parent / "data" / "PlantVillage"
SAVE_PATH = BACKEND_DIR / "services" / "plant_efficientnet.pth"


def build_loaders(data_dir: Path, batch_size: int, val_split: float = 0.15):
    train_tf = transforms.Compose([
        transforms.Resize(256),
        transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(0.2, 0.2, 0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])
    val_tf = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])

    full = datasets.ImageFolder(str(data_dir), transform=train_tf)
    if len(full.classes) != len(PLANT_CLASSES):
        print(
            f"WARNING: dataset has {len(full.classes)} classes, "
            f"PLANT_CLASSES has {len(PLANT_CLASSES)}. "
            "Class indices will follow ImageFolder ordering."
        )

    n_val = int(len(full) * val_split)
    n_train = len(full) - n_val
    train_ds, val_ds = random_split(full, [n_train, n_val],
                                    generator=torch.Generator().manual_seed(42))
    val_ds.dataset.transform = val_tf  # type: ignore[attr-defined]

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True,
                              num_workers=2, pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False,
                            num_workers=2, pin_memory=True)
    return train_loader, val_loader, full.classes


def build_model(num_classes: int) -> nn.Module:
    model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    return model


def train_one_epoch(model, loader, optimizer, criterion, device):
    model.train()
    running, correct, total = 0.0, 0, 0
    for batch_idx, (xb, yb) in enumerate(loader):
        xb, yb = xb.to(device), yb.to(device)
        optimizer.zero_grad()
        out = model(xb)
        loss = criterion(out, yb)
        loss.backward()
        optimizer.step()

        running += loss.item() * xb.size(0)
        correct += (out.argmax(1) == yb).sum().item()
        total += xb.size(0)

        if batch_idx % 20 == 0:
            print(f"    batch {batch_idx}/{len(loader)}  "
                  f"loss={loss.item():.4f}  acc={correct/total:.3f}")

    return running / total, correct / total


@torch.no_grad()
def evaluate(model, loader, criterion, device):
    model.eval()
    running, correct, total = 0.0, 0, 0
    for xb, yb in loader:
        xb, yb = xb.to(device), yb.to(device)
        out = model(xb)
        loss = criterion(out, yb)
        running += loss.item() * xb.size(0)
        correct += (out.argmax(1) == yb).sum().item()
        total += xb.size(0)
    return running / total, correct / total


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR,
                        help="Root of PlantVillage dataset (ImageFolder layout).")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-3)
    args = parser.parse_args()

    if not args.data_dir.exists():
        print(f"Dataset not found at: {args.data_dir}")
        print("Download PlantVillage and extract so the layout is:")
        print(f"  {args.data_dir}/<class_name>/<image>.jpg")
        print("Mendeley source: https://data.mendeley.com/datasets/tywbtsjrjv/1")
        sys.exit(1)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")
    if device.type == "cpu":
        print("WARNING: CPU training is slow (~45-90 min/epoch).")

    print("Loading dataset…")
    train_loader, val_loader, classes = build_loaders(args.data_dir, args.batch_size)
    print(f"  train batches: {len(train_loader)}  val batches: {len(val_loader)}")
    print(f"  classes detected: {len(classes)}")

    model = build_model(num_classes=len(classes)).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=args.lr)
    criterion = nn.CrossEntropyLoss()

    best_acc = 0.0
    SAVE_PATH.parent.mkdir(parents=True, exist_ok=True)

    for epoch in range(1, args.epochs + 1):
        t0 = time.time()
        print(f"\n=== Epoch {epoch}/{args.epochs} ===")
        train_loss, train_acc = train_one_epoch(model, train_loader, optimizer, criterion, device)
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)
        elapsed = time.time() - t0
        print(f"  train: loss={train_loss:.4f} acc={train_acc:.3f}  "
              f"val: loss={val_loss:.4f} acc={val_acc:.3f}  "
              f"({elapsed/60:.1f} min)")

        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), SAVE_PATH)
            print(f"  ✓ saved best model (val_acc={val_acc:.3f}) -> {SAVE_PATH}")

    print(f"\nDone. Best validation accuracy: {best_acc:.3f}")
    print(f"Weights saved to: {SAVE_PATH}")
    print("Restart the KrishiBot backend to use the fine-tuned model.")


if __name__ == "__main__":
    main()
