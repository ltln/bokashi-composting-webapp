# Plan status — FAQ 3 & FAQ 5 rework + animation overhaul

## Batch 1 — content + illustration (done, committed d52bc9c)

FAQ 3 drain-by-tilting remedy + Faq5 third output (diluted leachate) + redrawn (a) as solid scraps.
Committed with login fixes (3a5d3cd) and favicon (520e9cb) on `fix/faq-liquid-disposal-content`.

## Batch 2 — login page (done, committed 3a5d3cd)

Login hero sprout attached to the lid; feature icons centred with their labels.

## Batch 3 — animation overhaul (done, uncommitted)

Audit findings: caption bubble covered the bin floor on every FAQ board; three different
lid coordinate systems (Step3 y30 / Faq1 y36 / Faq2 y30→36) and a missing lid in Faq3;
emitters detached from their output (Step2 bottle vs grains ~100 px apart, Faq5c spout vs
drops ~25 px); Step3 never drew the plastic sheet on the rubbish; five annotation styles;
~40 ad-hoc hex colours; `pause` did not stop the CSS transitions (bin kept tilting).

Work:
- `illustrations/parts.tsx` (new): Lid, Bracket, LeaderLabel, Bottle, PressPlate, PotSprout,
  WateringCan (+ tip constant), BagCollar — each owns its coordinates and its own output.
- tokens: +22 illustration/UI colours (water, metal, skin, bottle, pot, mold, waste bag, olive…);
  keyframes `tilt` / `untilt` / `drain` so pause + reduced motion stop them.
- `AnimationStage`: setup illustration 240 px, faq 270×236 → ink stays above the caption bubble.
- `CompareFigure`: drop `cloneElement`/`COMPARE_SVG`/`svgClassName`; the slot sizes the svg.
- all 8 boards rewritten against parts; hex count in illustrations/player/faq: only 2 pure `#FFFFFF`.

Verified: lint + typecheck + vitest 72/72 + next build green.
Geometry audit (headless, per substep): setup ink bottom 324 < caption top 328;
faq ink bottom 412 < caption top 414; Faq3 stream end (272,339) = bucket mouth (273,339);
Step2 bottle mouth = grains column; Step3 sheet under the bubbles under the lid;
Faq5(a) scraps land on the soil lip, (c) drops land inside the pot.

## Next

- User eyeballs every board on `pnpm dev` (auth bypassed locally in `proxy.ts`, uncommitted).
- Then: 2 commits (infrastructure, board rewrites) + push.

## Remotion pipeline — option notes (2026-11-18, user asked to note for a new session)

**Why:** the boards are hand-authored SVG coordinates + CSS keyframes, and an agent can only
inspect stills, so "how it moves" is guesswork. Remotion makes every frame a pure function of
`frame`, so the agent can render frame N, look at it, and fix it — a real feedback loop.

**What it is:** React → video. `<Composition>` (width/height/fps/duration), `useCurrentFrame()`,
`interpolate()`, `spring()`. Preview in Studio; render with bundled headless Chrome + ffmpeg:
`remotion render <Comp> out.webm`, `remotion still <Comp> out.png --frame=N`. This machine
already has the `remotion-*` skills.

**Playbook (đọc trước khi scaffold):** `docs/REMOTION-PLAYBOOK.md` — bài học từ một video
4K60 có narration. Bản trong repo đã lược tên khách hàng/dự án nguồn vì repo public. Các điểm
áp dụng trực tiếp cho PoC:
- Gọi CLI bằng `npx -y -p @remotion/cli remotion <cmd>` (form `npx remotion` lỗi) hoặc
  `./node_modules/.bin/remotion`.
- Một `timeline.ts` giữ toàn bộ mốc; mọi animation là hàm thuần của `frame` (render lại y hệt).
- Render 2× bằng `--scale=2`, **không** đổi width/height composition.
- Nếu đổi fps phải nhân lại mọi hằng số frame, nếu không video bị nén nửa thời lượng.
- Motion: move ≤24 frame, kết thúc trước khi highlight; không cắt cảnh đột ngột.
- Trước khi báo xong: `tsc --noEmit`, xem still cho layout **và clip ngắn cho chuyển động**.

**Two integration modes**

- A. Offline asset pipeline (recommended for the PoC): one clip per sub-step, render WebM + PNG
  poster, commit under `apps/web/public/animations/`, stage renders `<video muted playsInline
  poster>`. Light runtime, no bundle cost; the art becomes raster and colours are baked.
- B. `@remotion/player` inside the page: keeps vectors + props from tokens, but ships the whole
  renderer (heavy JS) — measure before considering.

**PoC settings (FAQ 3, sub-step 2 "Nghiêng thùng rót bớt dịch")**

- Composition 640×560 (2× the 320×280 viewBox), 30 fps, 135 frames = 4.5 s (matches
  `SUBSTEP_MS`), background `#E8EFE2` (`bk-surface-tint`) so no alpha is needed (Safari's
  VP9-alpha support is unreliable; avoid `yuva420p`).
- Port the scene from `Faq3.tsx` (bin from `BinBase` geometry + bucket + water). Duplicate the
  paths for the PoC; don't try to share `parts.tsx` yet.
- Water: deterministic seeded droplets / particle-ish emitter + splash instead of a drawn band —
  that is the actual reason the pour looks fake today.
- Review: `remotion still` at frames 0/30/60/90/120 at 2×, compare at 390 px and 1440 px.
  Success = the user says it reads as liquid, no artifacts at 2×.

**Constraints / costs**

- Do not render in `pr.yml` / `release.yml` (needs Chromium + ffmpeg): render locally, commit the
  outputs, add a `pnpm anim` / `make anim` script for re-renders.
- Colours are baked into the clip: a token change means re-rendering (one theme today, so fine).
- A11y: `<video muted playsInline>`; reduced motion = poster at the final frame, no autoplay; keep
  the caption + checklist in the DOM (never bake text); `role="img" aria-label` on the wrapper.
- Lose: infinite vector crispness (mitigate 2×), per-token theming, tiny DOM. Gain: frame-accurate
  review, springs/easing, easy particles.
- Repo: new workspace `apps/anim` (`remotion` + `@remotion/cli` + `src/Root.tsx`), outputs into
  `apps/web/public/animations/`.

**Next-session first steps**

1. Scaffold: `npx create-video@latest` in a scratch dir, or add `apps/anim` by hand.
2. Port FAQ 3 s2, render stills, iterate on the water.
3. Wire the clip into `AnimationStage` behind a temporary page/flag; compare with the SVG.
4. If approved: migrate board by board, keep the SVG version until each one is signed off.
5. Open questions: video files in the repo OK? Need runtime theming? Is `@remotion/player` worth
   its bundle? One clip per sub-step OK (no scrubbing)?

**Working-tree state at handoff (uncommitted)**

- `Faq3.tsx`: new pour (tapered stream, separate bucket, foam + spray), reduced-motion static tilt.
- `Faq5.tsx`: option (a) redrawn (open lip, tumble stream into the pot), `PotSprout soilMound`.
- `tailwind.config.ts`: `tumble`, `pour`, `fillUp` delay; `faqDrop` removed.
- `next.config.ts`: `allowedDevOrigins: ["127.0.0.1"]` (dev hydration over 127.0.0.1).
- `proxy.ts`: local-only auth bypass — **do not commit**.
- Dev server was running on :3000; `pnpm typecheck`, `pnpm lint`, `pnpm test` (72/72) green.

---

## Batch 4 — Remotion 1920×1080@60fps Overhaul Plan, Timeline & QA Log

### 1. Kiến trúc & thông số kỹ thuật
- **Workspace mới:** `apps/anim` (độc lập `npm install`, không thêm vào `pnpm-workspace.yaml` để không ảnh hưởng `pnpm-lock.yaml` hay `apps/web/Dockerfile`).
- **Thông số Composition:** `1920×1080`, `60fps`, nền `#E8EFE2` (`bk-surface-tint`), không audio.
- **Hệ toạ độ & Safe Area:**
  - Hệ toạ độ logic `320×280` đặt giữa khung `1920×1080` bằng `<g transform="translate(384, 36) scale(3.6)">` (vùng logic `320×280` chiếm `1152×1008` px ở tâm).
  - Khung crop theo tỉ lệ `320×280` ở chiều cao `1080px` có bề rộng `1234.28px` (`x ∈ [343, 1577]`). Mọi nét vẽ (ink) của 6 board chính (`Step1–3`, `Faq1–3`) được giữ trong `x ∈ [14, 306], y ∈ [6, 268]` → pixel `[434, 1486] × [58, 1001]`, nằm trọn trong cả safe area `1920×1080` lẫn khung crop `320×280` (lề ngang ≥90px trong khung crop, ≥434px trên 1920×1080; lề dọc ≥58px trên/dưới).
  - Hai board so sánh (`Faq4` 2 thẻ, `Faq5` 3 thẻ) sử dụng bố cục card rộng trong vùng an toàn `x ∈ [360, 1560]` (hoặc cân đối ở `320×280` crop `x ∈ [348, 1572]` khi active/overview) với padding tối thiểu ≥24px từ mép vùng crop để không bao giờ bị cắt chữ hay nét vẽ khi render ở `1920×1080` lẫn khi crop stage `320×280`.
- **Chiến lược clip liền mạch (1 clip/board) & lý do số frame:**
  - Chuẩn `SUBSTEP_MS = 4500` → **`SUBSTEP_FRAMES = 270` ở `60fps` (4.5s/sub-step)**.
  - Mặc định 1 clip liền mạch / board, `AnimationStage` điều khiển `<video>` phát liên tục và seek theo `active * 4.5s` khi user nhảy/replay (tránh jump giữa các sub-step).
  - **Thời lượng từng board (khớp 100% số sub-step trong `content/setupSteps.ts` và `content/faqs.ts`):**
    - `Step1` (3 sub-steps): **`810` frames (13.5s)**
    - `Step2` (4 sub-steps): **`1080` frames (18.0s)** — giữ nguyên 4 sub-steps của sản phẩm để khi `player.active = 3`, video seek tới `13.5s` và chạy hết `18.0s`.
    - `Step3` (3 sub-steps): **`810` frames (13.5s)**
    - `Faq1` (4 sub-steps): **`1080` frames (18.0s)** — giữ nguyên 4 sub-steps của sản phẩm.
    - `Faq2` (3 sub-steps): **`810` frames (13.5s)**
    - `Faq3` (3 sub-steps): **`810` frames (13.5s)**
    - `Faq4` (2 sub-steps/options): **`540` frames (9.0s)** — khớp 2 trạng thái so sánh (`Mốc trắng mỏng` `0..4.5s`, `Mốc xanh/đen` `4.5..9.0s`).
    - `Faq5` (3 sub-steps/options): **`810` frames (13.5s)**
- **Bảng màu & hình khối:** Trích 1-1 từ `apps/web/tailwind.config.ts` (`tokens.ts`), không thêm hex lạ. Toàn bộ hạt (bột EM, vụn rác, giọt nước, bọt khí, khói mùi) dùng `random(seed)` của Remotion. Vật rắn có anticipation, squash/stretch bảo toàn diện tích, overlap/follow-through và hold đủ lâu. Không pop-in cứng, không teleport, không scale teo thùng `0.78` khi nghiêng ở `Faq3`.

### 2. Bảng Timeline chuẩn (`apps/anim/src/timeline.ts`, 60fps, 270f/sub-step)

| Board | Tổng frame | Sub-step | Mốc frame (global) | Phân rã pha (local `0..269f`) |
|---|---|---|---|---|
| **Step1** | 810 (13.5s) | `s0` Lon nhôm | `0..269` | `0..18` hold đầu + marker 1 sáng; `15..165` 9 lon rơi 2 hàng có gia tốc + nảy + squash/stretch; `166..245` settle ổn định; `246..269` chuẩn bị sang `s1`. |
| | | `s1` Giấy báo | `270..539` | `0..18` chuyển marker 1→2; `18..180` 15 viên giấy báo rơi chèn khe + lớp nền giấy báo dâng êm; `180..240` khung gợi ý carton rung nhẹ; `240..269` thu gọn gợi ý. |
| | | `s2` Bìa carton | `540..809` | `0..20` marker 2→3 + bìa xuất hiện trên miệng; `20..120` anticipation nâng 4px rồi rơi đặt khít `y=222`; `120..165` nén đàn hồi nhẹ lớp dưới + settle; `165..269` hold hoàn chỉnh. |
| **Step2** | 1080 (18.0s) | `s0` Băm & vắt | `0..269` | `0..24` rác hữu cơ xuất hiện trên miệng, vắt 6 giọt nước thừa rơi trước; `24..185` mảnh rác hữu cơ rơi quỹ đạo parabol tạo gò ở giữa lớp 2 + nảy nhẹ; `185..269` hold gò rác. |
| | | `s1` Dàn 3–5cm | `270..539` | `0..22` thanh gạt vào vị trí; `22..155` gạt dàn đều gò rác thành lớp 3 phẳng 3–5cm + bracket `3–5 cm` highlight; `155..235` thanh gạt rút lên êm; `235..269` hold. |
| | | `s2` Rắc EM | `540..809` | `0..30` chai EM bay vào (`scale 0.96→1`) + nghiêng lấy đà; `30..195` lắc 3 nhịp rắc hạt EM từ đúng miệng chai phủ lên mặt lớp 3; `195..245` chai dựng thẳng rút ra; `245..269` hold. |
| | | `s3` Nén chặt | `810..1079` | `0..26` đĩa nén vào vị trí trên lớp 3; `26..170` anticipation nâng nhẹ rồi ấn 2 nhịp nén chặt mặt rác (`y: 114→120`, khối rác đàn hồi); `170..230` đĩa nhấc lên + hiện khung nét đứt lớp 4; `230..269` hold. |
| **Step3** | 810 (13.5s) | `s0` Phủ túi | `0..269` | `0..22` miệng túi mở; `22..155` màng nilon lượn sóng hạ xuống phủ mặt rác (`y=82`), lộ 6 bọt khí dưới màng; `155..269` settle + hold rõ bọt khí. |
| | | `s1` Miết khí | `270..539` | `0..22` tay vào tâm `x=160` nhấn lấy đà; `22..180` tay + sóng miết sang 2 bên đẩy 6 bọt khí biến dạng trượt ra 2 thành thùng và thoát lên; `180..235` tay rút, màng phẳng tuyệt đối; `235..269` hold. |
| | | `s2` Đậy nắp | `540..809` | `0..24` nắp ở trên nhấc nhẹ lấy đà; `24..135` nắp rơi đóng sập có quán tính xuống miệng thùng, nhún đàn hồi 1.5px; `135..269` khóa khít + hold. |
| **Faq1** | 1080 (18.0s) | `s0` Mở nắp | `0..269` | `0..60` nắp mở nâng lên có quán tính + mép túi nilon lật mượt từ `flat` sang `up`; `40..269` 4 làn khói mùi hôi uốn lượn bốc lên từ mặt rác ướt. |
| | | `s1` Rắc EM | `270..539` | `0..28` muỗng + nhãn `2–3 muỗng` tiến vào; `28..200` muỗng nghiêng rắc 3 nhịp rõ ràng, hạt EM rơi phủ mặt rác, khói mùi hôi mờ dần còn 35%; `200..245` muỗng rút êm; `245..269` hold. |
| | | `s2` Nén chặt | `540..809` | `0..24` đĩa nén vào; `24..170` anticipation rồi ấn nén chặt 2 nhịp (`y: 78→84`), khói mùi hôi tắt hoàn toàn; `170..230` đĩa nén rút lên; `230..269` hold. |
| | | `s3` Miết & đậy | `810..1079` | `0..95` túi nilon lật từ `up → flat` phủ mặt rác; `95..175` miết đẩy 4 bọt khí thoát ra hai mép; `175..240` nắp hạ đóng kín có quán tính; `240..269` hold. |
| **Faq2** | 810 (13.5s) | `s0` Phủ EM vùng hở | `0..269` | `0..269` nắp hở `-6deg`, 4 ruồi bay Lissajous; `0..95` giòi trườn ở vùng hở góc phải + nhãn `vùng hở`; `65..195` hạt EM rắc dày phủ kín vùng hở làm giòi ẩn/dừng; `195..269` hold. |
| | | `s1` Miết mép túi | `270..539` | `0..25` bàn tay + mũi tên tiến vào mép vùng hở; `25..175` miết mép túi từ `gap` ép sát thành thùng (`lip`), che kín hoàn toàn vùng hở, 2 ruồi dạt ra; `175..235` tay rút; `235..269` hold. |
| | | `s2` Đóng nắp | `540..809` | `0..24` nắp từ `-6deg` nhấc nhẹ lấy đà; `24..125` nắp sập phẳng `0deg` khóa khít vành; `125..220` 2 ruồi còn lại đập vào nắp kín rồi bay vọt ra khỏi khung; `220..269` hold thùng sạch. |
| **Faq3** | 810 (13.5s) | `s0` Kiểm tra dịch | `0..269` | `0..30` nắp mở lên; `0..210` giọt dịch thấm qua lớp rác rơi xuống đáy; dịch đáy gợn sóng dâng quá mặt lon (`y=232`) + hiện khung nét đứt & nhãn `Dịch dềnh / quá mặt lon`. |
| | | `s1` Nghiêng rót | `270..539` | `0..24` camera dịch trái `24px` (giữ nguyên `scale=1`), xô hứng xuất hiện bên phải, nắp hạ giữ hờ; `24..80` thùng nghiêng mượt `0→13deg` quanh góc đáy phải `(229,257)`; `72..245` dòng dịch rỉ chảy cong parabol vào đúng miệng xô + bắn toé + mặt nước trong xô dâng lên `80%` trong khi mực đáy thùng rút xuống; `245..269` dòng ngắt êm. |
| | | `s2` Pha loãng tưới | `540..809` | `0..60` thùng trả thẳng `13→0deg`, nắp đóng kín, camera trượt lại giữa; `35..90` xô rút êm, bình tưới + chậu cây + nhãn `Pha loãng ~1:100` vào vị trí; `80..220` bình tưới nghiêng rót hạt nước + tia bắn vào chậu, mầm cây vươn cao bung lá; `220..269` hold. |
| **Faq4** | 540 (9.0s) | `s0` Mốc trắng mỏng | `0..269` | `0..24` thẻ trái (`Đạt chuẩn`) tiến nổi (`scale 1.02`), thẻ phải lùi (`scale 0.96, opacity 0.6`); `24..230` cụm tơ mốc trắng mỏng nở nhịp nhàng dưới lớp túi nilon ép phẳng sát mặt rác; `230..269` hold. |
| | | `s1` Mốc xanh/đen | `270..539` | `0..24` chuyển cảnh chiều sâu: thẻ phải tiến nổi (`scale 1.02`), thẻ trái lùi (`scale 0.96, opacity 0.6`); `24..185` túi nilon phồng hở bọt khí trên nền mốc xanh/đen, đĩa/mũi tên nén từ trên ấn chặt xuống đẩy xẹp bọt khí ra hai bên; `185..269` hold. |
| **Faq5** | 810 (13.5s) | `s0` (a) Vùi chậu cây | `0..269` | `0..24` thẻ `(a)` nổi nổi bật, `(b)/(c)` lùi nhẹ; `24..115` thùng ủ nghiêng mượt `82→112deg`, từng đợt rác hữu cơ rắn rơi parabol vào chậu đất; `115..225` mô đất vun cao, mầm cây vươn lên bung lá non; `225..269` hold. |
| | | `s1` (b) Bỏ rác sinh hoạt | `270..539` | `0..24` chuyển focus từ `(a)→(b)`; `24..175` túi rác đen buộc nút lấy đà nhún rồi nhảy cung parabol gọn gàng khi nắp thùng thu gom xanh mở đón và đóng sập có quán tính; `175..269` hold. |
| | | `s2` (c) Tưới dịch rỉ | `540..809` | `0..24` chuyển focus từ `(b)→(c)`; `24..205` bình tưới nghiêng rót chùm giọt dịch pha loãng (`~1:100`) rơi vào mặt đất chậu + giọt bắn nhỏ, cây non vươn lá tươi; `205..269` hold. |

### 3. Nhật ký tự QA (3 vòng lặp / board)

| Board | Vòng 1 (960×540 Preview + Geometry/Safe Crop) | Vòng 2 (Physics/Emitter/Motion Burst + Re-preview) | Vòng 3 (Full 1920×1080@60fps + 3-Detector GPU Scan) |
|---|---|---|---|
| **Step1** (`810f`, `13.5s`) | Lỗi: bóng giấy báo hàng trên hơi đều tăm tắp, marker 3 cuối `s2` vẫn màu cam.<br>Sửa: đa dạng nhẹ `cy/r` từng bóng giấy, chuyển marker 3 sang xanh hoàn tất ở cuối `s2`. | Soi `step-1_keyframes.png` + `step-1_motion.png` (`f560..630`): carton có anticipation nâng nhẹ trước khi rơi & nén đàn hồi lớp giấy.<br>Bbox `[460,192,1394,998]`, crop OK. | `1920×1080 @60fps`, `810f`, `13.5s`. `grid=[]`, `lone=[]`, `median=[]`, `hold_max_diff=0.0`, bbox `[461,194,1393,998]`, crop OK. |
| **Step2** (`1080f`, `18.0s`) | Lỗi: giọt nước vắt ở `s0` lơ lửng không có cụm rác; tay ở `s1` vào từ giữa lòng thùng; bracket `3–5 cm` chỉ vào Lớp 2 (`154..190`).<br>Sửa: thêm cụm rác ép nước ở miệng thùng `s0`, tay xuống từ trên miệng thùng, dời bracket `3–5 cm` lên Lớp 3 (`114..154`). | Soi `step-2_motion.png` (`f570..640`): hạt bột EM rơi chính xác từ nắp chai xuống mặt Lớp 3; gò rác dàn mượt sang lớp phẳng.<br>Bbox `[508,64,1390,998]`, crop OK. | `1920×1080 @60fps`, `1080f`, `18.0s`. `grid=[]`, `lone=[]`, `median=[]`, `hold_max_diff=0.0`, bbox `[509,64,1391,998]`, crop OK. |
| **Step3** (`810f`, `13.5s`) | Lỗi: `ink_bbox ymin=16 < 20` khi nắp nhấc lấy đà; tay vào từ giữa thùng.<br>Sửa: chỉnh `STAGE_VIEW` (`scale=3.45, offsetY=57`) và cho tay hạ từ trên miệng thùng xuống tâm túi. | Soi `step-3_motion.png` (`f300..370`): 6 bọt khí trượt dạt đối xứng ra 2 thành thùng và thoát lên khi tay miết.<br>Bbox `[510,38,1318,998]`, crop OK. | `1920×1080 @60fps`, `810f`, `13.5s`. `grid=[]`, `lone=[]`, `median=[]`, `hold_max_diff=0.0`, bbox `[510,40,1318,998]`, crop OK. |
| **Faq1** (`1080f`, `18.0s`) | Lỗi: pill `"2–3 muỗng"` chạm nhẹ cán muỗng & quai thùng.<br>Sửa: đặt pill lên `(220,10)`, hạ muỗng xuống `tipY=64`, tay `s3` vào từ miệng thùng. | Soi `faq-1_motion.png` (`f300..370`): muỗng tách khỏi pill, rắc 3 nhịp rõ, mùi mờ dần rồi hết khi nén.<br>Vòng 3a phát hiện `hold_max_diff=0.0588` do nắp `s3` settle tới `f254` → rút `lidCloseEnd` về `242` và re-render. | `1920×1080 @60fps`, `1080f`, `18.0s`. `grid=[]`, `lone=[]`, `median=[]`, `hold_max_diff=0.0003`, bbox `[601,54,1429,998]`, crop OK. |
| **Faq2** (`810f`, `13.5s`) | Lỗi: `ink_bbox ymin=0 < 20` do ruồi bay quá cao; hạt EM `s0` rơi không có muỗng phát.<br>Sửa: hạ quỹ đạo ruồi (`by ∈ [24..39]`), thêm muỗng rắc EM ngay trên vùng hở `s0`. | Soi `faq-2_motion.png` (`f300..370`): tay miết `BagCollar` mượt `gap→lip` không giật; nắp đóng sập hất ruồi bay ra.<br>Bbox `[598,48,1522,998]`, crop OK. | `1920×1080 @60fps`, `810f`, `13.5s`. `grid=[]`, `lone=[]`, `median` `[622..664]` đối chiếu `orig_f642.png` vs `patch_f642.png` xác nhận **DESIGNED** (ruồi bay nhanh + sập nắp), `hold_max_diff=0.0`, bbox `[600,48,1523,998]`, crop OK. |
| **Faq3** (`810f`, `13.5s`) | Lỗi: `s1` nắp che đường rót ở mép thùng; `s1→s2` xô và chậu chồng lúc chuyển; bình tưới `s2` đè thành thùng; poster `s2` túi `up` đội qua nắp kín.<br>Sửa: trượt nắp sang trái mở khe rót, tách pha xô rút trước bình tưới, đẩy `camX=-28`, gập túi `up→flat` khi đóng nắp `s2`. | Soi `faq-3_motion.png` (`f340..410`): dòng chảy parabol từ đúng mép nghiêng vào tâm xô, bắn toé + dâng mực nước; không teo scale thùng.<br>Bbox `[500,54,1530,998]`, crop OK. | `1920×1080 @60fps`, `810f`, `13.5s`. `grid=[]`, `lone=[]`, `median` `[276..278]` (**DESIGNED** camera pan `s0→s1`), `hold_max_diff=0.0021`, bbox `[500,56,1531,998]`, crop OK. |
| **Faq4** (`540f`, `9.0s`) | Lỗi: bọt khí `s1` thoát ngang xuyên thành thùng xám; khoảng cách dấu `✓` và `"Đạt chuẩn"` hơi sát.<br>Sửa: cho bọt khí trượt lên dọc lòng trong thoát lên trên; mở rộng pill `✓ Đạt chuẩn`. | Soi `faq-4_motion.png` (`f295..365`): chuyển cảnh chiều sâu 24f mượt, mũi tên nén xẹp túi phồng, bọt khí thoát lên trên không chạm thành.<br>Bbox `[360,160,1560,922]`, crop OK. | `1920×1080 @60fps`, `540f`, `9.0s`. `grid=[]`, `lone=[]`, `median` `[277..278]` (**DESIGNED** 24f card swap), `hold_max_diff=0.0`, bbox `[363,160,1557,920]`, crop OK. |
| **Faq5** (`810f`, `13.5s`) | Lỗi: sau khi túi rác nhảy vào thùng `(b)`, nửa trái thẻ hơi trống; mép thẻ cách biên crop 5px.<br>Sửa: thu `cardW=368` để lề crop >30px; thêm bóng dáng mờ + cung nét đứt + dấu `✓` hoàn tất trên thùng `(b)`. | Soi `faq-5_motion.png` (`f310..380`): túi rác nhún lấy đà trước khi nhảy parabol vào thùng xanh mở nắp đón.<br>Bbox `[368,196,1546,878]`, crop OK. | `1920×1080 @60fps`, `810f`, `13.5s`. `grid=[]`, `lone=[]`, `median=[]`, `hold_max_diff=0.0011`, bbox `[373,200,1545,879]`, crop OK. |



