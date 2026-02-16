# Color Picker - Quick Reference

## 🚀 Get Started (3 commands)
```bash
cd color-picker
npm install
npm run electron:dev
```

## ⌨️ Keyboard Shortcuts
- `Ctrl+Shift+C` (Win/Linux) or `Cmd+Shift+C` (Mac) → Start capture
- `Escape` → Cancel capture

## 🎯 How to Use
1. Press `Ctrl+Shift+C` anywhere
2. Move cursor to desired color
3. Click to copy
4. Paste HEX code anywhere

## 📁 Project Structure
```
color-picker/
├── electron/          # Main process (Node.js)
│   ├── main.ts       # App entry point
│   ├── windows.ts    # Window management
│   ├── shortcuts.ts  # Global shortcuts
│   └── capture.ts    # Screen capture
├── preload/          # IPC bridge
│   └── index.ts      # Secure API
├── src/              # React app
│   ├── screens/
│   │   ├── Explore.tsx   # Control window
│   │   └── Capture.tsx   # Picker overlay
│   ├── components/
│   │   └── Magnifier.tsx # Canvas magnifier
│   ├── shared/
│   │   └── color.ts      # RGB ↔ HEX
│   └── styles/
│       └── glass.css     # Glassmorphism
└── package.json
```

## 🔧 Key Technologies
- **Electron** - Desktop framework
- **React + TypeScript** - UI
- **Vite** - Build tool
- **Canvas** - Magnifier rendering
- **contextBridge** - Secure IPC

## 🎨 Features
✅ Instant color picking  
✅ 7x7 pixel magnifier  
✅ Auto-copy to clipboard  
✅ HEX format (uppercase)  
✅ 150ms feedback  
✅ Global shortcut  
✅ Frameless glass UI  
✅ Zero intrusion  

## 🏗️ Build for Production
```bash
npm run build
npm run electron:build
```

## 📝 Application Flow
```
Background → Ctrl+Shift+C → Fullscreen Capture
    ↓              ↑              ↓
Explore ──────────────────── Click Color
                               ↓
                          Copy & Close (150ms)
```

## 🔒 Security
- ✅ Context isolation enabled
- ✅ Node integration disabled
- ✅ Secure contextBridge API
- ✅ No direct Node.js in renderer

## 💡 Pro Tips
- Global shortcut works even when app is hidden
- Escape cancels without copying
- Magnifier shows exact pixel being captured
- App stays in background after use

## 📚 Documentation
- `README.md` - Overview & installation
- `USAGE_GUIDE.md` - Detailed usage & troubleshooting
- This file - Quick reference

---
**Made with ❤️ using Electron + React + TypeScript**
