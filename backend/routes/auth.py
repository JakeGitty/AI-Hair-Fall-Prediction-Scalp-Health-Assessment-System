from flask import Blueprint, request, jsonify
from models import db, User
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password') or not data.get('full_name'):
        return jsonify({"detail": "Missing email, password, or full_name"}), 400

    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({"detail": "Email already registered"}), 400

    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(
        full_name=data['full_name'],
        email=data['email'],
        hashed_password=hashed_pw
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        "id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    # Frontend sends form-data per OAuth2 spec (username=email, password=password)
    email = request.form.get('username')
    password = request.form.get('password')

    if not email or not password:
        return jsonify({"detail": "Missing username or password"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.hashed_password, password):
        return jsonify({"detail": "Invalid credentials"}), 401

    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }), 200
