import os
from PIL import Image   # Pillow library

# Directory with your PNGs (change this if needed)
directory = "./"

# Rotation angle in degrees (90, 180, 270, etc.)
angle = 90

for filename in os.listdir(directory):
    if filename.lower().endswith(".png"):
        path = os.path.join(directory, filename)

        # Open image
        with Image.open(path) as img:
            # Rotate and save (expand keeps full size after rotation)
            rotated = img.rotate(-angle, expand=True)
            rotated.save(path)

        print(f"Rotated: {filename}")
