#!/bin/bash

echo "🎨 Color Picker - Starting Development Environment"
echo "=================================================="
echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "Starting development server..."
echo "Press Ctrl+C to stop"
echo ""

npm run electron:dev
