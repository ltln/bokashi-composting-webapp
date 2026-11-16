import { describe, expect, it } from "vitest";
import { cloneWithInlineStyles } from "./exportPng";

describe("cloneWithInlineStyles", () => {
  it("bakes computed paint into the clone and leaves the original alone", () => {
    document.head.innerHTML = "<style>.bar{fill:rgb(47, 107, 69)} text{font-size:13px}</style>";
    document.body.innerHTML =
      '<svg id="c" width="100" height="40"><rect class="bar" width="10" height="10"/><text>FAQ_1_Smell</text></svg>';
    const svg = document.getElementById("c") as unknown as SVGSVGElement;
    const clone = cloneWithInlineStyles(svg);

    expect(clone.querySelector("rect")!.style.getPropertyValue("fill")).toBe("rgb(47, 107, 69)");
    expect(clone.querySelector("text")!.style.getPropertyValue("font-size")).toBe("13px");
    expect(clone.getAttribute("xmlns")).toBe("http://www.w3.org/2000/svg");
    expect(svg.querySelector("rect")!.getAttribute("style")).toBeNull();
    expect(clone).not.toBe(svg);
  });
});
