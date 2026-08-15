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
