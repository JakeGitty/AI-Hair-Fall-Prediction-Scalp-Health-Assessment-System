from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, index=True)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, index=True, nullable=False)
    hashed_password = db.Column(db.String(255), nullable=False)
    
    # Relationship to assessments
    assessments = db.relationship('Assessment', backref='user', lazy=True, cascade="all, delete-orphan")

class Assessment(db.Model):
    __tablename__ = 'assessments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Core Results
    risk_score = db.Column(db.Float, nullable=False)
    risk_category = db.Column(db.String(50), nullable=False)
    prediction_method = db.Column(db.String(50), nullable=False)
    
    # Detailed Data (Stored as JSON strings)
    inputs_json = db.Column(db.Text, nullable=True)
    risk_breakdown_json = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
