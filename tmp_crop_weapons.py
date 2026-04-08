import os
from rembg import remove
from PIL import Image

def process_item(img, box, output_path, max_size=128):
    try:
        item = img.crop(box)
        # Convert to bytes for rembg
        from io import BytesIO
        img_byte_arr = BytesIO()
        item.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()
        
        output_data = remove(img_byte_arr)
        item_no_bg = Image.open(BytesIO(output_data))
        
        bbox = item_no_bg.getbbox()
        if bbox:
            item_no_bg = item_no_bg.crop(bbox)
            item_no_bg.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            item_no_bg.save(output_path)
            print(f"Saved {output_path}")
    except Exception as e:
        print(f"Error processing {output_path}: {e}")

RAW_IMG = r'C:\Users\chw34\.gemini\antigravity\brain\bc466e04-d7cc-4930-8698-a31aba9a3c31\nyangnyang_weapon_assets_1775630000000_1775629486314.png'
ASSET_DIR = r'c:\Users\chw34\OneDrive\Desktop\개발\nyangnyang\public\assets'

if os.path.exists(RAW_IMG):
    full_img = Image.open(RAW_IMG)
    w, h = full_img.size
    hw, hh = w // 2, h // 2
    
    # 1. Yarn (top-left)
    process_item(full_img, (0, 0, hw, hh), os.path.join(ASSET_DIR, 'yarn.png'))
    # 2. Yarn Evo (top-right)
    process_item(full_img, (hw, 0, w, hh), os.path.join(ASSET_DIR, 'yarn_evo.png'))
    # 3. Fishbone (bottom-left)
    process_item(full_img, (0, hh, hw, h), os.path.join(ASSET_DIR, 'fishbone.png'))
    # 4. Hairball (bottom-right)
    process_item(full_img, (hw, hh, w, h), os.path.join(ASSET_DIR, 'hairball.png'))

print("Weapon assets processed! 🐾⚔️")
