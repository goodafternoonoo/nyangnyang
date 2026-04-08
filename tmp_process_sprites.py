import os
from rembg import remove
from PIL import Image

def remove_bg(input_path, output_path, max_size=512):
    try:
        print(f"Processing {os.path.basename(input_path)}...")
        with open(input_path, 'rb') as i:
            input_data = i.read()
            output_data = remove(input_data)
            
        temp_path = output_path + ".tmp.png"
        with open(temp_path, 'wb') as o:
            o.write(output_data)
            
        img = Image.open(temp_path)
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            img.save(output_path)
            print(f"Successfully processed, cropped and saved to {output_path}")
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

RAW_DIR = r'C:\Users\chw34\.gemini\antigravity\brain\bc466e04-d7cc-4930-8698-a31aba9a3c31'
ASSET_DIR = r'c:\Users\chw34\OneDrive\Desktop\개발\nyangnyang\public\assets'

tasks = [
    ('nyangnyang_floor_stain_1775628500000_1775629363808.png', 'stain.png', 128)
]

for raw_name, asset_name, size in tasks:
    input_path = os.path.join(RAW_DIR, raw_name)
    output_path = os.path.join(ASSET_DIR, asset_name)
    if os.path.exists(input_path):
        remove_bg(input_path, output_path, max_size=size)
    else:
        print(f"Skipping {raw_name}, file not found.")

print("All tasks completed! 🐾✨")
