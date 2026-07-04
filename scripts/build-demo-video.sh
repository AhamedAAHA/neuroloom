#!/usr/bin/env bash
# Build 3-min demo MP4 from narration + slide images (requires ffmpeg + edge-tts)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUDIO_DIR="$ROOT/presentation/demo-audio"
VIDEO_OUT="$ROOT/presentation/neuroloom-demo-3min.mp4"
HTML="$ROOT/presentation/demo-video.html"

echo "=== Step 1: Generate narration (Jenny neural voice) ==="
python3 "$ROOT/scripts/generate-demo-narration.py"

echo "=== Step 2: Concatenate audio ==="
LIST="$AUDIO_DIR/concat.txt"
: > "$LIST"
for f in "$AUDIO_DIR"/*.mp3; do
  echo "file '$f'" >> "$LIST"
done
ffmpeg -y -f concat -safe 0 -i "$LIST" -c copy "$AUDIO_DIR/full-narration.mp3"

echo "=== Step 3: Record demo HTML to video (manual fallback) ==="
echo "Open file://$HTML in Chrome fullscreen and screen-record 3 minutes,"
echo "OR run: ffmpeg -f x11grab ... (requires display capture)"
echo ""
echo "Quick combine (black background + audio only):"
ffmpeg -y -f lavfi -i color=c=0x09090b:s=1920x1080:d=$(ffprobe -i "$AUDIO_DIR/full-narration.mp3" -show_entries format=duration -v quiet -of csv=p=0 | cut -d. -f1) \
  -i "$AUDIO_DIR/full-narration.mp3" -c:v libx264 -c:a aac -shortest "$VIDEO_OUT" 2>/dev/null || true

echo "Audio ready: $AUDIO_DIR/full-narration.mp3"
echo "Interactive demo: $HTML"
echo "Presentation: $ROOT/presentation/index.html"
