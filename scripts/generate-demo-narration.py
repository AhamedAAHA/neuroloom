#!/usr/bin/env python3
"""Professional narration for Neuroloom 3-min demo (edge-tts)."""
import asyncio
import subprocess
import sys
from pathlib import Path

try:
    import edge_tts
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "edge-tts", "-q"])
    import edge_tts

# Calm, professional US English
VOICE = "en-US-AriaNeural"
RATE = "-10%"
PITCH = "-1Hz"
OUT = Path(__file__).resolve().parent.parent / "presentation" / "demo-audio"

SEGMENTS = [
    (
        "01-intro",
        "Welcome to Neuroloom — presented by Team Prompt Pirates. "
        "Ahamed AAH and Avashik Ahamed built a family care command center that keeps "
        "siblings, caregivers, and seniors aligned in one place.",
    ),
    (
        "02-problem",
        "Families today coordinate care across disconnected tools — medications in one app, "
        "discharge papers in email, handoffs in group chats. "
        "That fragmentation drives missed doses, delayed shift updates, and stress during "
        "the critical seventy-two hour post-discharge window.",
    ),
    (
        "03-agents",
        "Neuroloom replaces that chaos with nine specialized AI agents, orchestrated by a Conductor. "
        "MedGuard extracts prescriptions. Document Vault summarizes hospital PDFs. "
        "Schedule Keeper builds reminders. Trend Analyst monitors mood patterns. "
        "Family Sync coordinates tasks. Emergency Pack compiles ER-ready packets in one tap.",
    ),
    (
        "04-amd",
        "Every agent runs on Google Gemma, optimized for AMD GPUs through ROCm and vLLM. "
        "Our OpenAI-compatible inference service routes requests to AMD first. "
        "When inference is live, the dashboard badge confirms Gemma on AMD is online.",
    ),
    (
        "05-dashboard",
        "The Command Center unifies everything — live stats, an activity timeline, "
        "a semantic knowledge graph, and expandable agent history. "
        "Judges can trace full pipelines from Conductor through MedGuard to Schedule Keeper in real time.",
    ),
    (
        "06-senior",
        "Seniors get a simplified large-touch interface — mood check-ins, morning and evening medication logging, "
        "and one-tap family contact. Caregivers control the dashboard with voice commands "
        "and MediaPipe hand gestures when their hands are full.",
    ),
    (
        "07-graph",
        "The knowledge graph connects medications, documents, events, and check-ins "
        "with meaningful edges — prescribed in, derived from, scheduled as — "
        "so families see relationships, not random links.",
    ),
    (
        "08-close",
        "Neuroloom — your family care command center. "
        "Multi-agent intelligence on AMD Gemma. "
        "Team Prompt Pirates. Thank you.",
    ),
]


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, text in SEGMENTS:
        path = OUT / f"{name}.mp3"
        communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
        await communicate.save(str(path))
        print(f"Generated {path.name}")
    print(f"Done — {len(SEGMENTS)} segments → {OUT}")


if __name__ == "__main__":
    asyncio.run(main())
