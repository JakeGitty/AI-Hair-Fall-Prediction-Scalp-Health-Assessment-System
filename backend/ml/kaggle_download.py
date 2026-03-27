import os
import requests
import shutil
import zipfile
import glob

# Try using kagglehub to securely download via the user's active token
import kagglehub

def find_kaggle_dataset(query, token):
    url = f'https://www.kaggle.com/api/v1/datasets/list?search={query}'
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.get(url, headers=headers)
    if r.status_code == 200:
        results = [d.get('ref') for d in r.json()]
        return results
    return []

def main():
    token = 'KGAT_86a19da92383b4ec53e0c9bba4256333'
    os.environ['KAGGLE_API_TOKEN'] = token
    
    base_dir = os.path.join("data", "images", "ds9")
    healthy_dir = os.path.join(base_dir, "healthy")
    severe_dir = os.path.join(base_dir, "severe")
    
    os.makedirs(healthy_dir, exist_ok=True)
    os.makedirs(severe_dir, exist_ok=True)
    
    print("Searching for Psoriasis datasets...")
    psoriasis_datasets = find_kaggle_dataset('psoriasis', token)
    alopecia_datasets = find_kaggle_dataset('alopecia', token)
    
    # Pick a known good multi-class skin lesion dataset if specific ones are sketchy
    # Or just download the top hit for psoriasis
    if psoriasis_datasets:
        top_psoriasis = psoriasis_datasets[0]
        print(f"Found Dataset: {top_psoriasis}. Downloading via kagglehub...")
        try:
            path = kagglehub.dataset_download(top_psoriasis)
            print(f"Downloaded to {path}. Extracting to severe...")
            
            # Find and copy images
            for img in glob.glob(os.path.join(path, '**', '*.jpg'), recursive=True) + glob.glob(os.path.join(path, '**', '*.png'), recursive=True):
                shutil.copy2(img, os.path.join(severe_dir, os.path.basename(img)))
                
        except Exception as e:
            print(f"Error downloading {top_psoriasis}: {e}")
            
    # Try downloading hair/scalp for healthy
    healthy_datasets = find_kaggle_dataset('hair health', token)
    if healthy_datasets:
        top_healthy = healthy_datasets[0]
        print(f"Found Dataset: {top_healthy}. Downloading via kagglehub...")
        try:
            path = kagglehub.dataset_download(top_healthy)
            print(f"Downloaded to {path}. Extracting to healthy...")
            
            # Extract images to healthy
            for img in glob.glob(os.path.join(path, '**', '*.jpg'), recursive=True) + glob.glob(os.path.join(path, '**', '*.png'), recursive=True):
                shutil.copy2(img, os.path.join(healthy_dir, f"healthy_{os.path.basename(img)}"))
        except Exception as e:
            print(f"Error downloading {top_healthy}: {e}")
            
    print(f"\nDone! Extracted images into ds9.")

if __name__ == '__main__':
    main()
