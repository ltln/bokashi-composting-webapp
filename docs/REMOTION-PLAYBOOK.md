# REMOTION PLAYBOOK — bài học vận hành (17–18/11/2026)

Bài học cô đọng để agent ở project khác dùng lại, rút từ một video 4K60 dài 114 s dựng
hoàn toàn bằng Remotion, có narration, nhạc nền và một đoạn quay UI demo. Số liệu là đo
thật, không phải lý thuyết.

> Bản trong repo này đã lược tên khách hàng / dự án nguồn vì repo là public; nội dung kỹ
> thuật giữ nguyên. Bản gốc nằm ở project nguồn trên máy.

---

## 1. CLI & môi trường

- Gọi CLI: `npx -y -p @remotion/cli remotion <cmd>` (form `npx remotion` LỖI, `npx @remotion/cli` cũng lỗi).
- Trong project thì dùng trực tiếp: `./node_modules/.bin/remotion <cmd>`.
- Version đã dùng: @remotion/cli 4.0.544 + React 19 + TS 5.9 (scaffold `npx create-video@latest --yes --blank --no-tailwind`).
- Render 4K: `--scale=2` — **KHÔNG đổi width/height trong composition**. Thiết kế ở 1920×1080, render 3840×2160.
- Đổi fps 30→60: phải **nhân đôi mọi hằng số frame trong code** (timeline, `{at: N}`, `ease(f, N, d)`, mọi offset). Nếu truyền `--fps=60` mà không sửa code, video bị **nén còn một nửa thời lượng**.
- Nếu máy thiếu Chrome Headless Shell của Remotion: truyền `--browser-executable='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'` (nhưng xem mục 3 — Chrome thật là nguồn của lỗi frame).

## 2. Cấu trúc code nên theo (đã trả giá để rút ra)

- **1 file `timeline.ts`** giữ toàn bộ mốc thời gian (FPS, DURATION, biên từng segment/câu). Không rải số frame khắp nơi.
- Mọi component đọc frame từ `useCurrentFrame()`, mọi animation viết dạng hàm thuần của frame → render lại cho kết quả y hệt.
- Camera: **hold lâu, move ngắn** (mỗi move ≤24 frame), move kết thúc TRƯỚC khi hành động/highlight xảy ra. Keyframe dày = nhìn rối.
- Khung hình lớn (cửa sổ UI, ảnh) phải **clamp theo safe area**: tính box từ vùng an toàn, không cho scale đẩy ra ngoài khung. Nếu muốn "bay vào", cho **lớn dần từ 0.96 → 1.0**, đừng phóng từ 1.06 xuống (sẽ cắt mép lúc entrance).
- Tách lớp animation theo thứ tự: node/edge/arrowhead có progress riêng, đừng dùng chung một biến (pop-in cứng là lỗi hay gặp nhất).

## 3. Lỗi frame của GPU khi render 4K — phần quan trọng nhất

**Triệu chứng:** video 4K60 có vài frame (rải rác) bị **lưới lặp khối header phủ kín màn hình**, hoặc **band-paint** (dải trống/lặp, nửa frame không vẽ). Preview 480p **không bao giờ** dính. Người xem thấy "giựt/leak frame".

**Nguyên nhân:** compositing/rasterize bằng GPU của Chrome ở surface 3840×2160 (Chrome thật, không phải headless shell). Không phải lỗi code — audit code không có layer lặp nào; ô lặp đo được **1000×226 px device (=500×113 CSS)**, khớp 93% với vùng góc trên-trái của chính frame đó.

**Đây là race, KHÔNG tất định.** Đã thử và đo:

| cấu hình | kết quả |
|---|---|
| baseline (GPU, concurrency 4) | 41/5700 frame lỗi |
| `--disable-shared-memory-capture` | **3/5700** |
| `--gl=angle` | 3/5700 |
| tắt GPU rasterization (`--chromium-flags` JSON) | **tệ hơn** (6 lỗi trong 160 frame) |
| `--gl=swangle` (phần mềm) | sạch nhưng chậm ~5× |

→ Kết luận: **không có cấu hình nào sạch tuyệt đối**, và probe ngắn (160 frame) cho kết quả ngược nhau giữa các lần. Cách duy nhất đáng tin: **render full → quét full → vá đúng frame lỗi**.

**Bộ detector (chạy trên file đã render, decode bằng ffmpeg pipe, không nạp video vào model):**
1. **Lưới-lặp:** decode về 1920×1080 gray, tính correlation chuẩn hoá giữa vùng `[0:113, 0:500]` và `[113:226, 500:1000]`. Frame lỗi cho **≥0.8** (đo được 0.999), frame sạch ~0.
2. **Frame cô đơn:** `d3 < 0.35*min(d1,d2)` với `d1=mean|F(k)-F(k-1)|`, `d2=mean|F(k)-F(k+1)|`, `d3=mean|F(k-1)-F(k+1)|` — bắt lỗi chỉ 1 frame.
3. **Trung vị thời gian:** `D(k)=mean|F(k) − median(F(k-3..k+3, trừ k))|`; flag khi `D > mean+5σ` và `D > 2.0` — bắt band-paint và lỗi 1-2 frame.
4. **Luôn phân loại bằng mắt** các frame bị flag: NORMAL / LEAK / BAND-PAINT / **DESIGNED** (hard cut cố ý, state swap của demo, cửa sổ chuyển cảnh). Chỉ 2 loại giữa mới là lỗi.

**Vá frame (pipeline chuẩn):**
```bash
# 1. render riêng frame lỗi ở 4K (retry tới khi sạch — thường 1 lần là sạch)
./node_modules/.bin/remotion still src/index.ts <CompId> out/qc/patch_f<N>.png \
  --frame=<N> --scale=2 --browser-executable='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
# 2. ghép tất cả vào MỘT pass, audio copy nguyên
ffmpeg -y -i render.mp4 -i patch_f192.png -i patch_f220.png \
  -filter_complex "[0:v][1:v]overlay=enable='eq(n\,192)'[v1];[v1][2:v]overlay=enable='eq(n\,220)'[v]" \
  -map "[v]" -map 0:a -c:v libx264 -crf 19 -pix_fmt yuv420p -c:a copy final.mp4
# 3. chứng minh audio không bị đụng
ffmpeg -i render.mp4 -map 0:a -f md5 - ; ffmpeg -i final.mp4 -map 0:a -f md5 -
```
Lưu ý: vá xong **phải quét lại toàn file**; các flag còn lại trong cửa sổ closing/hard-cut là thiết kế.
Đoạn nào có **blur + ảnh PNG lớn phủ toàn khung** thì tỉ lệ lỗi cao nhất (đo được 16/6866 ở đoạn demo so với 3/5700 phần còn lại).

## 4. Canh hình theo audio (alignment) — đừng ước lượng

**Sai lầm:** đếm số từ rồi snap vào valley năng lượng RMS. Trôi tích luỹ, đo được **lệch tới 2,77 s** ở cuối video dù đầu video gần đúng.

**Cách đúng — forced alignment (không phải ASR):** đưa **audio + đúng transcript**, model CTC (`facebook/wav2vec2-base-960h`) tính khung nào ứng ký tự nào rồi tìm Viterbi → start/end từng từ.
```python
# venv riêng (torch, torchaudio, transformers, soundfile)
emissions = torch.log_softmax(model(audio_16k_mono).logits, dim=-1)
aligned, scores = torchaudio.functional.forced_align(emissions, targets, blank=0)
spans = torchaudio.functional.merge_tokens(aligned[0], scores[0].exp())
```
- `aeneas` KHÔNG cài được trên macOS arm64 (`metadata-generation-failed`); Whisper bị loại vì yêu cầu riêng của dự án nguồn.
- Vì transcript do mình đưa, **tên riêng vẫn align đúng** dù ASR đọc sai (vd "Bokashi" → "BOKASHI").

**Cổng kiểm chứng trước khi tin (đủ 5 mới dùng):**
1. onset tăng nghiêm ngặt theo thứ tự câu;
2. span khớp năng lượng đầu/cuối ±0,3 s (đo được 0,04-0,06);
3. câu nằm trên một nhóm năng lượng riêng → khớp RMS ±0,10 s (trung vị 0,063);
4. `mean log-prob` ≥ −0,15 (đo được −0,07…−0,10);
5. từ confidence thấp phải **không đứng đầu câu** (nếu chỉ là từ phụ giữa câu thì bỏ qua).

**Canh mốc hình:** biên câu = frame từ đầu tiên × fps. Mọi hằng số frame tuyệt đối map qua **nội suy tuyến tính giữa 2 biên câu kề** (giữ nhịp tương đối trong câu), assert mapping tăng nghiêm ngặt hai trục. Marker cho **cụm từ** thì lấy thẳng onset, không warp.

## 5. Trộn audio: không sửa file nguồn

- **Không trim/normalize/fade file audio nguồn.** Mọi shaping bằng **volume automation trong Remotion** (nhiều `<Audio>` + `<Sequence>` + hàm volume theo frame). Nếu buộc phải tạo asset khác thì chỉ **copy byte-identical** hoặc extract track, và báo hash.
- Đo trước rồi mới đặt gain: speech RMS của từng nguồn, integrated LUFS, true peak.
- Công thức dùng được: **VO mới = khớp speech RMS của narration cũ (±1 dB)**; **nhạc nền = 8 dB dưới speech** khi không có giọng, **duck thêm 10 dB** khi có giọng. Sau khi hạ, true peak nhạc ~-27 dBFS là an toàn.
- **Ducking kiểu anticipatory:** bắt đầu hạ **~0,35 s TRƯỚC onset**, hạ xong trong 0,5 s, giữ dưới suốt câu, nhả lên trong 0,6 s sau từ cuối. Envelope = **min() của tất cả ramp** để câu sát nhau không giật.
- **Nhạc vào không bật phát một:** rise ~1,5 s từ lúc chuyển cảnh, rồi giữ mức gốc đủ lâu (**pre-roll ~6 s** trong dự án này) để nhạc "định hình" trước khi giọng vào.
- Bed dài hơn đoạn cần: chọn **offset** sao cho fade-out rơi vào đoạn nhạc mềm nhất (đo RMS từng 10 s để chọn), và kiểm tra `offset + duration = hết track` nếu muốn dùng đúng đuôi.

## 6. Đưa UI/website thật vào video (không quay màn hình)

- Export từ design tool (kiểu `Main.dc.html` + runtime) **không chạy được `file://`** → phải `python3 -m http.server` và self-host font (Google Fonts link sẽ gây race/khác font).
- Chụp state bằng browser automation, **set viewport theo đúng tỉ lệ thiết kế**. Nếu tool không cho đặt device pixel ratio: mẹo lấy ảnh ~2× là set viewport lớn hơn rồi `document.documentElement.style.zoom = <ratio>` (viewport thường cap chiều cao 2160 → 1600×1100 @1.96 = 3136×2156).
- **Toạ độ bấm lấy từ DOM thật** (`getBoundingClientRect` → chuẩn hoá 0-1) rồi dùng chính toạ độ đó cho cursor trong Remotion → click luôn trúng, không đoán.
- Locator hay trùng: một cái tên xuất hiện ở sidebar + list + panel → `getByText(name, {exact:true})` ra 3 kết quả. Cách chữa: lọc bằng search để thu về 1 rồi clear (clear input React phải set native value + dispatch `input` event).
- Nếu một link không click được (ngoài vùng nhìn thấy) và logic cho thấy nó không đổi gì về hình → **bỏ cảnh đó**, đừng chày cối.

**Motion cho cursor (đã được duyệt là "phê"):** đường đi có **arc 3%** (không thẳng), ease-in-out, **overshoot 4% rồi settle 7 frame**, dừng 6-10 frame trước khi bấm, bấm thì scale 1→0.88 (3 frame) → về 1 (5 frame), kèm **vòng ripple mint 2 lớp** (6→64 px trong 20 frame, lớp phụ trễ 4 frame). Không cần tiếng click.

## 7. Chuyển cảnh & mỹ thuật (feedback thật từ người duyệt)

- **Nền brand đặc + UI trắng = quá chói.** Nền nên chuyển thành **ambient**: radial gradient navy nhạt→sâu, 2-3 quầng sáng mờ (blur lớn), vignette, grain nhẹ; UI tách khỏi nền bằng shadow + rim light.
- **Đừng "bùm" một phát** sang cảnh mới. Cảnh cũ phải **lùi vào chiều sâu**: opacity→0 + scale 0.965 + blur 8 px + brightness 0.72 + desaturate, trong ~2 s.
- Layout: **UI phải chiếm sân** (dự án này ~70% ngang × 89% cao); kicker chỉ là **nhãn nhỏ 16 px** ở góc — đừng để nó wrap trong lề hẹp (lỗi đã mắc: chữ vỡ thành 3 dòng).
- Copy nhạy cảm (bối cảnh EU/US): tránh động từ mang nghĩa "chấm điểm/xếp hạng con người" → dùng "xác định điểm khớp"; demo mockup chỉ nói ở mức "người dùng nhìn thấy gì".

## 8. Checklist trước khi giao file

1. `tsc --noEmit` pass.
2. Render preview (480p) → `verify.py` pass (duration, fps, frame count, video+audio).
3. Render 4K → quét **cả 3 detector** trên **toàn bộ** frame → phân loại bằng mắt → vá → **quét lại** (mục tiêu 0 lỗi thật).
4. `ffprobe`: đúng resolution/fps/frame count/duration, đúng 1 video + 1 audio.
5. So **MD5 audio** giữa bản render và bản đã vá → phải giống nhau.
6. Tự xem ảnh/clip trước khi đưa người: still cho layout, **clip ngắn cho chuyển động** (still không thể hiện được overshoot/settle/ripple).
7. Test script nên có **assertion gắn với dữ liệu âm thanh** (mốc onset) và ghi rõ nguồn + ngày, để lần thay audio sau nó **fail to** thay vì pass im lặng.

## 9. Áp dụng cho repo này (Bếp Gọn – Rác Đúng)

PoC dự kiến: FAQ 3 sub-step 2 → clip 640×560 @30fps, 135 frame = 4.5 s, nền `#E8EFE2`,
không audio. Nên dùng ngay:

- **Mục 1:** gọi CLI đúng form; render `--scale=2` để ra 1280×1120 cho nét; **không** đổi
  composition size; nếu thiếu Chrome headless shell thì trỏ `--browser-executable`.
- **Mục 2:** một `timeline.ts` cho toàn bộ mốc (`SUBSTEP_MS = 4500` → 135 frame); mọi
  animation là hàm thuần của `frame`; giữ chuyển động ≤24 frame và kết thúc trước khi
  highlight xuất hiện.
- **Mục 8:** tsc + xem still cho layout + xem **clip ngắn** cho chuyển động trước khi báo xong.
- **Mục 7:** đừng cắt cảnh đột ngột giữa các sub-step trong clip; nếu có chuyển cảnh thì
  dùng kiểu "lùi vào chiều sâu".

Chưa cần: mục 4–5 (audio/alignment, không có tiếng), mục 3 (lỗi GPU 4K — clip nhỏ, vẫn nên
giữ bước quét frame nếu sau này render 4K), mục 6 (quay UI thật).

## 10. Phụ lục vận hành (đúc thêm từ dự án nguồn)

**Lệnh đã dùng, khỏi mò lại**
- Preview: `remotion studio --port=3007`.
- Render: `remotion render src/index.ts <id> out/x.mp4 --codec=h264 --crf=17|19 --concurrency=4 --scale=2`.
- Luôn render một bản preview 480p trước, rồi mới render bản full.

**Không nạp video vào context của model**
- Kiểm tra bằng `ffprobe`/`ffmpeg`/PNG + số liệu; clip để người thật xem/nghe. Có session từng
  "nổ" context vì Read cả video vào model. Nếu model không có vision thì nhờ subagent soi ảnh,
  đừng Read ảnh trực tiếp.

**`verify.py` là test sống**
- Assertion gắn với mốc âm thanh (onset) phải ghi rõ nguồn + ngày; khi đổi audio/timeline thì
  cập nhật kỳ vọng để test **FAIL to**, không được pass im lặng. Áp dụng cho repo này khi nào
  clip có tiếng; clip không tiếng thì vẫn nên assert frame count/duration.

**Forced alignment — fallback đã thử**
- `aeneas` KHÔNG cài được trên macOS arm64 (`metadata-generation-failed`). Phương án khác:
  `ctc-forced-aligner`, Montreal Forced Aligner (conda). Không dùng Whisper (yêu cầu của user).
- Cần venv riêng (torch/torchaudio/transformers/soundfile); **chỉ đọc** audio, không sửa file;
  lưu timestamp ra JSON trong `out/qc/`; đổi audio thì re-align + warp lại toàn bộ mốc.

**Cắt asset: đo bbox pixel thật, đừng crop mò**
- Crop mò bằng ffmpeg từng cắt cụt đỉnh logo. Đo bbox trên thumbnail có nền đồng nhất rồi mới
  crop; giữ lại số đo trong code/QC.

**Brand/asset của nguồn khách không được đưa vào repo public**
- Playbook này đã lược tên khách, brand book, vendor và dữ liệu demo. Nếu cần bản đầy đủ, để ở
  project nguồn (private) hoặc thư mục gitignored, đừng commit vào repo public.
