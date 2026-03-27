import os
import requests

def download_wikimedia_images(query, folder_name, limit=30):
    os.makedirs(folder_name, exist_ok=True)
    print(f"Querying Wikimedia Commons for: {query}...")
    
    url = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": query,
        "gsrlimit": limit,
        "prop": "imageinfo",
        "iiprop": "url",
        "format": "json"
    }
    
    headers = {'User-Agent': 'TeleHairBot/1.0 (Student Project)'}
    
    try:
        response = requests.get(url, params=params, headers=headers).json()
        pages = response.get("query", {}).get("pages", {})
        
        print(f"Found {len(pages)} images for '{query}'. Downloading...")
        
        downloaded = 0
        for page_id, page_info in pages.items():
            if "imageinfo" in page_info:
                img_url = page_info["imageinfo"][0]["url"]
                
                # Only download standard images
                ext = img_url.split('.')[-1].lower()
                if ext not in ['jpg', 'jpeg', 'png']:
                    continue
                    
                req = requests.get(img_url, timeout=10, headers=headers)
                if req.status_code == 200:
                    import uuid
                    unique_name = str(uuid.uuid4())[:8]
                    file_path = os.path.join(folder_name, f"{query.replace(' ', '_')}_{unique_name}.{ext}")
                    
                    with open(file_path, 'wb') as f:
                        f.write(req.content)
                    downloaded += 1
                    
        print(f"Successfully downloaded {downloaded} clinical images.\n")
        return downloaded
    except Exception as e:
        print(f"Error scraping {query}: {e}")
        return 0

def main():
    base_dir = os.path.join("data", "images", "ds9")
    healthy_dir = os.path.join(base_dir, "healthy")
    severe_dir = os.path.join(base_dir, "severe")
    
    print("=== AUTONOMOUS WIKIMEDIA SCRAPER ===")
    
    download_wikimedia_images("scalp psoriasis", severe_dir, 50)
    download_wikimedia_images("alopecia areata scalp", severe_dir, 50)
    download_wikimedia_images("tinea capitis", severe_dir, 30)
    download_wikimedia_images("hair thinning dermoscopy", severe_dir, 20)
    
    download_wikimedia_images("healthy human scalp", healthy_dir, 50)
    download_wikimedia_images("hair macro photography", healthy_dir, 30)
    
    print("Scraping Complete! `ds9` is populated for ResNet-50.")

if __name__ == "__main__":
    main()
