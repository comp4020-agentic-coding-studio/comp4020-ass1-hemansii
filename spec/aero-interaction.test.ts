// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  cornerSpeedKmh,
  dragCoefficient,
  downforceNewtons,
  STALL_ANGLE_DEG,
  topSpeedKmh,
} from "../src/scripts/aero-model";
import { initAeroExplainer } from "../src/scripts/interaction";

// Answers spec line 4: "the visitor does something that changes what they
// see". Exercises the real wiring function against a detached DOM fragment
// shaped like the page's markup contract, rather than the built dist/ output —
// this repo's build has no headless browser, so full in-page behaviour is
// verified by hand (see CLAUDE.md). Values are read back by parsing the
// rendered text, not by string-matching it, so formatting choices don't break
// the contract.
function readNumber(el: Element | null): number {
  const match = el?.textContent?.match(/-?\d+(\.\d+)?/);
  if (!match) throw new Error(`no number in "${el?.textContent}"`);
  return Number(match[0]);
}

function buildExplainerDom(): HTMLDivElement {
  const root = document.createElement("div");
  root.innerHTML = `
    <input type="range" data-testid="wing-angle-slider" min="0" max="30" value="0" />
    <output data-testid="downforce-value"></output>
    <output data-testid="corner-speed-value"></output>
    <output data-testid="drag-value"></output>
    <output data-testid="top-speed-value"></output>
  `;
  return root;
}

function setAngle(root: HTMLDivElement, angle: number) {
  const slider = root.querySelector<HTMLInputElement>('[data-testid="wing-angle-slider"]')!;
  slider.value = String(angle);
  slider.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("core interaction: moving the wing angle slider", () => {
  it("renders initial values without any input yet", () => {
    const root = buildExplainerDom();
    initAeroExplainer(root);
    expect(readNumber(root.querySelector('[data-testid="downforce-value"]'))).toBeCloseTo(0, 0);
  });

  it("increases displayed downforce and drag as the angle rises toward stall", () => {
    const root = buildExplainerDom();
    initAeroExplainer(root);
    const before = readNumber(root.querySelector('[data-testid="drag-value"]'));

    setAngle(root, STALL_ANGLE_DEG);

    const downforceAtStall = readNumber(root.querySelector('[data-testid="downforce-value"]'));
    const dragAtStall = readNumber(root.querySelector('[data-testid="drag-value"]'));
    expect(downforceAtStall).toBeGreaterThan(0);
    expect(dragAtStall).toBeGreaterThan(before);
  });

  it("keeps displayed drag high past stall instead of dropping back down", () => {
    const root = buildExplainerDom();
    initAeroExplainer(root);

    setAngle(root, STALL_ANGLE_DEG);
    const dragAtStall = readNumber(root.querySelector('[data-testid="drag-value"]'));

    setAngle(root, 30);
    const dragPastStall = readNumber(root.querySelector('[data-testid="drag-value"]'));

    // Regression test for the bug caught by hand: flow stays separated past
    // stall, so drag must not fall just because lift is falling.
    expect(dragPastStall).toBeGreaterThanOrEqual(dragAtStall);
  });

  it("shows both corner speed and top speed falling once the wing stalls", () => {
    const root = buildExplainerDom();
    initAeroExplainer(root);

    setAngle(root, STALL_ANGLE_DEG);
    const cornerAtStall = readNumber(root.querySelector('[data-testid="corner-speed-value"]'));
    const topSpeedAtStall = readNumber(root.querySelector('[data-testid="top-speed-value"]'));

    setAngle(root, 30);
    const cornerPastStall = readNumber(root.querySelector('[data-testid="corner-speed-value"]'));
    const topSpeedPastStall = readNumber(root.querySelector('[data-testid="top-speed-value"]'));

    expect(cornerPastStall).toBeLessThan(cornerAtStall);
    expect(topSpeedPastStall).toBeLessThan(topSpeedAtStall);
  });
});

describe("aero model: physically honest curve shapes", () => {
  it("downforce rises with angle up to stall, then falls past it", () => {
    expect(downforceNewtons(9)).toBeGreaterThan(downforceNewtons(0));
    expect(downforceNewtons(STALL_ANGLE_DEG)).toBeGreaterThan(downforceNewtons(9));
    expect(downforceNewtons(24)).toBeLessThan(downforceNewtons(STALL_ANGLE_DEG));
    expect(downforceNewtons(30)).toBeLessThan(downforceNewtons(24));
  });

  it("drag never falls as angle increases, across the whole range", () => {
    const angles = [0, 9, STALL_ANGLE_DEG, 24, 30];
    for (let i = 1; i < angles.length; i++) {
      expect(dragCoefficient(angles[i])).toBeGreaterThanOrEqual(dragCoefficient(angles[i - 1]));
    }
  });

  it("corner speed shows diminishing returns before stall", () => {
    const gainFirstHalf = cornerSpeedKmh(9) - cornerSpeedKmh(0);
    const gainSecondHalf = cornerSpeedKmh(STALL_ANGLE_DEG) - cornerSpeedKmh(9);
    expect(gainSecondHalf).toBeLessThan(gainFirstHalf);
  });

  it("top speed never rises as angle increases, across the whole range", () => {
    const angles = [0, 9, STALL_ANGLE_DEG, 24, 30];
    for (let i = 1; i < angles.length; i++) {
      expect(topSpeedKmh(angles[i])).toBeLessThanOrEqual(topSpeedKmh(angles[i - 1]));
    }
  });

  it("stays in a plausible real-world range", () => {
    expect(topSpeedKmh(0)).toBeGreaterThan(300);
    expect(topSpeedKmh(0)).toBeLessThan(350);
    expect(cornerSpeedKmh(STALL_ANGLE_DEG)).toBeGreaterThan(150);
    expect(cornerSpeedKmh(STALL_ANGLE_DEG)).toBeLessThan(250);
  });
});
