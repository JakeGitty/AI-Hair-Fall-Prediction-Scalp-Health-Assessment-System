"""
Train a CNN (ResNet-50 transfer learning) on merged scalp/hair loss image datasets.
Uses PyTorch (Python 3.14 compatible).
Outputs: scalp_image_model.pth + image_class_names.joblib
"""
import os
import json
import shutil
import numpy as np
import pandas as pd
from pathlib import Path
import joblib
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

def prepare_unified_dataset():
    """
    Merge all image datasets into a unified folder structure:
      ml/data/images/unified/healthy/
      ml/data/images/unified/moderate/
      ml/data/images/unified/severe/
    """
    base = Path(__file__).parent / 'data' / 'images'
    unified = base / 'unified'
    
    for cls in ['healthy', 'moderate', 'severe']:
        (unified / cls).mkdir(parents=True, exist_ok=True)
    
    copied = 0
    
    # DS1: bald_people.csv — type_1-2 = healthy, type_3-4 = moderate, type_5-7 = severe
    ds1_csv = base / 'ds1' / 'bald_people.csv'
    if ds1_csv.exists():
        df = pd.read_csv(ds1_csv)
        for _, row in df.iterrows():
            img_name = os.path.basename(row['images'])
            src = base / 'ds1' / 'images' / img_name
            if not src.exists():
                continue
            t = row['type']
            if t in ['type_1', 'type_2']:
                dest_cls = 'healthy'
            elif t in ['type_3', 'type_4']:
                dest_cls = 'moderate'
            else:
                dest_cls = 'severe'
            dest = unified / dest_cls / f'ds1_{img_name}'
            if not dest.exists():
                shutil.copy2(src, dest)
                copied += 1
    
    # DS2: annotation.json — all Norwood scale images, treat as severe
    ds2_img_dir = base / 'ds2' / 'images'
    if ds2_img_dir.exists():
        for img_file in ds2_img_dir.iterdir():
            if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                dest = unified / 'severe' / f'ds2_{img_file.name}'
                if not dest.exists():
                    shutil.copy2(img_file, dest)
                    copied += 1
    
    # DS3: bald_men.csv — has "label" column with "Stage X"
    ds3_csv = base / 'ds3' / 'bald_men.csv'
    if ds3_csv.exists():
        df = pd.read_csv(ds3_csv)
        files_dir = base / 'ds3' / 'files'
        for _, row in df.iterrows():
            person_id = str(row['id'])
            label = row.get('label', 'Stage 7')
            stage_num = int(str(label).replace('Stage ', '')) if 'Stage' in str(label) else 7
            
            if stage_num <= 2:
                dest_cls = 'healthy'
            elif stage_num <= 4:
                dest_cls = 'moderate'
            else:
                dest_cls = 'severe'
            
            person_dir = files_dir / person_id
            if person_dir.exists():
                for img_file in person_dir.iterdir():
                    if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                        dest = unified / dest_cls / f'ds3_{person_id}_{img_file.name}'
                        if not dest.exists():
                            shutil.copy2(img_file, dest)
                            copied += 1
    
    # DS4: bald_women — all are bald, classify as severe
    ds4_files = base / 'ds4' / 'files'
    if ds4_files.exists():
        for person_dir in ds4_files.iterdir():
            if person_dir.is_dir():
                for img_file in person_dir.iterdir():
                    if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                        dest = unified / 'severe' / f'ds4_{person_dir.name}_{img_file.name}'
                        if not dest.exists():
                            shutil.copy2(img_file, dest)
                            copied += 1
    
    # DS6: simongraves/male-hair-loss-dataset — annotation.json has Norwood stages
    ds6_ann = base / 'ds6' / 'annotation.json'
    if ds6_ann.exists():
        with open(ds6_ann, 'r') as f:
            ann = json.load(f)
        # Build image_id -> stage mapping from annotations
        img_stage = {}
        cats = {c['id']: c['name'] for c in ann.get('categories', [])}
        for a in ann.get('annotations', []):
            img_stage[a['image_id']] = cats.get(a['category_id'], 'Stage 7')
        for img_info in ann.get('images', []):
            fname = os.path.basename(img_info['file_name'])
            src = base / 'ds6' / 'images' / fname
            if not src.exists():
                continue
            stage_str = img_stage.get(img_info['id'], 'Stage 5')
            stage_num = int(stage_str.replace('Stage ', '')) if 'Stage' in stage_str else 5
            if stage_num <= 2:
                dest_cls = 'healthy'
            elif stage_num <= 4:
                dest_cls = 'moderate'
            else:
                dest_cls = 'severe'
            dest = unified / dest_cls / f'ds6_{fname}'
            if not dest.exists():
                shutil.copy2(src, dest)
                copied += 1
    
    # DS7: segmentation dataset — originals only (skip masks), all are bald = severe
    ds7_base = base / 'ds7'
    for gender_dir in ['Male', 'Female']:
        gender_path = ds7_base / gender_dir
        if gender_path.exists():
            for person_dir in gender_path.iterdir():
                if person_dir.is_dir():
                    for img_file in person_dir.iterdir():
                        if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png'] and 'mask' not in img_file.name.lower():
                            dest = unified / 'severe' / f'ds7_{gender_dir}_{person_dir.name}_{img_file.name}'
                            if not dest.exists():
                                shutil.copy2(img_file, dest)
                                copied += 1
    
    # DS8: sithukaungset/hairlossdataset — bald/notbald folders
    ds8_bald = base / 'ds8' / 'data0330' / 'bald'
    ds8_notbald = base / 'ds8' / 'data0330' / 'notbald'
    import random
    random.seed(42)
    
    if ds8_notbald.exists():
        notbald_imgs = [f for f in ds8_notbald.iterdir() if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']]
        sampled = random.sample(notbald_imgs, min(80, len(notbald_imgs)))
        for img_file in sampled:
            dest = unified / 'healthy' / f'ds8_{img_file.name}'
            if not dest.exists():
                shutil.copy2(img_file, dest)
                copied += 1
    
    if ds8_bald.exists():
        bald_imgs = [f for f in ds8_bald.iterdir() if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']]
        sampled = random.sample(bald_imgs, min(80, len(bald_imgs)))
        for img_file in sampled:
            dest = unified / 'severe' / f'ds8_{img_file.name}'
            if not dest.exists():
                shutil.copy2(img_file, dest)
                copied += 1
    
    
    # DS9: Autonomous duckduckgo scalp scraper dataset
    ds9_base = base / 'ds9'
    if ds9_base.exists():
        for cat_dir in ['healthy', 'severe']:
            src_dir = ds9_base / cat_dir
            if src_dir.exists():
                for img_file in src_dir.iterdir():
                    if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
                        dest = unified / cat_dir / f'ds9_{img_file.name}'
                        if not dest.exists():
                            shutil.copy2(img_file, dest)
                            copied += 1
    
    print(f"Copied {copied} images to unified dataset")
    
    # Print class distribution
    for cls in ['healthy', 'moderate', 'severe']:
        count = len(list((unified / cls).iterdir()))
        print(f"  {cls}: {count} images")
    
    total = sum(len(list((unified / cls).iterdir())) for cls in ['healthy', 'moderate', 'severe'])
    print(f"  TOTAL: {total} images")
    
    return str(unified)


def train_image_model(data_dir):
    """Train MobileNetV2-based CNN with PyTorch."""
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader
    from torchvision import datasets, transforms, models
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # Hyperparameters
    IMG_SIZE = 224
    BATCH_SIZE = 32
    EPOCHS_FROZEN = 5
    EPOCHS_FINETUNE = 15
    PATIENCE = 4 # Early stopping patience
    
    # Data transforms with aggressive augmentation
    train_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE + 32, IMG_SIZE + 32)),
        transforms.RandomCrop(IMG_SIZE),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(30),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.1),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.8, 1.2)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    # Load dataset
    full_dataset = datasets.ImageFolder(data_dir, transform=train_transform)
    class_names = full_dataset.classes
    num_classes = len(class_names)
    
    print(f"Classes: {class_names}")
    print(f"Total images: {len(full_dataset)}")
    
    # Split into train/val (80/20)
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(
        full_dataset, [train_size, val_size],
        generator=torch.Generator().manual_seed(42)
    )
    
    # Apply val transform to validation set
    val_dataset.dataset = datasets.ImageFolder(data_dir, transform=val_transform)
    
    # Compute class weights for imbalanced data
    all_labels = [full_dataset.targets[i] for i in range(len(full_dataset))]
    class_counts = np.bincount(all_labels)
    total = sum(class_counts)
    class_weights = torch.FloatTensor([total / (num_classes * c) for c in class_counts]).to(device)
    print(f"Class counts: {dict(zip(class_names, class_counts))}")
    print(f"Class weights: {class_weights.tolist()}")
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    
    # Build model: ResNet-50 + custom classifier
    model = models.resnet50(weights='IMAGENET1K_V1')
    
    # Freeze all base layers
    for param in model.parameters():
        param.requires_grad = False
    
    # Replace classifier
    num_ftrs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.5),
        nn.Linear(num_ftrs, 128),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(128, num_classes)
    )
    model = model.to(device)
    
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    
    # Phase 1: Train only classifier head
    optimizer = optim.Adam(model.fc.parameters(), lr=0.001)
    print(f"\nPhase 1: Training classifier head ({EPOCHS_FROZEN} epochs)...")
    
    best_val_acc = 0.0
    for epoch in range(EPOCHS_FROZEN):
        model.train()
        running_loss = 0.0
        correct = 0
        total_samples = 0
        
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = torch.max(outputs, 1)
            total_samples += labels.size(0)
            correct += (predicted == labels).sum().item()
        
        train_acc = correct / total_samples
        
        # Validate
        model.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                _, predicted = torch.max(outputs, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()
        
        val_acc = val_correct / val_total if val_total > 0 else 0
        print(f"  Epoch {epoch+1}/{EPOCHS_FROZEN} — Loss: {running_loss/len(train_loader):.4f}, Train Acc: {train_acc:.3f}, Val Acc: {val_acc:.3f}")
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
    
    # Phase 2: Fine-tune last feature layer
    print(f"\nPhase 2: Fine-tuning ({EPOCHS_FINETUNE} epochs)...")
    
    # Unfreeze the last resnet block
    for param in model.layer4.parameters():
        param.requires_grad = True
    
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=0.0001)
    from torch.optim.lr_scheduler import CosineAnnealingLR
    scheduler = CosineAnnealingLR(optimizer, T_max=EPOCHS_FINETUNE)
    
    for epoch in range(EPOCHS_FINETUNE):
        model.train()
        running_loss = 0.0
        correct = 0
        total_samples = 0
        epochs_no_improve = 0
        best_model_state = model.state_dict().copy()
        
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = torch.max(outputs, 1)
            total_samples += labels.size(0)
            correct += (predicted == labels).sum().item()
        
        train_acc = correct / total_samples
        
        # Validate
        model.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                _, predicted = torch.max(outputs, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()
        
        val_acc = val_correct / val_total if val_total > 0 else 0
        print(f"  Epoch {epoch+1}/{EPOCHS_FINETUNE} — Loss: {running_loss/len(train_loader):.4f}, Train Acc: {train_acc:.3f}, Val Acc: {val_acc:.3f}")
        
        scheduler.step()
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            epochs_no_improve = 0
            best_model_state = model.state_dict().copy()
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= PATIENCE:
                print(f"Early stopping triggered after {epoch+1} epochs.")
                break
    
    print(f"\nBest validation accuracy: {best_val_acc:.4f}")
    
    # Load best model weights for final evaluation
    model.load_state_dict(best_model_state)
    model.eval()
    
    # Run Final Evaluation on Validation Set
    print("\n--- Final Evaluation Metrics ---")
    all_preds = []
    all_labels = []
    with torch.no_grad():
        for inputs, labels in val_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            _, predicted = torch.max(outputs, 1)
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            
    print(classification_report(all_labels, all_preds, target_names=class_names))
    
    # Generate and Save Confusion Matrix
    cm = confusion_matrix(all_labels, all_preds)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
    plt.title('Validation Confusion Matrix')
    plt.ylabel('True Class')
    plt.xlabel('Predicted Class')
    cm_path = os.path.join(os.path.dirname(__file__), 'confusion_matrix.png')
    plt.savefig(cm_path)
    plt.close()
    print(f"Confusion Matrix saved to {cm_path}")
    
    # Save model and class names
    model_path = os.path.join(os.path.dirname(__file__), 'scalp_image_model.pth')
    class_names_path = os.path.join(os.path.dirname(__file__), 'image_class_names.joblib')
    
    torch.save(model.state_dict(), model_path)
    joblib.dump(class_names, class_names_path)
    
    # Also save full model config for easy loading
    config = {
        'num_classes': num_classes,
        'class_names': class_names,
        'img_size': IMG_SIZE
    }
    config_path = os.path.join(os.path.dirname(__file__), 'image_model_config.joblib')
    joblib.dump(config, config_path)
    
    print(f"Image model saved to {model_path}")
    print(f"Class names saved to {class_names_path}")
    
    return best_val_acc


if __name__ == "__main__":
    print("=" * 60)
    print("STEP 1: Preparing unified image dataset")
    print("=" * 60)
    data_dir = prepare_unified_dataset()
    
    print("\n" + "=" * 60)
    print("STEP 2: Training CNN (ResNet-50 transfer learning)")
    print("=" * 60)
    accuracy = train_image_model(data_dir)
    
    print(f"\n{'=' * 60}")
    print(f"DONE! Best image model accuracy: {accuracy:.2f}")
    print(f"{'=' * 60}")
