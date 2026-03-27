import pandas as pd
import joblib
import os
from sklearn.metrics import accuracy_score

data_path = os.path.join(os.path.dirname(__file__), 'data', 'hairfall_dataset_india_100k.csv')
df = pd.read_csv(data_path)
df = df.ffill()

df['age'] = pd.to_numeric(df['Age'], errors='coerce').fillna(df['Age'].median())
df['sleep_hours'] = pd.to_numeric(df['Sleep_Hours'], errors='coerce').fillna(df['Sleep_Hours'].median())
df['heredity'] = df['Family_History'].apply(lambda x: 1 if str(x).lower() in ['yes', '1', 'true'] else 0)
df['Stress_Level'] = pd.to_numeric(df['Stress_Level'], errors='coerce').fillna(5)

def map_stress(val):
    if val <= 3: return 'Low'
    elif val <= 6: return 'Medium'
    else: return 'High'
df['stress_level'] = df['Stress_Level'].apply(map_stress)

df['Protein_Intake_g'] = pd.to_numeric(df['Protein_Intake_g'], errors='coerce').fillna(60)
def map_diet(protein):
    if protein < 50: return 'Poor'
    elif protein < 80: return 'Average'
    else: return 'Good'
df['diet'] = df['Protein_Intake_g'].apply(map_diet)

def map_scalp(diag):
    diag_str = str(diag).lower()
    if 'alopecia' in diag_str: return 'Dry'
    elif 'stress' in diag_str: return 'Normal'
    elif 'nutritional' in diag_str: return 'Dandruff'
    else: return 'Oily'
df['scalp_condition'] = df['Diagnosis'].apply(map_scalp)

df['Hair_Fall_Grade'] = pd.to_numeric(df['Hair_Fall_Grade'], errors='coerce').fillna(0)
def map_risk(grade):
    if grade <= 1: return 'Low'
    elif grade <= 3: return 'Moderate'
    else: return 'High'
df['risk_category'] = df['Hair_Fall_Grade'].apply(map_risk)

encoders = joblib.load(os.path.join(os.path.dirname(__file__), 'encoders.joblib'))
model = joblib.load(os.path.join(os.path.dirname(__file__), 'hairfall_model.joblib'))

for col in ['stress_level', 'diet', 'scalp_condition']:
    df[col] = encoders[col].transform(df[col])

df['risk_category'] = encoders['risk_category'].transform(df['risk_category'])

features = ['age', 'stress_level', 'diet', 'sleep_hours', 'scalp_condition', 'heredity']
X = df[features].copy()
y = df['risk_category']

if 'numeric_scaler' in encoders:
    numeric_cols = ['age', 'sleep_hours']
    X[numeric_cols] = encoders['numeric_scaler'].transform(X[numeric_cols])

y_pred = model.predict(X)
print(f"Full Dataset Accuracy: {accuracy_score(y, y_pred):.4f}")

importances = model.feature_importances_
print("\nFeature Importances:")
for f, imp in zip(features, importances):
    print(f"{f}: {imp:.4f}")
