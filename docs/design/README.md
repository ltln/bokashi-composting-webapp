# Design reference boards

Exported from the design canvas "Bếp Gọn – Rác Đúng · Web App Prototype"
(https://claude.ai/artifact/EXpQLcEuR3uSV8xMzb8DVo). Board layout and the canvas
notes (tracking spec, acceptance notes) are in [`canvas.json`](canvas.json).

These HTML files are **reference only**: copy text verbatim from them into
`apps/web/content/`, and take colors, radii and keyframes from the Tailwind tokens
in `apps/web/tailwind.config.ts` (already extracted from these boards). Don't ship
or import the boards. They reference a `support.js` runtime and a blob URL for the
background tile that are not in this repo; the tile lives at
`apps/web/public/bg-motif.svg`.

The Share button ("Chia sẻ") in the header of the boards is **dropped** (PLAN §9).

| Board | Viewport | Route | Milestone |
|---|---|---|---|
| `Login.dc.html` | mobile 390×844 | `/login` | M1 |
| `DeskLogin.dc.html` | desktop 1440×900 | `/login` (≥1024 px) | M1 |
| `Main.dc.html` | mobile | `/setup/1` (Bước 1 · Tầng đáy giả) | M2, M3 |
| `Step2.dc.html` | mobile | `/setup/2` (Bước 2 · Nạp cơ chất theo lớp) | M3 |
| `Step3.dc.html` | mobile | `/setup/3` (Bước 3 · Khóa yếm khí) | M3 |
| `DeskSetup.dc.html` | desktop | `/setup/[step]` (≥1024 px) | M2, M3 |
| `FaqList.dc.html` | mobile | `/faq` | M4 |
| `Faq1.dc.html` | mobile | `/faq/smell` | M4 |
| `Faq2.dc.html` | mobile | `/faq/maggots` | M4 |
| `Faq3.dc.html` | mobile | `/faq/liquid` | M4 |
| `Faq4.dc.html` | mobile | `/faq/mold` | M4 |
| `Faq5.dc.html` | mobile | `/faq/disposal` | M4 |
| `DeskFaq.dc.html` | desktop | `/faq`, `/faq/[slug]` (≥1024 px) | M4 |
| `Tracking.dc.html` | desktop 1280 | `/admin` | M6 |
