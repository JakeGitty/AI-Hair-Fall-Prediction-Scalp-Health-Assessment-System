from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
from models import Assessment, User

assessments_bp = Blueprint('assessments', __name__)

@assessments_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    try:
        current_id = get_jwt_identity()
        user = User.query.get(int(current_id))
        
        if not user:
            return jsonify({"detail": "User not found"}), 404
            
        assessments = Assessment.query.filter_by(user_id=user.id).order_by(Assessment.created_at.asc()).all()
        
        history = []
        for a in assessments:
            history.append({
                "id": a.id,
                "risk_score": a.risk_score,
                "risk_category": a.risk_category,
                "prediction_method": a.prediction_method,
                "inputs": json.loads(a.inputs_json) if a.inputs_json else {},
                "risk_breakdown": json.loads(a.risk_breakdown_json) if a.risk_breakdown_json else {},
                "created_at": a.created_at.isoformat() + "Z"
            })
            
        return jsonify({"history": history}), 200
        
    except Exception as e:
        return jsonify({"detail": str(e)}), 500
