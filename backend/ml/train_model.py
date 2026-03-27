import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, RandomizedSearchCV, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os



def train_and_save_model():
    print("Loading Kaggle dataset...")
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'hairfall_dataset_india_100k.csv')
    df = pd.read_csv(data_path)
    
    # Fill missing values
    df = df.ffill()
    
    # 1. Age and Sleep_Hours
    df['age'] = pd.to_numeric(df['Age'], errors='coerce').fillna(df['Age'].median())
    df['sleep_hours'] = pd.to_numeric(df['Sleep_Hours'], errors='coerce').fillna(df['Sleep_Hours'].median())
    
    # 2. Family_History -> heredity
    # Assuming 'Yes'/'No' or 0/1, force to int 0/1
    df['heredity'] = df['Family_History'].apply(lambda x: 1 if str(x).lower() in ['yes', '1', 'true'] else 0)
    
    # 3. Stress_Level (1-10) -> ['Low', 'Medium', 'High']
    df['Stress_Level'] = pd.to_numeric(df['Stress_Level'], errors='coerce').fillna(5)
    def map_stress(val):
        if val <= 3: return 'Low'
        elif val <= 6: return 'Medium'
        else: return 'High'
    df['stress_level'] = df['Stress_Level'].apply(map_stress)
    
    # 4. Diet from Protein Intake
    df['Protein_Intake_g'] = pd.to_numeric(df['Protein_Intake_g'], errors='coerce').fillna(60)
    def map_diet(protein):
        if protein < 50: return 'Poor'
        elif protein < 80: return 'Average'
        else: return 'Good'
    df['diet'] = df['Protein_Intake_g'].apply(map_diet)
    
    # Scalp Condition from Diagnosis
    def map_scalp(diag):
        diag_str = str(diag).lower()
        if 'alopecia' in diag_str: return 'Dry'
        elif 'stress' in diag_str: return 'Normal'
        elif 'nutritional' in diag_str: return 'Dandruff'
        else: return 'Oily'
    df['scalp_condition'] = df['Diagnosis'].apply(map_scalp)
    
    # 5. Target: Hair_Fall_Grade (0-5) -> risk_category
    df['Hair_Fall_Grade'] = pd.to_numeric(df['Hair_Fall_Grade'], errors='coerce').fillna(0)
    def map_risk(grade):
        if grade <= 1: return 'Low'
        elif grade <= 3: return 'Moderate'
        else: return 'High'
    df['risk_category'] = df['Hair_Fall_Grade'].apply(map_risk)
    
    # Preprocessing
    categorical_features = ['stress_level', 'diet', 'scalp_condition']
    numeric_features = ['age', 'sleep_hours']
    
    encoders = {}

    for col in categorical_features:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        encoders[col] = le
        
    df['heredity'] = df['heredity'].astype(int)
    
    # Target encoding
    target_le = LabelEncoder()
    df['risk_category'] = target_le.fit_transform(df['risk_category'])
    encoders['risk_category'] = target_le
    
    # Select final features matches API 'routes/predict.py'
    features = ['age', 'stress_level', 'diet', 'sleep_hours', 'scalp_condition', 'heredity']
    X = df[features].copy()
    y = df['risk_category']
    
    # Scale numerical features and save scaler
    scaler = StandardScaler()
    X[numeric_features] = scaler.fit_transform(X[numeric_features])
    encoders['numeric_scaler'] = scaler
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("Tuning Hyperparameters for Random Forest...")
    rf_base = RandomForestClassifier(class_weight='balanced', random_state=42)
    
    param_grid = {
        'n_estimators': [50, 100, 200],
        'max_depth': [None, 10, 20],
        'min_samples_split': [2, 5],
        'min_samples_leaf': [1, 2],
        'max_features': ['sqrt', 'log2']
    }
    
    rf_random = RandomizedSearchCV(estimator=rf_base, param_distributions=param_grid, 
                                   n_iter=10, cv=3, verbose=2, random_state=42, n_jobs=-1)
    
    rf_random.fit(X_train, y_train)
    best_rf = rf_random.best_estimator_
    print(f"\nBest Hyperparameters: {rf_random.best_params_}")
    
    y_pred = best_rf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nOptimized Model Accuracy on Test Set: {accuracy:.4f}")
    
    # Cross Validation
    cv_scores = cross_val_score(best_rf, X, y, cv=5)
    print(f"5-Fold CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
    
    # Explainability
    print("\nClassification Report:")
    target_names = target_le.inverse_transform(np.unique(y_test))
    print(classification_report(y_test, y_pred, target_names=target_names))
    
    importances = best_rf.feature_importances_
    indices = np.argsort(importances)[::-1]
    print("Feature Importance Ranking:")
    for f in range(X.shape[1]):
        print(f"{f + 1}. {features[indices[f]]} ({importances[indices[f]]:.4f})")
    
    # Save model and encoders
    model_path = os.path.join(os.path.dirname(__file__), 'hairfall_model.joblib')
    encoders_path = os.path.join(os.path.dirname(__file__), 'encoders.joblib')
    
    joblib.dump(best_rf, model_path)
    joblib.dump(encoders, encoders_path)
    
    print(f"\nModel saved to {model_path}")
    print(f"Encoders & Scaler saved to {encoders_path}")

if __name__ == "__main__":
    train_and_save_model()
