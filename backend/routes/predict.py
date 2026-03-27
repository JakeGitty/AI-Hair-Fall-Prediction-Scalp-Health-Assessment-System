# This triggers a Flask reload
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from PIL import Image
import io
import json
import traceback

predict_bp = Blueprint('predict', __name__)

# Load questionnaire model and encoders
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_path = os.path.join(current_dir, 'ml', 'hairfall_model.joblib')
encoders_path = os.path.join(current_dir, 'ml', 'encoders.joblib')

try:
    model = joblib.load(model_path)
    encoders = joblib.load(encoders_path)
    print("[OK] Questionnaire model loaded")
except Exception as e:
    print(f"Error loading questionnaire model: {e}")
    model = None
    encoders = None

# Load image model (PyTorch ResNet-50)
image_model = None
image_class_names = None
image_config = None

try:
    import torch
    import torch.nn as nn
    from torchvision import models, transforms
    
    config_path = os.path.join(current_dir, 'ml', 'image_model_config.joblib')
    weights_path = os.path.join(current_dir, 'ml', 'scalp_image_model.pth')
    
    if os.path.exists(weights_path) and os.path.exists(config_path):
        image_config = joblib.load(config_path)
        image_class_names = image_config['class_names']
        
        # Reconstruct model architecture
        _model = models.resnet50(weights=None)
        num_ftrs = _model.fc.in_features
        _model.fc = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(num_ftrs, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, image_config['num_classes'])
        )
        _model.load_state_dict(torch.load(weights_path, map_location='cpu', weights_only=True))
        _model.eval()
        image_model = _model
        
        print(f"[OK] Image model loaded (classes: {image_class_names})")
    else:
        print("Image model files not found, image prediction disabled")
except Exception as e:
    print(f"Error loading image model: {e}")

# Image preprocessing transform (must match training)
IMG_TRANSFORM = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
]) if 'transforms' in dir() else None


def predict_from_image(photo_file):
    """Run image through CNN and return class probabilities."""
    if image_model is None or IMG_TRANSFORM is None:
        return None
    
    try:
        img = Image.open(photo_file).convert('RGB')
        img_tensor = IMG_TRANSFORM(img).unsqueeze(0)  # Add batch dimension
        
        with torch.no_grad():
            outputs = image_model(img_tensor)
            probabilities = torch.softmax(outputs, dim=1)[0]
        
        # Map class probabilities to risk categories
        result = {}
        for i, cls_name in enumerate(image_class_names):
            result[cls_name] = float(probabilities[i])
        
        return result
    except Exception as e:
        print(f"Image prediction error: {e}")
        return None


def map_image_to_risk(image_probs):
    """Map image class probabilities to risk categories (Low/Moderate/High)."""
    # image classes: healthy, moderate, severe
    # risk categories: Low, Moderate, High
    risk_map = {
        'healthy': 'Low',
        'moderate': 'Moderate', 
        'severe': 'High'
    }
    
    risk_probs = {}
    for cls, prob in image_probs.items():
        risk_cat = risk_map.get(cls, cls)
        risk_probs[risk_cat] = prob
    
    return risk_probs


@predict_bp.route('/', methods=['POST'])
@jwt_required()
def predict():
    # Handle multipart/form-data or json
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()

    if not data:
        return jsonify({"detail": "No input data provided"}), 400

    assessment_mode = data.get('mode', 'questionnaire')

    try:
        # === INITIALIZE VARIABLES ===
        image_risk_probs = None
        q_risk_probs = None
        all_image_probs = []

        # === IMAGE MODEL (for photo & combined modes) ===
        if assessment_mode in ['photo', 'combined']:
            if image_model is None:
                return jsonify({"detail": "Image model not loaded"}), 500
            
            photos = request.files.getlist('photos')
            valid_photos = [p for p in photos if p and p.filename != '']
            
            if not valid_photos:
                return jsonify({"detail": "No photos uploaded. Please upload at least one scalp photo."}), 400
            
            uploads_dir = os.path.join(current_dir, 'uploads')
            os.makedirs(uploads_dir, exist_ok=True)
            
            for photo in valid_photos:
                photo_path = os.path.join(uploads_dir, photo.filename)
                photo_bytes = photo.read()
                with open(photo_path, 'wb') as f:
                    f.write(photo_bytes)
                print(f"Saved scalp photo: {photo_path}")
                
                probs = predict_from_image(io.BytesIO(photo_bytes))
                if probs:
                    all_image_probs.append(map_image_to_risk(probs))
            
            if not all_image_probs:
                return jsonify({"detail": "Could not process the uploaded photos. Please try different images."}), 400
            
            # Average predictions across all photos
            image_risk_probs = {}
            for cat in ['Low', 'Moderate', 'High']:
                image_risk_probs[cat] = sum(p.get(cat, 0.0) for p in all_image_probs) / len(all_image_probs)
            print(f"Averaged {len(all_image_probs)} photo predictions")

        # === QUESTIONNAIRE MODEL (for questionnaire & combined modes) ===
        if assessment_mode in ['questionnaire', 'combined']:
            if model is None or encoders is None:
                return jsonify({"detail": "Questionnaire model not loaded"}), 500
            
            data['age'] = int(data.get('age', 0))
            data['sleep_hours'] = float(data.get('sleep_hours', 0.0))
            data['heredity'] = data.get('heredity') == 'true' or data.get('heredity') == 'True'
            
            required_fields = ['age', 'stress_level', 'diet', 'sleep_hours', 'scalp_condition', 'heredity']
            for field in required_fields:
                if field not in data:
                    return jsonify({"detail": f"Missing required field: {field}"}), 400

            input_data = {
                'age': [data['age']],
                'stress_level': [data['stress_level']],
                'diet': [data['diet']],
                'sleep_hours': [float(data['sleep_hours'])],
                'scalp_condition': [data['scalp_condition']],
                'heredity': [1 if data['heredity'] else 0]
            }
            df = pd.DataFrame(input_data)

            for col in ['stress_level', 'diet', 'scalp_condition']:
                if col in encoders:
                    try:
                        df[col] = encoders[col].transform(df[col])
                    except ValueError:
                        df[col] = encoders[col].transform([encoders[col].classes_[0]])

            # Apply scaler for numerical features if available
            if 'numeric_scaler' in encoders:
                numeric_cols = ['age', 'sleep_hours']
                try:
                    df[numeric_cols] = encoders['numeric_scaler'].transform(df[numeric_cols])
                except Exception as e:
                    print(f"Warning: Could not scale numerical features: {e}")

            q_pred = model.predict(df)[0]
            q_proba = model.predict_proba(df)[0]
            
            q_risk_probs = {}
            for i, cls_idx in enumerate(model.classes_):
                cat_name = encoders['risk_category'].inverse_transform([cls_idx])[0]
                q_risk_probs[cat_name] = float(q_proba[i])

        # === COMPUTE FINAL RESULT BASED ON MODE ===
        if assessment_mode == 'combined':
            if not image_risk_probs or not q_risk_probs:
                return jsonify({"detail": "Failed to process both sets of data for combined mode."}), 400
            
            # Late Fusion: Weighted Average (Photos 75%, Questionnaire 25%)
            # Objective physical evidence should outweigh subjective questionnaire answers.
            risk_breakdown = {}
            for cat in ['Low', 'Moderate', 'High']:
                risk_breakdown[cat] = (image_risk_probs.get(cat, 0.0) * 0.75) + (q_risk_probs.get(cat, 0.0) * 0.25)
            
            risk_category = max(risk_breakdown, key=risk_breakdown.get)
            risk_score = risk_breakdown[risk_category] * 100
            prediction_method = "ensemble_late_fusion"

        elif assessment_mode == 'photo':
            risk_category = max(image_risk_probs, key=image_risk_probs.get)
            risk_score = image_risk_probs[risk_category] * 100
            prediction_method = "image_analysis"
            risk_breakdown = image_risk_probs
            
        elif assessment_mode == 'questionnaire':
            risk_category = encoders['risk_category'].inverse_transform([q_pred])[0]
            risk_score = q_proba[q_pred] * 100
            prediction_method = "questionnaire_only"
            risk_breakdown = q_risk_probs
            
        else:
            return jsonify({"detail": f"Invalid mode: {assessment_mode}"}), 400

        # Replace static logic with Recommendation Engine logic
        import sys
        sys.path.append(os.path.join(current_dir, 'ml'))
        from recommendation_engine import generate_health_recommendation
        
        # Override risk_score/category strictly by the 0-100 threshold defined in the prompt requirement
        if assessment_mode == 'combined':
            # Highest probabilistic confidence from High category determines final risk score directly
            # For 0-100 logic, we calculate a continuous score.
            # Example: 75% High + 25% Mod = 0.75*100 + 0.25*50 = 87.5
            calc_score = (risk_breakdown.get('High', 0)*100) + (risk_breakdown.get('Moderate', 0)*50) + (risk_breakdown.get('Low', 0)*10)
            risk_score = calc_score
        elif assessment_mode == 'photo':
            risk_score = (image_risk_probs.get('severe', 0)*100) + (image_risk_probs.get('moderate', 0)*50) + (image_risk_probs.get('healthy', 0)*10)
        else:
            risk_score = (q_risk_probs.get('High', 0)*100) + (q_risk_probs.get('Moderate', 0)*50) + (q_risk_probs.get('Low', 0)*10)
            
        rec_data = generate_health_recommendation(risk_score, data)
        
        # Standardize category strings to UI expectations
        ui_cat = 'Low' if rec_data['risk_level'] == 'Low Risk' else 'Moderate' if rec_data['risk_level'] == 'Moderate Risk' else 'High'

        # Build response
        response = {
            "risk_score": rec_data["risk_percentage"],
            "risk_category": ui_cat,
            "explanation": rec_data["explanation"],
            "recommendations": rec_data["recommendations"],
            "disclaimer": rec_data["disclaimer"],
            "prediction_method": prediction_method,
            "risk_breakdown": {cat: round(p * 100, 1) for cat, p in risk_breakdown.items()},
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        
        # Add questionnaire data if it was provided
        inputs_dict = {}
        if assessment_mode in ['questionnaire', 'combined'] and data:
            inputs_dict = {
                "age": data.get('age'),
                "heredity": data.get('heredity'),
                "stress_level": data.get('stress_level'),
                "diet": data.get('diet'),
                "sleep_hours": data.get('sleep_hours'),
                "scalp_condition": data.get('scalp_condition')
            }
            response["inputs"] = inputs_dict
            if assessment_mode == 'questionnaire':
                response["disclaimer"] = "This prediction is based on questionnaire responses only and may not reflect clinical accuracy. For more reliable results, use Photo Analysis."

        if image_risk_probs:
            response["image_risk_breakdown"] = {cat: round(p * 100, 1) for cat, p in image_risk_probs.items()}
            response["photos_analyzed"] = len(all_image_probs)

        # Build DB Record
        try:
            from models import db, Assessment, User
            current_id = get_jwt_identity()
            user = User.query.get(int(current_id))
            if user:
                new_assessment = Assessment(
                    user_id=user.id,
                    risk_score=float(risk_score),
                    risk_category=risk_category,
                    prediction_method=prediction_method,
                    inputs_json=json.dumps(inputs_dict) if inputs_dict else None,
                    risk_breakdown_json=json.dumps(response.get("risk_breakdown", {}))
                )
                db.session.add(new_assessment)
                db.session.commit()
                print("Assessment saved to Database History")
        except Exception as db_err:
            try:
                log_path = os.path.join(os.path.dirname(__file__), 'error_log.txt')
                with open(log_path, 'a') as f:
                    f.write(f"DB Error for user {current_id}:\n")
                    f.write(traceback.format_exc() + '\n')
            except:
                pass
            print(f"Non-fatal error saving assessment to database: {db_err}")

        return jsonify(response), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"detail": str(e)}), 500
