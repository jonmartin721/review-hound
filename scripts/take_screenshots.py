#!/usr/bin/env python3
"""
Generate the README screenshots from the current Next.js demo frontend.

Usage:
    python3 scripts/take_screenshots.py
"""

from __future__ import annotations

import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def main() -> int:
    command = ["npm", "--workspace", "frontend", "run", "screenshots:readme"]
    completed = subprocess.run(command, cwd=PROJECT_ROOT)
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
