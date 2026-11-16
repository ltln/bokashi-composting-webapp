/**
 * PNG export of the feature chart: clone the SVG, bake the computed styles in
 * (Tailwind classes do not travel with a serialized SVG), draw it on a canvas
 * under a title and the date range, and download the result.
 */

const STYLE_PROPS = ["fill", "stroke", "stroke-width", "font-family", "font-size", "font-weight", "opacity"] as const;

/** Deep clone of `svg` with the computed paint and font properties set inline. */
export function cloneWithInlineStyles(svg: SVGSVGElement): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const src = [svg, ...Array.from(svg.querySelectorAll("*"))];
  const dst = [clone, ...Array.from(clone.querySelectorAll("*"))];
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    for (const p of STYLE_PROPS) {
      const v = cs.getPropertyValue(p);
      if (v) (dst[i] as SVGElement).style.setProperty(p, v);
    }
  });
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return clone;
}

export interface PngOptions {
  title: string;
  subtitle: string;
  fileName: string;
  /** Output pixel ratio. Default 2. */
  scale?: number;
}

const PAD = 24;
const HEAD = 64;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("svg image failed to load"));
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas is empty"))), "image/png"),
  );
}

/** Renders the chart to a PNG and triggers the download. Rejects on failure. */
export async function exportChartPng(svg: SVGSVGElement, { title, subtitle, fileName, scale = 2 }: PngOptions) {
  const w = Math.round(svg.getBoundingClientRect().width) || Number(svg.getAttribute("width")) || 640;
  const h = Math.round(svg.getBoundingClientRect().height) || Number(svg.getAttribute("height")) || 320;
  const clone = cloneWithInlineStyles(svg);
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));

  const svgUrl = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const img = await loadImage(svgUrl);
    const canvas = document.createElement("canvas");
    canvas.width = (w + PAD * 2) * scale;
    canvas.height = (h + HEAD + PAD) * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.scale(scale, scale);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cs = getComputedStyle(svg);
    const ink = cs.color || "black";
    const family = cs.fontFamily || "system-ui, sans-serif";
    ctx.fillStyle = ink;
    ctx.textBaseline = "top";
    ctx.font = `700 20px ${family}`;
    ctx.fillText(title, PAD, PAD - 4, w);
    ctx.globalAlpha = 0.7;
    ctx.font = `400 14px ${family}`;
    ctx.fillText(subtitle, PAD, PAD + 26, w);
    ctx.globalAlpha = 1;
    ctx.drawImage(img, PAD, HEAD);

    const blob = await toBlob(canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
