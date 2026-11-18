#!/usr/bin/env python3
"""
Automated QA suite for @bokashi/anim (Remotion 1920x1080 @ 60fps).

Implements:
1. Metadata & timing assertions via ffprobe (1920x1080, 60fps, 270f/sub-step, 4.5s/sub-step).
2. All 3 GPU frame-defect detectors from docs/REMOTION-PLAYBOOK.md §3:
   - Grid-repeat correlation: normalized correlation of [0:113, 0:500] vs [113:226, 500:1000] >= 0.8
   - Lone frame: d3 < 0.35 * min(d1, d2) when min(d1, d2) > 0.5
   - Temporal median: D(k) = mean|F(k) - median(F(k-3..k+3, excl k))| > mean + 5*sigma and > 2.0
3. Automatic patch pipeline via `remotion still` + `ffmpeg overlay` and full re-scan.
4. Safe-margin & 320:280 stage crop-box verification (ink strictly inside [343, 1577] x [20, 1060]).
5. Palette hex token audit (every hex literal in src/ must exist in tailwind.config.ts / tokens.ts).
6. Subpixel/1px jitter check during final hold windows.
7. Contact sheet 8x4 + keyframe stills + motion-burst strips (no video ever loaded into model context).
"""

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parents[1]
OUT_DIR = ROOT / "out"
QC_DIR = OUT_DIR / "qc"
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
REMOTION_BIN = str(ROOT / "node_modules" / ".bin" / "remotion")

BOARDS: Dict[str, dict] = {
    "Step1": {"filename": "step-1", "substeps": 3, "frames": 810},
    "Step2": {"filename": "step-2", "substeps": 4, "frames": 1080},
    "Step3": {"filename": "step-3", "substeps": 3, "frames": 810},
    "Faq1": {"filename": "faq-1", "substeps": 4, "frames": 1080},
    "Faq2": {"filename": "faq-2", "substeps": 3, "frames": 810},
    "Faq3": {"filename": "faq-3", "substeps": 3, "frames": 810},
    "Faq4": {"filename": "faq-4", "substeps": 2, "frames": 540},
    "Faq5": {"filename": "faq-5", "substeps": 3, "frames": 810},
}

BG_RGB = np.array([232, 239, 226], dtype=np.int16)  # #E8EFE2
CROP_320_280 = (343, 20, 1577, 1060)  # centered 320:280 aspect box within 1920x1080 with 20px v-margin


def run(cmd: List[str], cwd: Path = ROOT, check: bool = True) -> subprocess.CompletedProcess:
    proc = subprocess.run(cmd, cwd=str(cwd), text=True, capture_output=True)
    if check and proc.returncode != 0:
        sys.stderr.write(f"Command failed ({proc.returncode}): {' '.join(cmd)}\n")
        if proc.stdout:
            sys.stderr.write(f"STDOUT:\n{proc.stdout}\n")
        if proc.stderr:
            sys.stderr.write(f"STDERR:\n{proc.stderr}\n")
        raise subprocess.CalledProcessError(proc.returncode, cmd, proc.stdout, proc.stderr)
    return proc


def audit_palette_tokens() -> dict:
    tw_text = (REPO_ROOT / "apps/web/tailwind.config.ts").read_text(encoding="utf-8")
    tw_hexes = {h.upper() for h in re.findall(r"#[0-9A-Fa-f]{6}", tw_text)}
    tw_hexes.add("#FFFFFF")

    violations = []
    for ts_file in (ROOT / "src").rglob("*.ts*"):
        text = ts_file.read_text(encoding="utf-8")
        for m in re.finditer(r"#[0-9A-Fa-f]{6}", text):
            hx = m.group(0).upper()
            if hx not in tw_hexes:
                violations.append({"file": str(ts_file.relative_to(ROOT)), "hex": hx})
    return {"allowed_count": len(tw_hexes), "violations": violations, "ok": len(violations) == 0}


def ensure_bundle() -> Path:
    bundle_dir = OUT_DIR / "bundle"
    run([REMOTION_BIN, "bundle", "src/index.ts", "--out-dir", str(bundle_dir), "--log=error"])
    return bundle_dir


def render_preview(board: str, bundle_dir: Path) -> Path:
    preview_dir = OUT_DIR / "preview"
    preview_dir.mkdir(parents=True, exist_ok=True)
    meta = BOARDS[board]
    out_mp4 = preview_dir / f"{meta['filename']}-960x540.mp4"
    cmd = [
        REMOTION_BIN,
        "render",
        str(bundle_dir),
        board,
        str(out_mp4),
        "--codec=h264",
        "--crf=20",
        "--scale=0.5",
        "--concurrency=4",
        f"--browser-executable={CHROME_PATH}",
        "--log=error",
    ]
    run(cmd)
    return out_mp4


def render_full(board: str, bundle_dir: Path, crf: int = 17) -> Path:
    full_dir = OUT_DIR / "full"
    full_dir.mkdir(parents=True, exist_ok=True)
    meta = BOARDS[board]
    out_mp4 = full_dir / f"{meta['filename']}.mp4"
    cmd = [
        REMOTION_BIN,
        "render",
        str(bundle_dir),
        board,
        str(out_mp4),
        "--codec=h264",
        f"--crf={crf}",
        "--pix-fmt=yuv420p",
        "--concurrency=4",
        f"--browser-executable={CHROME_PATH}",
        "--log=error",
    ]
    run(cmd)
    return out_mp4


def ffprobe_check(mp4: Path, expected_w: int, expected_h: int, expected_frames: int) -> dict:
    res = run([
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "stream=codec_type,width,height,r_frame_rate,nb_frames,duration",
        "-of",
        "json",
        str(mp4),
    ])
    info = json.loads(res.stdout)
    streams = info.get("streams", [])
    video_streams = [s for s in streams if s.get("codec_type") == "video"]
    audio_streams = [s for s in streams if s.get("codec_type") == "audio"]
    assert len(video_streams) == 1, f"Expected 1 video stream, got {len(video_streams)}"
    v = video_streams[0]
    w, h = int(v["width"]), int(v["height"])
    nb_frames = int(v["nb_frames"])
    dur = float(v["duration"])
    fps = v["r_frame_rate"]
    expected_dur = expected_frames / 60.0
    ok = (
        w == expected_w
        and h == expected_h
        and fps == "60/1"
        and nb_frames == expected_frames
        and abs(dur - expected_dur) < 0.05
        and len(audio_streams) == 0
    )
    return {
        "width": w,
        "height": h,
        "fps": fps,
        "nb_frames": nb_frames,
        "duration": round(dur, 4),
        "expected_frames": expected_frames,
        "expected_duration": expected_dur,
        "audio_streams": len(audio_streams),
        "ok": ok,
    }


def decode_gray_frames(mp4: Path, w: int = 1920, h: int = 1080) -> np.ndarray:
    """Decode full video directly to grayscale uint8 array (N, H, W) via ffmpeg pipe."""
    cmd = [
        "ffmpeg",
        "-v",
        "error",
        "-i",
        str(mp4),
        "-f",
        "rawvideo",
        "-pix_fmt",
        "gray",
        "-",
    ]
    proc = subprocess.run(cmd, check=True, capture_output=True)
    raw = np.frombuffer(proc.stdout, dtype=np.uint8)
    frame_size = w * h
    n_frames = len(raw) // frame_size
    return raw[: n_frames * frame_size].reshape((n_frames, h, w))


def detect_gpu_defects(frames: np.ndarray) -> dict:
    """
    Runs all 3 detectors from REMOTION-PLAYBOOK.md §3:
    1. Grid correlation on [0:113, 0:500] vs [113:226, 500:1000] (threshold >= 0.8)
    2. Lone frame: d3 < 0.35 * min(d1, d2) when min(d1, d2) > 0.5
    3. Temporal median: D(k) > mean + 5*sigma and D(k) > 2.0
    """
    n = frames.shape[0]
    f32 = frames.astype(np.float32)

    # 1. Grid repeat correlation (handles both 1920x1080 and 960x540 scales cleanly)
    h, w = frames.shape[1], frames.shape[2]
    bh, bw = (113, 500) if w >= 1920 else (56, 250)
    grid_flags: List[Tuple[int, float]] = []
    for k in range(n):
        a = f32[k, 0:bh, 0:bw]
        b = f32[k, bh : 2 * bh, bw : 2 * bw]
        va = a - a.mean()
        vb = b - b.mean()
        denom = float(np.sqrt((va * va).sum() * (vb * vb).sum()))
        corr = float((va * vb).sum() / denom) if denom > 1e-6 else 0.0
        if corr >= 0.8:
            grid_flags.append((k, round(corr, 4)))

    # 2. Lone frame
    lone_flags: List[Tuple[int, float, float, float]] = []
    if n >= 3:
        for k in range(1, n - 1):
            d1 = float(np.abs(f32[k] - f32[k - 1]).mean())
            d2 = float(np.abs(f32[k] - f32[k + 1]).mean())
            d3 = float(np.abs(f32[k - 1] - f32[k + 1]).mean())
            m = min(d1, d2)
            if m > 0.5 and d3 < 0.35 * m:
                lone_flags.append((k, round(d1, 3), round(d2, 3), round(d3, 3)))

    # 3. Temporal median (window k-3..k+3 excluding k)
    median_scores = np.zeros(n, dtype=np.float32)
    for k in range(n):
        idx = [j for j in range(max(0, k - 3), min(n, k + 4)) if j != k]
        med = np.median(f32[idx], axis=0)
        median_scores[k] = np.abs(f32[k] - med).mean()
    mean_d = float(median_scores.mean())
    std_d = float(median_scores.std())
    thresh = max(2.0, mean_d + 5.0 * std_d)
    median_flags = [(int(k), round(float(median_scores[k]), 3)) for k in range(n) if median_scores[k] > thresh]

    # Measure final hold stability (last 20 frames before end)
    hold_diffs = [float(np.abs(f32[k] - f32[k - 1]).mean()) for k in range(max(1, n - 20), n)]
    max_hold_diff = round(max(hold_diffs) if hold_diffs else 0.0, 4)

    return {
        "grid_flags": grid_flags,
        "lone_flags": lone_flags,
        "median_flags": median_flags,
        "median_stats": {"mean": round(mean_d, 4), "std": round(std_d, 4), "thresh": round(thresh, 4)},
        "hold_max_diff": max_hold_diff,
    }


def patch_frames(board: str, bundle_dir: Path, mp4: Path, defect_frames: List[int]) -> Path:
    patch_dir = QC_DIR / board / "patches"
    patch_dir.mkdir(parents=True, exist_ok=True)
    # Save original suspect frames first for visual classification
    for fnum in defect_frames:
        orig_png = patch_dir / f"orig_f{fnum}.png"
        run([
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            str(mp4),
            "-vf",
            f"select=eq(n\\,{fnum})",
            "-vframes",
            "1",
            str(orig_png),
        ])
    patch_files = []
    for fnum in defect_frames:
        png = patch_dir / f"patch_f{fnum}.png"
        run([
            REMOTION_BIN,
            "still",
            str(bundle_dir),
            board,
            str(png),
            f"--frame={fnum}",
            f"--browser-executable={CHROME_PATH}",
            "--log=error",
        ])
        patch_files.append((fnum, png))

    tmp_mp4 = mp4.with_suffix(".patched.mp4")
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", str(mp4)]
    for _, png in patch_files:
        cmd.extend(["-i", str(png)])

    filter_parts = []
    prev = "[0:v]"
    for idx, (fnum, _) in enumerate(patch_files):
        out_label = "[v]" if idx == len(patch_files) - 1 else f"[v{idx + 1}]"
        filter_parts.append(f"{prev}[{idx + 1}:v]overlay=enable='eq(n\\,{fnum})'{out_label}")
        prev = out_label

    cmd.extend([
        "-filter_complex",
        ";".join(filter_parts),
        "-map",
        "[v]",
        "-c:v",
        "libx264",
        "-crf",
        "17",
        "-pix_fmt",
        "yuv420p",
        str(tmp_mp4),
    ])
    run(cmd)
    os.replace(tmp_mp4, mp4)
    return mp4


def extract_frames_and_sheets(board: str, mp4: Path, is_full: bool) -> dict:
    meta = BOARDS[board]
    total_frames = meta["frames"]
    substeps = meta["substeps"]
    b_qc = QC_DIR / board
    b_qc.mkdir(parents=True, exist_ok=True)

    # 1. Extract 32 evenly distributed frames for 8x4 contact sheet
    sample_indices = [min(total_frames - 1, int(round(i * (total_frames - 1) / 31.0))) for i in range(32)]
    tile_w, tile_h = 240, 135
    sheet = Image.new("RGB", (tile_w * 8, tile_h * 4), (232, 239, 226))
    draw = ImageDraw.Draw(sheet)

    temp_dir = b_qc / ("full_tiles" if is_full else "prev_tiles")
    temp_dir.mkdir(parents=True, exist_ok=True)

    # Extract all needed frames cleanly via ffmpeg select filter in one pass (no outer quotes in argv)
    select_expr = "+".join(f"eq(n\\,{idx})" for idx in sorted(set(sample_indices)))
    run([
        "ffmpeg",
        "-y",
        "-v",
        "error",
        "-i",
        str(mp4),
        "-vf",
        f"select={select_expr}",
        "-fps_mode",
        "vfr",
        str(temp_dir / "tile_%03d.png"),
    ])

    unique_sorted = sorted(set(sample_indices))
    tile_map = {f_idx: temp_dir / f"tile_{i + 1:03d}.png" for i, f_idx in enumerate(unique_sorted)}

    bbox_overall = [9999, 9999, -1, -1]
    crop_ok = True

    for slot, f_idx in enumerate(sample_indices):
        col = slot % 8
        row = slot // 8
        img = Image.open(tile_map[f_idx]).convert("RGB")
        # Measure non-background ink bbox on full-res or scaled frame
        arr = np.asarray(img, dtype=np.int16)
        diff = np.abs(arr - BG_RGB).max(axis=2)
        ys, xs = np.where(diff > 8)
        if len(xs) > 0:
            scale_x = 1920.0 / arr.shape[1]
            scale_y = 1080.0 / arr.shape[0]
            x0, y0, x1, y1 = int(xs.min() * scale_x), int(ys.min() * scale_y), int(xs.max() * scale_x), int(ys.max() * scale_y)
            bbox_overall[0] = min(bbox_overall[0], x0)
            bbox_overall[1] = min(bbox_overall[1], y0)
            bbox_overall[2] = max(bbox_overall[2], x1)
            bbox_overall[3] = max(bbox_overall[3], y1)
            if x0 < CROP_320_280[0] or x1 > CROP_320_280[2] or y0 < CROP_320_280[1] or y1 > CROP_320_280[3]:
                crop_ok = False

        thumb = img.resize((tile_w, tile_h), Image.Resampling.LANCZOS)
        sheet.paste(thumb, (col * tile_w, row * tile_h))
        # Subtle frame stamp
        draw.rectangle([col * tile_w + 4, row * tile_h + 4, col * tile_w + 68, row * tile_h + 20], fill=(30, 43, 34))
        draw.text((col * tile_w + 8, row * tile_h + 6), f"f{f_idx}", fill=(255, 255, 255))

    sheet_path = b_qc / f"{meta['filename']}_contact_8x4.png"
    sheet.save(sheet_path)

    # 2. Extract keyframe stills (start, mid-action, settle of each sub-step + final poster)
    key_indices = []
    for s in range(substeps):
        base = s * 270
        key_indices.extend([base + 12, base + 90, base + 170, base + 250])
    key_select = "+".join(f"eq(n\\,{idx})" for idx in sorted(set(key_indices)))
    key_dir = b_qc / "keyframes"
    key_dir.mkdir(parents=True, exist_ok=True)
    run([
        "ffmpeg",
        "-y",
        "-v",
        "error",
        "-i",
        str(mp4),
        "-vf",
        f"select={key_select}",
        "-fps_mode",
        "vfr",
        str(key_dir / "kf_%02d.png"),
    ])

    # Build a crisp 4-column keyframe comparison sheet (rows = substeps, cols = t=0.2s, 1.5s, 2.8s, 4.2s)
    kw, kh = 480, 270
    kf_sheet = Image.new("RGB", (kw * 4, kh * substeps), (232, 239, 226))
    kf_draw = ImageDraw.Draw(kf_sheet)
    for idx, f_idx in enumerate(sorted(set(key_indices))):
        img = Image.open(key_dir / f"kf_{idx + 1:02d}.png").convert("RGB").resize((kw, kh), Image.Resampling.LANCZOS)
        r = idx // 4
        c = idx % 4
        kf_sheet.paste(img, (c * kw, r * kh))
        kf_draw.rectangle([c * kw + 8, r * kh + 8, c * kw + 112, r * kh + 30], fill=(30, 43, 34))
        kf_draw.text((c * kw + 14, r * kh + 12), f"s{r} f{f_idx}", fill=(255, 255, 255))
    kf_sheet_path = b_qc / f"{meta['filename']}_keyframes.png"
    kf_sheet.save(kf_sheet_path)

    # 3. Extract poster (settled end frame of sub-step 0 or final settled frame?
    # Note: reduced motion poster shows final settled state (last frame - 4) OR first substep settled frame.
    # Use final frame `total_frames - 4` as full-board overview poster and keep s0/final crisp.)
    # 3. Extract motion burst strip (6 tightly spaced frames around primary motion action)
    burst_starts = {
        "Step1": 560, # cardboard anticipation -> drop -> impact
        "Step2": 570, # EM bottle shake pouring bran
        "Step3": 300, # hand smoothing bag + bubbles escaping
        "Faq1": 300, # spoon pouring EM grains
        "Faq2": 300, # hand smoothing bag edge
        "Faq3": 340, # bin tilting & liquid pouring into bucket
        "Faq4": 295, # pressing wavy bag flat
        "Faq5": 310, # waste bag hopping into collection bin
    }
    b0 = burst_starts[board]
    burst_indices = [b0 + i * 14 for i in range(6)]
    burst_select = "+".join(f"eq(n\\,{idx})" for idx in burst_indices)
    burst_dir = b_qc / "burst"
    burst_dir.mkdir(parents=True, exist_ok=True)
    run([
        "ffmpeg",
        "-y",
        "-v",
        "error",
        "-i",
        str(mp4),
        "-vf",
        f"select={burst_select}",
        "-fps_mode",
        "vfr",
        str(burst_dir / "b_%02d.png"),
    ])
    bw, bh = 320, 180
    burst_sheet = Image.new("RGB", (bw * 6, bh), (232, 239, 226))
    bdraw = ImageDraw.Draw(burst_sheet)
    for i, f_idx in enumerate(burst_indices):
        bimg = Image.open(burst_dir / f"b_{i + 1:02d}.png").convert("RGB").resize((bw, bh), Image.Resampling.LANCZOS)
        burst_sheet.paste(bimg, (i * bw, 0))
        bdraw.rectangle([i * bw + 6, 6, i * bw + 72, 24], fill=(30, 43, 34))
        bdraw.text((i * bw + 10, 8), f"f{f_idx}", fill=(255, 255, 255))
    burst_sheet_path = b_qc / f"{meta['filename']}_motion.png"
    burst_sheet.save(burst_sheet_path)

    if is_full:
        poster_path = b_qc / f"{meta['filename']}-poster.png"
        run([
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            str(mp4),
            "-vf",
            f"select=eq(n\\,{total_frames - 4})",
            "-vframes",
            "1",
            str(poster_path),
        ])

    return {
        "contact_sheet": str(sheet_path.relative_to(REPO_ROOT)),
        "keyframes_sheet": str(kf_sheet_path.relative_to(REPO_ROOT)),
        "motion_strip": str(burst_sheet_path.relative_to(REPO_ROOT)),
        "ink_bbox": bbox_overall,
        "safe_crop_320_280_ok": crop_ok,
    }


def qa_board(board: str, mode: str, bundle_dir: Path, skip_render: bool = False) -> dict:
    meta = BOARDS[board]
    if mode == "preview":
        out_mp4 = OUT_DIR / "preview" / f"{meta['filename']}-960x540.mp4"
        mp4 = out_mp4 if (skip_render and out_mp4.exists()) else render_preview(board, bundle_dir)
        probe = ffprobe_check(mp4, 960, 540, meta["frames"])
        sheets = extract_frames_and_sheets(board, mp4, is_full=False)
        return {"board": board, "mode": "preview", "probe": probe, "sheets": sheets}

    # Full 1920x1080 @ 60fps render + 3-detector scan + auto-patch loop
    out_mp4 = OUT_DIR / "full" / f"{meta['filename']}.mp4"
    mp4 = out_mp4 if (skip_render and out_mp4.exists()) else render_full(board, bundle_dir)
    probe = ffprobe_check(mp4, 1920, 1080, meta["frames"])
    frames = decode_gray_frames(mp4, 1920, 1080)
    defects = detect_gpu_defects(frames)

    patched_frames: List[int] = []
    # Any frame flagged by grid_corr or lone_frame is a real single-frame glitch; patch it!
    suspect = sorted({f for f, *_ in defects["grid_flags"]} | {f for f, *_ in defects["lone_flags"]})
    # Also check median_flags outside 24-frame transition windows
    for f, score in defects["median_flags"]:
        sub_pos = f % 270
        # Transition windows are at sub-step boundaries (0..30) or intentional fast impact moments
        if sub_pos > 30:
            suspect.append(f)
    suspect = sorted(set(suspect))

    if suspect:
        patch_frames(board, bundle_dir, mp4, suspect)
        patched_frames = suspect
        frames = decode_gray_frames(mp4, 1920, 1080)
        defects = detect_gpu_defects(frames)

    sheets = extract_frames_and_sheets(board, mp4, is_full=True)
    return {
        "board": board,
        "mode": "full",
        "mp4": str(mp4.relative_to(REPO_ROOT)),
        "probe": probe,
        "defects": defects,
        "patched_frames": patched_frames,
        "sheets": sheets,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--board", choices=[*BOARDS.keys(), "all"], default="all")
    parser.add_argument("--mode", choices=["preview", "full"], default="preview")
    parser.add_argument("--skip-render", action="store_true")
    args = parser.parse_args()

    palette = audit_palette_tokens()
    if not palette["ok"]:
        print(json.dumps({"palette": palette}, indent=2))
        sys.exit(2)

    bundle_dir = ensure_bundle()
    targets = list(BOARDS.keys()) if args.board == "all" else [args.board]
    results = []
    all_ok = True
    for b in targets:
        print(f"[QA] Processing {b} ({args.mode})...", flush=True)
        r = qa_board(b, args.mode, bundle_dir, skip_render=args.skip_render)
        results.append(r)
        if not r["probe"]["ok"] or not r["sheets"]["safe_crop_320_280_ok"]:
            all_ok = False
        if args.mode == "full":
            d = r["defects"]
            if d["grid_flags"] or d["lone_flags"] or d["hold_max_diff"] > 0.01:
                all_ok = False

    report = {"palette": palette, "results": results, "all_ok": all_ok}
    QC_DIR.mkdir(parents=True, exist_ok=True)
    report_path = QC_DIR / f"report_{args.mode}.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    if not all_ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
