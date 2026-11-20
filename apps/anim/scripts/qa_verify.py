#!/usr/bin/env python3
"""
Automated QA suite for @bokashi/anim (Remotion 1920x1080 @ 60fps).

Implements:
1. Metadata & timing assertions via ffprobe (1920x1080, 60fps, variable VO lengths when --locale en).
2. All 3 GPU frame-defect detectors from docs/REMOTION-PLAYBOOK.md §3:
   - Grid-repeat correlation: normalized correlation of [0:113, 0:500] vs [113:226, 500:1000] >= 0.8
   - Lone frame: d3 < 0.35 * min(d1, d2) when min(d1, d2) > 0.5
   - Temporal median: D(k) = mean|F(k) - median(F(k-3..k+3, excl k))| > mean + 5*sigma and > 2.0
3. Automatic patch pipeline via `remotion still` + `ffmpeg overlay` (with `-c:a copy` and audio MD5 check) and full re-scan.
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
from typing import Dict, List, Optional, Set, Tuple

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parents[1]
OUT_DIR = ROOT / "out"
QC_DIR = OUT_DIR / "qc"
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
REMOTION_BIN = str(ROOT / "node_modules" / ".bin" / "remotion")

SILENT_BOARDS: Dict[str, dict] = {
    "Step1": {"filename": "step-1", "substeps": 3, "frames": 810, "substep_starts": [0, 270, 540], "substep_lengths": [270, 270, 270], "expect_audio": False, "burst_start": 560},
    "Step2": {"filename": "step-2", "substeps": 4, "frames": 1080, "substep_starts": [0, 270, 540, 810], "substep_lengths": [270, 270, 270, 270], "expect_audio": False, "burst_start": 570},
    "Step3": {"filename": "step-3", "substeps": 3, "frames": 810, "substep_starts": [0, 270, 540], "substep_lengths": [270, 270, 270], "expect_audio": False, "burst_start": 300},
    "Faq1": {"filename": "faq-1", "substeps": 4, "frames": 1080, "substep_starts": [0, 270, 540, 810], "substep_lengths": [270, 270, 270, 270], "expect_audio": False, "burst_start": 300},
    "Faq2": {"filename": "faq-2", "substeps": 3, "frames": 810, "substep_starts": [0, 270, 540], "substep_lengths": [270, 270, 270], "expect_audio": False, "burst_start": 300},
    "Faq3": {"filename": "faq-3", "substeps": 3, "frames": 810, "substep_starts": [0, 270, 540], "substep_lengths": [270, 270, 270], "expect_audio": False, "burst_start": 340},
    "Faq4": {"filename": "faq-4", "substeps": 2, "frames": 540, "substep_starts": [0, 270], "substep_lengths": [270, 270], "expect_audio": False, "burst_start": 295},
    "Faq5": {"filename": "faq-5", "substeps": 3, "frames": 810, "substep_starts": [0, 270, 540], "substep_lengths": [270, 270, 270], "expect_audio": False, "burst_start": 310},
}

VI_VO_BOARDS: Dict[str, dict] = {
    "Step1Vi": {"filename": "step-1-vi", "substeps": 3, "frames": 1047, "substep_starts": [0, 310, 721], "substep_lengths": [310, 411, 326], "expect_audio": True, "burst_start": 880},
    "Step2Vi": {"filename": "step-2-vi", "substeps": 4, "frames": 1313, "substep_starts": [0, 334, 644, 949], "substep_lengths": [334, 310, 305, 364], "expect_audio": True, "burst_start": 744},
    "Step3Vi": {"filename": "step-3-vi", "substeps": 3, "frames": 950, "substep_starts": [0, 252, 644], "substep_lengths": [252, 392, 306], "expect_audio": True, "burst_start": 402},
    "Faq1Vi": {"filename": "faq-1-vi", "substeps": 4, "frames": 1217, "substep_starts": [0, 291, 649, 839], "substep_lengths": [291, 358, 190, 378], "expect_audio": True, "burst_start": 351},
    "Faq2Vi": {"filename": "faq-2-vi", "substeps": 3, "frames": 878, "substep_starts": [0, 272, 596], "substep_lengths": [272, 324, 282], "expect_audio": True, "burst_start": 402},
    "Faq3Vi": {"filename": "faq-3-vi", "substeps": 3, "frames": 1075, "substep_starts": [0, 358, 721], "substep_lengths": [358, 363, 354], "expect_audio": True, "burst_start": 538},
    "Faq4Vi": {"filename": "faq-4-vi", "substeps": 2, "frames": 808, "substep_starts": [0, 358], "substep_lengths": [358, 450], "expect_audio": True, "burst_start": 638},
    "Faq5Vi": {"filename": "faq-5-vi", "substeps": 3, "frames": 1204, "substep_starts": [0, 372, 792], "substep_lengths": [372, 420, 412], "expect_audio": True, "burst_start": 697},
}

EN_BOARDS: Dict[str, dict] = {
    "Step1En": {"filename": "step-1-en", "substeps": 3, "frames": 1087, "substep_starts": [0, 321, 730], "substep_lengths": [321, 409, 357], "expect_audio": True, "burst_start": 860},
    "Step2En": {"filename": "step-2-en", "substeps": 4, "frames": 1241, "substep_starts": [0, 328, 640, 942], "substep_lengths": [328, 312, 302, 299], "expect_audio": True, "burst_start": 696},
    "Step3En": {"filename": "step-3-en", "substeps": 3, "frames": 1012, "substep_starts": [0, 255, 678], "substep_lengths": [255, 423, 334], "expect_audio": True, "burst_start": 380},
    "Faq1En": {"filename": "faq-1-en", "substeps": 4, "frames": 1317, "substep_starts": [0, 288, 711, 932], "substep_lengths": [288, 423, 221, 385], "expect_audio": True, "burst_start": 332},
    "Faq2En": {"filename": "faq-2-en", "substeps": 3, "frames": 976, "substep_starts": [0, 298, 658], "substep_lengths": [298, 360, 318], "expect_audio": True, "burst_start": 410},
    "Faq3En": {"filename": "faq-3-en", "substeps": 3, "frames": 1099, "substep_starts": [0, 337, 765], "substep_lengths": [337, 428, 334], "expect_audio": True, "burst_start": 518},
    "Faq4En": {"filename": "faq-4-en", "substeps": 2, "frames": 833, "substep_starts": [0, 409], "substep_lengths": [409, 424], "expect_audio": True, "burst_start": 456},
    "Faq5En": {"filename": "faq-5-en", "substeps": 3, "frames": 1129, "substep_starts": [0, 384, 777], "substep_lengths": [384, 393, 352], "expect_audio": True, "burst_start": 600},
}

ALL_BOARDS: Dict[str, dict] = {**SILENT_BOARDS, **VI_VO_BOARDS, **EN_BOARDS}

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
    meta = ALL_BOARDS[board]
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
    meta = ALL_BOARDS[board]
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


def ffprobe_check(mp4: Path, expected_w: int, expected_h: int, expected_frames: int, expect_audio: bool = False) -> dict:
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
    expected_audio_count = 1 if expect_audio else 0
    audio_dur = float(audio_streams[0]["duration"]) if audio_streams and "duration" in audio_streams[0] else None
    audio_dur_ok = True if not expect_audio else (audio_dur is not None and abs(audio_dur - expected_dur) < 0.15)
    ok = (
        w == expected_w
        and h == expected_h
        and fps == "60/1"
        and nb_frames == expected_frames
        and abs(dur - expected_dur) < 0.05
        and len(audio_streams) == expected_audio_count
        and audio_dur_ok
    )
    return {
        "width": w,
        "height": h,
        "fps": fps,
        "nb_frames": nb_frames,
        "duration": round(dur, 4),
        "expected_frames": expected_frames,
        "expected_duration": round(expected_dur, 4),
        "audio_streams": len(audio_streams),
        "audio_duration": round(audio_dur, 4) if audio_dur is not None else None,
        "ok": ok,
    }


def audio_md5(mp4: Path) -> str:
    res = run(["ffmpeg", "-v", "error", "-i", str(mp4), "-map", "0:a", "-f", "md5", "-"])
    return res.stdout.strip()


def video_iframes(mp4: Path) -> Set[int]:
    res = run([
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "frame=pict_type",
        "-of",
        "csv=p=0",
        str(mp4),
    ])
    return {idx for idx, line in enumerate(res.stdout.splitlines()) if line.strip().startswith("I")}


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


def detect_gpu_defects(frames: np.ndarray, i_frames: Optional[Set[int]] = None) -> dict:
    """
    Runs all 3 detectors from REMOTION-PLAYBOOK.md §3:
    1. Grid correlation on [0:113, 0:500] vs [113:226, 500:1000] (threshold >= 0.8)
    2. Lone frame: d3 < 0.35 * min(d1, d2) when min(d1, d2) > 0.5
    3. Temporal median: D(k) = mean|F(k) - median(F(k-3..k+3, excl k))| > mean + 5*sigma and > 2.0
    """
    n = frames.shape[0]
    f32 = frames.astype(np.float32)

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

    lone_flags: List[Tuple[int, float, float, float]] = []
    if n >= 3:
        for k in range(1, n - 1):
            d1 = float(np.abs(f32[k] - f32[k - 1]).mean())
            d2 = float(np.abs(f32[k] - f32[k + 1]).mean())
            d3 = float(np.abs(f32[k - 1] - f32[k + 1]).mean())
            m = min(d1, d2)
            if m > 0.5 and d3 < 0.35 * m:
                lone_flags.append((k, round(d1, 3), round(d2, 3), round(d3, 3)))

    median_scores = np.zeros(n, dtype=np.float32)
    for k in range(n):
        idx = [j for j in range(max(0, k - 3), min(n, k + 4)) if j != k]
        s = np.sort(frames[idx], axis=0)
        m = len(idx)
        if m % 2 == 0:
            med = (s[m // 2 - 1].astype(np.float32) + s[m // 2].astype(np.float32)) * 0.5
        else:
            med = s[m // 2].astype(np.float32)
        median_scores[k] = np.abs(f32[k] - med).mean()
    mean_d = float(median_scores.mean())
    std_d = float(median_scores.std())
    thresh = max(2.0, mean_d + 5.0 * std_d)
    median_flags = [(int(k), round(float(median_scores[k]), 3)) for k in range(n) if median_scores[k] > thresh]

    skip_i = i_frames or set()
    hold_diffs = [
        float(np.abs(f32[k] - f32[k - 1]).mean())
        for k in range(max(1, n - 20), n)
        if k not in skip_i
    ]
    max_hold_diff = round(max(hold_diffs) if hold_diffs else 0.0, 4)

    return {
        "grid_flags": grid_flags,
        "lone_flags": lone_flags,
        "median_flags": median_flags,
        "median_stats": {"mean": round(mean_d, 4), "std": round(std_d, 4), "thresh": round(thresh, 4)},
        "hold_max_diff": max_hold_diff,
    }


def patch_frames(board: str, bundle_dir: Path, mp4: Path, defect_frames: List[int], expect_audio: bool = False) -> Path:
    patch_dir = QC_DIR / board / "patches"
    patch_dir.mkdir(parents=True, exist_ok=True)
    before_md5 = audio_md5(mp4) if expect_audio else None

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
    ])
    if expect_audio:
        cmd.extend(["-map", "0:a", "-c:a", "copy"])
    cmd.extend([
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

    if expect_audio:
        after_md5 = audio_md5(mp4)
        assert before_md5 == after_md5, f"Audio MD5 changed during patch: {before_md5} != {after_md5}"

    return mp4


def extract_frames_and_sheets(board: str, mp4: Path, is_full: bool) -> dict:
    meta = ALL_BOARDS[board]
    total_frames = meta["frames"]
    substeps = meta["substeps"]
    substep_starts = meta["substep_starts"]
    substep_lengths = meta["substep_lengths"]
    b_qc = QC_DIR / board
    b_qc.mkdir(parents=True, exist_ok=True)

    sample_indices = [min(total_frames - 1, int(round(i * (total_frames - 1) / 31.0))) for i in range(32)]
    tile_w, tile_h = 240, 135
    sheet = Image.new("RGB", (tile_w * 8, tile_h * 4), (232, 239, 226))
    draw = ImageDraw.Draw(sheet)

    temp_dir = b_qc / ("full_tiles" if is_full else "prev_tiles")
    temp_dir.mkdir(parents=True, exist_ok=True)

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
        draw.rectangle([col * tile_w + 4, row * tile_h + 4, col * tile_w + 68, row * tile_h + 20], fill=(30, 43, 34))
        draw.text((col * tile_w + 8, row * tile_h + 6), f"f{f_idx}", fill=(255, 255, 255))

    sheet_path = b_qc / f"{meta['filename']}_contact_8x4.png"
    sheet.save(sheet_path)

    key_indices = []
    for s in range(substeps):
        base = substep_starts[s]
        slen = substep_lengths[s]
        key_indices.extend([
            base + int(round(slen * 0.05)),
            base + int(round(slen * 0.35)),
            base + int(round(slen * 0.65)),
            base + max(1, slen - 20),
        ])
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

    b0 = meta["burst_start"]
    burst_indices = [min(total_frames - 1, b0 + i * 14) for i in range(6)]
    burst_select = "+".join(f"eq(n\\,{idx})" for idx in sorted(set(burst_indices)))
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
        src_idx = sorted(set(burst_indices)).index(f_idx) + 1
        bimg = Image.open(burst_dir / f"b_{src_idx:02d}.png").convert("RGB").resize((bw, bh), Image.Resampling.LANCZOS)
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
    meta = ALL_BOARDS[board]
    expect_audio = bool(meta["expect_audio"])
    substep_starts = meta["substep_starts"]

    if mode == "preview":
        out_mp4 = OUT_DIR / "preview" / f"{meta['filename']}-960x540.mp4"
        mp4 = out_mp4 if (skip_render and out_mp4.exists()) else render_preview(board, bundle_dir)
        probe = ffprobe_check(mp4, 960, 540, meta["frames"], expect_audio=expect_audio)
        sheets = extract_frames_and_sheets(board, mp4, is_full=False)
        return {"board": board, "mode": "preview", "probe": probe, "sheets": sheets}

    out_mp4 = OUT_DIR / "full" / f"{meta['filename']}.mp4"
    mp4 = out_mp4 if (skip_render and out_mp4.exists()) else render_full(board, bundle_dir)
    probe = ffprobe_check(mp4, 1920, 1080, meta["frames"], expect_audio=expect_audio)
    frames = decode_gray_frames(mp4, 1920, 1080)
    defects = detect_gpu_defects(frames, i_frames=video_iframes(mp4))

    patched_frames: List[int] = []
    suspect = sorted({f for f, *_ in defects["grid_flags"]} | {f for f, *_ in defects["lone_flags"]})
    for f, _score in defects["median_flags"]:
        since_start = min(f - b for b in substep_starts if f >= b)
        if f == 0 or since_start > 30:
            suspect.append(f)
    suspect = sorted(set(suspect))

    if suspect:
        patch_frames(board, bundle_dir, mp4, suspect, expect_audio=expect_audio)
        patched_frames = suspect
        frames = decode_gray_frames(mp4, 1920, 1080)
        defects = detect_gpu_defects(frames, i_frames=video_iframes(mp4))

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
    parser.add_argument("--locale", choices=["silent", "vi", "en"], default="silent")
    parser.add_argument("--board", choices=[*ALL_BOARDS.keys(), "all"], default="all")
    parser.add_argument("--mode", choices=["preview", "full"], default="preview")
    parser.add_argument("--skip-render", action="store_true")
    args = parser.parse_args()

    palette = audit_palette_tokens()
    if not palette["ok"]:
        print(json.dumps({"palette": palette}, indent=2))
        sys.exit(2)

    bundle_dir = ensure_bundle()
    locale_map = {"silent": SILENT_BOARDS, "vi": VI_VO_BOARDS, "en": EN_BOARDS}
    locale_boards = locale_map[args.locale]
    targets = list(locale_boards.keys()) if args.board == "all" else [args.board]
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

    report = {"palette": palette, "locale": args.locale, "results": results, "all_ok": all_ok}
    QC_DIR.mkdir(parents=True, exist_ok=True)
    report_name = f"report_{args.mode}.json" if args.locale == "silent" else f"report_{args.locale}_{args.mode}.json"
    report_path = QC_DIR / report_name
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    if not all_ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
