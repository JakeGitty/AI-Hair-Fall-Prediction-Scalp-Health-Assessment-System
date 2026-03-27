from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db
from routes.auth import auth_bp
from routes.predict import predict_bp
from routes.assessments import assessments_bp
from routes.doctors import doctors_bp
import os

def create_app():
    app = Flask(__name__)
    
    # Configure CORS - frontend is at 5173 normally, but allowing all for development
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Configure Database
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, 'hairfall_app.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Configure JWT
    app.config['JWT_SECRET_KEY'] = 'super-secret-key' # In production, use a secure secret key
    from datetime import timedelta
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    
    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='')
    app.register_blueprint(predict_bp, url_prefix='/predict')
    app.register_blueprint(assessments_bp, url_prefix='/assessments')
    app.register_blueprint(doctors_bp, url_prefix='')
    
    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        # Create tables if they don't exist
        db.create_all()
        
    app.run(debug=True, host='127.0.0.1', port=8000)
