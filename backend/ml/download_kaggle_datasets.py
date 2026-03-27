import os
import sys

def setup_kaggle_datasets():
    """
    Downloads and prepares multiple Kaggle datasets for Hair Fall analysis.
    Uses the kaggle Python API directly instead of the shell CLI for compatibility.
    Satisfies multi-angle and multi-condition dataset requirements.
    """
    
    try:
        from kaggle import KaggleApi
        api = KaggleApi()
        api.authenticate()
        print("Kaggle API authenticated successfully.\n")
    except Exception as e:
        print(f"Kaggle authentication failed: {e}")
        print("Ensure KAGGLE_USERNAME and KAGGLE_KEY are set as environment variables,")
        print("or that kaggle.json exists in C:\\Users\\<you>\\.kaggle\\kaggle.json")
        sys.exit(1)

    # Multi-angle & multi-condition datasets
    datasets = [
        "simongraves/male-hair-loss-dataset",    # Norwood-staged male hair loss (front/top/back)
        "sithukaungset/hairlossdataset",          # Bald vs Not-Bald (diverse angles)
        "bipuldiwakar/hair-disease-dataset",      # Hair disease conditions
        "fiqrisikumbang/alopecia-areata",         # Alopecia Areata scalp views
    ]
    
    data_dir = os.path.join(os.path.dirname(__file__), 'data', 'images')
    os.makedirs(data_dir, exist_ok=True)
    
    print(f"Target directory: {data_dir}\n")
    
    for idx, dataset in enumerate(datasets):
        target_path = os.path.join(data_dir, f"ds_extra_{idx}")
        os.makedirs(target_path, exist_ok=True)
        print(f"[{idx+1}/{len(datasets)}] Downloading: {dataset} ...")
        try:
            api.dataset_download_files(dataset, path=target_path, unzip=True, quiet=False)
            print(f"  -> Done!\n")
        except Exception as e:
            print(f"  -> FAILED: {e}\n")

    print("="*55)
    print("All downloads complete! Now run:")
    print("  python train_image_model.py")
    print("to retrain ResNet-50 on the expanded dataset.")
    print("="*55)

if __name__ == "__main__":
    setup_kaggle_datasets()
