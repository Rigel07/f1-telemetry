#!/bin/bash

# Deployment script for F1 Telemetry Backend

echo "🏁 Preparing F1 Telemetry Backend for deployment..."

# Create replays directory in listener folder for deployment
mkdir -p listener/replays

# Copy replay files to the backend directory
echo "📁 Copying replay files..."
cp replays/*.sqlite3 listener/replays/ 2>/dev/null || echo "No .sqlite3 files found in replays/"

# Also copy any other replay formats if they exist
cp replays/*.db listener/replays/ 2>/dev/null || true

echo "✅ Replay files copied to listener/replays/"
echo "📋 Files in deployment replays folder:"
ls -la listener/replays/

echo "🚀 Backend ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Deploy the entire project (including listener/replays/) to your backend platform"
echo "2. The replay_server.py will automatically find files in the replays folder"
echo "3. Update your frontend VITE_API_URL to point to your deployed backend"
