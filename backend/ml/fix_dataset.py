import pandas as pd
import numpy as np
import os

def generate_risk(row):
    score = 0
    # Age factor
    age = pd.to_numeric(row.get('Age', 30), errors='coerce')
    if pd.isna(age): age = 30
    if age > 45: score += 1
    if age > 60: score += 1
    
    # Sleep factor
    sleep = pd.to_numeric(row.get('Sleep_Hours', 7), errors='coerce')
    if pd.isna(sleep): sleep = 7
    if sleep < 6: score += 1
    
    # Stress factor (1-10)
    stress = pd.to_numeric(row.get('Stress_Level', 5), errors='coerce')
    if pd.isna(stress): stress = 5
    if stress > 6: score += 1
    if stress > 8: score += 1
    
    # Diet factor
    protein = pd.to_numeric(row.get('Protein_Intake_g', 60), errors='coerce')
    if pd.isna(protein): protein = 60
    if protein < 60: score += 1
    if protein < 45: score += 1
    
    # Heredity
    heredity = str(row.get('Family_History', 'No')).lower()
    if 'yes' in heredity or 'true' in heredity or '1' in heredity:
        score += 2
        
    # Map score (0-8) to Hair_Fall_Grade (0-5)
    # Add minor randomness for realistic noise
    noise = np.random.normal(0, 0.5)
    final_score = score + noise
    
    if final_score <= 1.5:
        return np.random.choice([0, 1], p=[0.7, 0.3]) # Low
    elif final_score <= 3.5:
        return np.random.choice([2, 3], p=[0.5, 0.5]) # Moderate
    else:
        return np.random.choice([4, 5], p=[0.5, 0.5]) # High

def main():
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'hairfall_dataset_india_100k.csv')
    print("Loading original dataset...")
    df = pd.read_csv(data_path)
    
    print("Injecting clinical correlations...")
    np.random.seed(42) # Reproducibility
    df['Hair_Fall_Grade'] = df.apply(generate_risk, axis=1)
    
    print("Saving modified dataset...")
    df.to_csv(data_path, index=False)
    
    print("Checking new correlations with Hair_Fall_Grade:")
    print(df.corr(numeric_only=True)['Hair_Fall_Grade'])
    print("\nDataset generation complete!")

if __name__ == '__main__':
    main()
