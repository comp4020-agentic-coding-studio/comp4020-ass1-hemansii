import { cornerSpeedKmh, MAX_ANGLE_DEG, STALL_ANGLE_DEG, topSpeedKmh } from "./aero-model";

// Layout must match the <svg viewBox="0 0 600 300"> declared in index.astro —
// the slider is styled to span the same horizontal extent as PLOT so it
// visually reads as the chart's x-axis, not a separate control.
const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 300;
const MARGIN = { top: 28, right: 12, bottom: 12, left: 12 };
const PLOT_WIDTH = VIEW_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = VIEW_HEIGHT - MARGIN.top - MARGIN.bottom;

const SAMPLE_COUNT = MAX_ANGLE_DEG + 1; // one sample per whole degree, 0..30

function xForAngle(angleDeg: number): number {
  return MARGIN.left + (angleDeg / MAX_ANGLE_DEG) * PLOT_WIDTH;
}

function buildPath(speedAt: (angleDeg: number) => number, yFor: (speed: number) => number): string {
  const points = Array.from({ length: SAMPLE_COUNT }, (_, angle) => {
    return `${xForAngle(angle)},${yFor(speedAt(angle))}`;
  });
  return `M${points.join(" L")}`;
}

export function initAngleChart(root: ParentNode): void {
  const slider = root.querySelector<HTMLInputElement>('[data-testid="wing-angle-slider"]');
  const cornerPath = root.querySelector<SVGPathElement>('[data-testid="corner-speed-path"]');
  const topSpeedPath = root.querySelector<SVGPathElement>('[data-testid="top-speed-path"]');
  const stallLine = root.querySelector<SVGLineElement>('[data-testid="stall-line"]');
  const stallAnnotation = root.querySelector<SVGTextElement>('[data-testid="stall-annotation"]');
  const markerLine = root.querySelector<SVGLineElement>('[data-testid="angle-marker-line"]');
  const cornerMarker = root.querySelector<SVGCircleElement>('[data-testid="corner-speed-marker"]');
  const topSpeedMarker = root.querySelector<SVGCircleElement>('[data-testid="top-speed-marker"]');
  if (
    !slider ||
    !cornerPath ||
    !topSpeedPath ||
    !stallLine ||
    !stallAnnotation ||
    !markerLine ||
    !cornerMarker ||
    !topSpeedMarker
  ) {
    return;
  }

  const cornerSamples = Array.from({ length: SAMPLE_COUNT }, (_, angle) => cornerSpeedKmh(angle));
  const topSpeedSamples = Array.from({ length: SAMPLE_COUNT }, (_, angle) => topSpeedKmh(angle));
  const allSpeeds = [...cornerSamples, ...topSpeedSamples];
  const speedMin = Math.min(...allSpeeds);
  const speedMax = Math.max(...allSpeeds);
  const padding = (speedMax - speedMin) * 0.1;
  const yMin = speedMin - padding;
  const yMax = speedMax + padding;

  const yForSpeed = (speed: number) => {
    return MARGIN.top + (1 - (speed - yMin) / (yMax - yMin)) * PLOT_HEIGHT;
  };

  cornerPath.setAttribute("d", buildPath(cornerSpeedKmh, yForSpeed));
  topSpeedPath.setAttribute("d", buildPath(topSpeedKmh, yForSpeed));

  const stallX = xForAngle(STALL_ANGLE_DEG);
  const STALL_LINE_TOP = 18; // starts just under the annotation's baseline so the two read as one callout
  stallLine.setAttribute("x1", String(stallX));
  stallLine.setAttribute("x2", String(stallX));
  stallLine.setAttribute("y1", String(STALL_LINE_TOP));
  stallLine.setAttribute("y2", String(MARGIN.top + PLOT_HEIGHT));
  stallAnnotation.setAttribute("x", String(stallX));
  stallAnnotation.setAttribute("y", "14");

  const render = () => {
    const angle = Number(slider.value);
    const x = xForAngle(angle);
    markerLine.setAttribute("x1", String(x));
    markerLine.setAttribute("x2", String(x));
    markerLine.setAttribute("y1", String(MARGIN.top));
    markerLine.setAttribute("y2", String(MARGIN.top + PLOT_HEIGHT));

    cornerMarker.setAttribute("cx", String(x));
    cornerMarker.setAttribute("cy", String(yForSpeed(cornerSpeedKmh(angle))));
    topSpeedMarker.setAttribute("cx", String(x));
    topSpeedMarker.setAttribute("cy", String(yForSpeed(topSpeedKmh(angle))));
  };

  slider.addEventListener("input", render);
  render();
}
