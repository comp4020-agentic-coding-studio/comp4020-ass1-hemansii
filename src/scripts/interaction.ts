import {
  cornerSpeedKmh,
  dragCoefficient,
  downforceNewtons,
  lapTimeSeconds,
  STALL_ANGLE_DEG,
  topSpeedKmh,
} from "./aero-model";

function formatLapTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return `${minutes}:${seconds.toFixed(2).padStart(5, "0")}`;
}

/**
 * What the slider's position means, in words. A bare "23" tells a screen reader
 * user the number but not the thing that actually matters on this page, which
 * is which side of the stall angle they are on.
 */
function angleDescription(angleDeg: number): string {
  const degrees = `${angleDeg} degree${angleDeg === 1 ? "" : "s"}`;
  if (angleDeg === 0) return `${degrees}, wing flat`;
  if (angleDeg < STALL_ANGLE_DEG) {
    return `${degrees}, ${STALL_ANGLE_DEG - angleDeg} below the stall angle`;
  }
  if (angleDeg === STALL_ANGLE_DEG) return `${degrees}, at the stall angle`;
  return `${degrees}, ${angleDeg - STALL_ANGLE_DEG} past the stall angle, wing stalled`;
}

export function initAeroExplainer(root: ParentNode): void {
  const slider = root.querySelector<HTMLInputElement>('[data-testid="wing-angle-slider"]');
  const downforceOut = root.querySelector<HTMLElement>('[data-testid="downforce-value"]');
  const cornerOut = root.querySelector<HTMLElement>('[data-testid="corner-speed-value"]');
  const dragOut = root.querySelector<HTMLElement>('[data-testid="drag-value"]');
  const topSpeedOut = root.querySelector<HTMLElement>('[data-testid="top-speed-value"]');
  const stallInsight = root.querySelector<HTMLElement>('[data-testid="stall-insight"]');
  const bestLapOut = root.querySelector<HTMLElement>('[data-testid="best-lap-value"]');
  if (!slider || !downforceOut || !cornerOut || !dragOut || !topSpeedOut) return;

  let hasPassedStall = false;
  let bestLapSeconds = Infinity;

  const render = () => {
    const angle = Number(slider.value);
    slider.setAttribute("aria-valuetext", angleDescription(angle));
    downforceOut.textContent = `${Math.round(downforceNewtons(angle))} N`;
    cornerOut.textContent = `${Math.round(cornerSpeedKmh(angle))} km/h`;
    dragOut.textContent = dragCoefficient(angle).toFixed(2);
    topSpeedOut.textContent = `${Math.round(topSpeedKmh(angle))} km/h`;

    if (!hasPassedStall && angle > STALL_ANGLE_DEG) {
      hasPassedStall = true;
      stallInsight?.removeAttribute("hidden");
    }

    const lap = lapTimeSeconds(angle);
    if (lap < bestLapSeconds) {
      bestLapSeconds = lap;
      if (bestLapOut) bestLapOut.textContent = formatLapTime(bestLapSeconds);
    }
  };

  slider.addEventListener("input", render);
  render();
}
