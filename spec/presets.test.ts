// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { cornerSpeedKmh, STALL_ANGLE_DEG, topSpeedKmh } from "../src/scripts/aero-model";
import { initPresets, PRESETS } from "../src/scripts/presets";

// Answers spec line 4 for the second way in: pressing a circuit preset has to
// change what the visitor sees exactly as dragging does. The preset is only
// allowed to be a shortcut to a slider position, so what these assert is that
// it moves the slider and re-fires the same event everything else listens for.
function buildPresetDom(): HTMLDivElement {
  const root = document.createElement("div");
  root.innerHTML = `
    <input type="range" data-testid="wing-angle-slider" min="0" max="30" value="9" />
    <button data-testid="preset-monza"></button>
    <button data-testid="preset-monaco"></button>
  `;
  return root;
}

const angleOf = (id: string) => PRESETS.find((preset) => preset.id === id)!.angle;

function press(root: HTMLDivElement, id: string) {
  root.querySelector<HTMLButtonElement>(`[data-testid="preset-${id}"]`)!.click();
}

const sliderIn = (root: HTMLDivElement) =>
  root.querySelector<HTMLInputElement>('[data-testid="wing-angle-slider"]')!;

describe("circuit presets", () => {
  it("moves the slider to the preset angle", () => {
    const root = buildPresetDom();
    initPresets(root);
    press(root, "monaco");
    expect(Number(sliderIn(root).value)).toBe(angleOf("monaco"));
  });

  it("fires the same input event a drag fires, so the rest of the page follows", () => {
    const root = buildPresetDom();
    initPresets(root);
    let seen = -1;
    sliderIn(root).addEventListener("input", (event) => {
      seen = Number((event.target as HTMLInputElement).value);
    });
    press(root, "monza");
    expect(seen).toBe(angleOf("monza"));
  });

  it("marks a preset pressed only while the slider sits on it", () => {
    const root = buildPresetDom();
    initPresets(root);
    const monaco = root.querySelector('[data-testid="preset-monaco"]')!;
    expect(monaco.getAttribute("aria-pressed")).toBe("false");

    press(root, "monaco");
    expect(monaco.getAttribute("aria-pressed")).toBe("true");

    const slider = sliderIn(root);
    slider.value = "5";
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    expect(monaco.getAttribute("aria-pressed")).toBe("false");
  });

  it("puts the two circuits on opposite sides of the trade-off", () => {
    const monza = angleOf("monza");
    const monaco = angleOf("monaco");
    expect(topSpeedKmh(monza)).toBeGreaterThan(topSpeedKmh(monaco));
    expect(cornerSpeedKmh(monaco)).toBeGreaterThan(cornerSpeedKmh(monza));
  });

  it("keeps the high-downforce setup below stall, where a real team runs it", () => {
    expect(angleOf("monaco")).toBeLessThan(STALL_ANGLE_DEG);
  });
});
