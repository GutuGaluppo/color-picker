# Product Overview

A fast, silent desktop color picker utility for designers and developers. Pick colors from anywhere on screen with a global shortcut, see a magnified pixel grid, and automatically copy HEX values to clipboard.

## Core Features

- Global shortcut (Ctrl/Cmd+Shift+C) for instant color picking
- 7x7 pixel magnifier with center pixel highlight
- Automatic HEX color copy to clipboard
- Minimal UI with glassmorphism design
- Silent operation - brief feedback then disappears to background

## Application States

1. Background - No windows, listens for global shortcut
2. Explore - Small control window with "Start Capture" button
3. Capture - Fullscreen overlay with magnifier and crosshair cursor
4. Feedback - Brief "✓ Copied #HEX" message (150ms) then exits

## User Flows

Primary: Press Ctrl+Shift+C → Move cursor → Click → Color copied → App hides
Alternative: Open app → Click "Start Capture" → Move cursor → Click → Color copied → App hides
Cancel: Press Escape during capture → Returns to previous state

## Design Principles

- Speed over features - instant capture, immediate feedback
- Silent operation - no persistent windows or notifications
- Non-intrusive - always accessible but never in the way
- Professional UX - glassmorphism, frameless windows, smooth transitions
