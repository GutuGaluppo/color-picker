#!/usr/bin/env python3
"""
Generate system tray icons for the color picker application.
Creates PNG icons for macOS/Linux and ICO for Windows.
"""

from PIL import Image, ImageDraw
import os

def create_color_picker_icon(size):
    """Create a simple color picker icon with a palette design."""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Define colors for the palette
    colors = [
        (255, 59, 48),   # Red
        (52, 199, 89),   # Green
        (0, 122, 255),   # Blue
        (255, 204, 0),   # Yellow
    ]
    
    # Draw a simple 2x2 grid of colored squares
    square_size = size // 2
    for i, color in enumerate(colors):
        x = (i % 2) * square_size
        y = (i // 2) * square_size
        draw.rectangle(
            [x, y, x + square_size - 1, y + square_size - 1],
            fill=color
        )
    
    return img

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Create 16x16 icon for macOS (Template icon)
    icon_16 = create_color_picker_icon(16)
    icon_16.save(os.path.join(script_dir, 'tray-icon-mac.png'))
    print("Created tray-icon-mac.png (16x16)")
    
    # Create 32x32 icon for Linux
    icon_32 = create_color_picker_icon(32)
    icon_32.save(os.path.join(script_dir, 'tray-icon-linux.png'))
    print("Created tray-icon-linux.png (32x32)")
    
    # Create ICO file for Windows with multiple sizes
    icon_16_win = create_color_picker_icon(16)
    icon_32_win = create_color_picker_icon(32)
    icon_16_win.save(
        os.path.join(script_dir, 'tray-icon-win.ico'),
        format='ICO',
        sizes=[(16, 16), (32, 32)]
    )
    print("Created tray-icon-win.ico (16x16, 32x32)")

if __name__ == '__main__':
    main()
