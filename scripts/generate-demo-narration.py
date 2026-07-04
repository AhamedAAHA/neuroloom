#!/usr/bin/env python3
"""Generate female-voice narration for Neuroloom 3-min demo (edge-tts)."""
import asyncio
import subprocess
import sys
from pathlib import Path

try:
    import edge_tts
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "edge-tts", "-q"])
    import edge_tts

VOICE = "en-US-JennyNeural"
OUT = Path(__file__).resolve().parent.parent / "presentation" / "demo-audio"

SEGMENTS = [
    ("01-intro", "Hi! I'm guiding you through Neuroloom — built by team Prompt Pirates. Ahamed AAH and Avashik Ahamed created the family care command center that keeps siblings, caregivers, and seniors aligned."),
    ("02-problem", "Families juggle medications, discharge papers, shift handoffs, and emergencies across four different apps. Neuroloom replaces that chaos with one intelligent dashboard powered by nine specialized AI agents."),
    ("03-agents", "Our Conductor agent routes every action through a pipeline. MedGuard extracts prescriptions. Document Vault summarizes hospital discharge PDFs. Schedule Keeper auto-builds reminders. Trend Analyst watches mood patterns. Family Sync coordinates tasks. Emergency Pack compiles ER-ready packets in one tap."),
    ("04-amd", "Every agent runs on Google Gemma, optimized for AMD GPUs through ROCm and vLLM. When AMD inference is online, the dashboard badge turns green. Fireworks AI provides intelligent overflow for longer context."),
    ("05-dashboard", "Here's the Command Center. Stats update live. The activity timeline merges medications, check-ins, handoffs, and agent runs. Expand any agent in the history panel to see the full pipeline — Conductor to MedGuard to Schedule Keeper — exactly what judges want to see."),
    ("06-senior", "Seniors get a simplified view with large buttons. One tap sends mood check-ins to the family. Morning and evening medication buttons log adherence. Voice commands and MediaPipe hand gestures let caregivers control the dashboard hands-free."),
    ("07-graph", "The knowledge graph connects medications, documents, events, and check-ins with semantic edges — not random links. Zoom controls and a mini-map help families explore complex care relationships visually."),
    ("08-close", "Neuroloom — your family care command center. Multi-agent intelligence on AMD Gemma. Built for the AMD Developer Hackathon. Team Prompt Pirates. Thank you for watching!"),
]


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for name, text in SEGMENTS:
        path = OUT / f"{name}.mp3"
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(str(path))
        manifest.append(f"{name}.mp3")
        print(f"Generated {path.name}")
    (OUT / "manifest.txt").write_text("\n".join(manifest))
    print(f"Done — {len(SEGMENTS)} segments in {OUT}")


if __name__ == "__main__":
    asyncio.run(main())
