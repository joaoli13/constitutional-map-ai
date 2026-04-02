#!/usr/bin/env python3
"""Run the full TCA pipeline from M1 through M4.5."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

PIPELINE_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = PIPELINE_ROOT / "scripts"
STAGES = ("m1", "m2", "m3", "m4", "m4_5", "m4_6")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the full TCA pipeline.")
    parser.add_argument("--from-stage", choices=STAGES, default="m1", help="First stage to run.")
    parser.add_argument("--to-stage", choices=STAGES, default="m4_6", help="Last stage to run.")
    parser.add_argument("--limit", type=int, default=None, help="Forward a row/country limit to supported stages.")
    parser.add_argument("--country-code", default=None, help="Forward one ISO alpha-3 filter to supported stages.")
    parser.add_argument("--skip-neon", action="store_true", help="Skip Neon ingest during M4.5.")
    parser.add_argument(
        "--log-level",
        choices=("DEBUG", "INFO", "WARNING", "ERROR"),
        default="INFO",
        help="Logging verbosity.",
    )
    return parser.parse_args()


def stage_command(stage: str, args: argparse.Namespace) -> list[str]:
    script_map = {
        "m1": SCRIPTS_DIR / "run_m1.py",
        "m2": SCRIPTS_DIR / "run_m2.py",
        "m3": SCRIPTS_DIR / "run_m3.py",
        "m4": SCRIPTS_DIR / "run_m4.py",
        "m4_5": SCRIPTS_DIR / "run_m4_5.py",
        "m4_6": SCRIPTS_DIR / "run_m4_6.py",
    }
    command = [sys.executable, str(script_map[stage]), "--log-level", args.log_level]

    if args.limit is not None and stage in {"m1", "m2", "m3", "m4"}:
        command.extend(["--limit", str(args.limit)])
    if args.country_code and stage in {"m2", "m3", "m4"}:
        command.extend(["--country-code", args.country_code])
    if args.skip_neon and stage == "m4_5":
        command.append("--skip-neon")
    return command


def main() -> int:
    args = parse_args()
    start = STAGES.index(args.from_stage)
    end = STAGES.index(args.to_stage)
    if start > end:
        raise ValueError("--from-stage must come before --to-stage.")

    for stage in STAGES[start : end + 1]:
        command = stage_command(stage, args)
        print(f"Running {stage}: {' '.join(command)}")
        subprocess.run(command, cwd=PIPELINE_ROOT, check=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
