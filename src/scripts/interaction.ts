import { cornerSpeedKmh, dragCoefficient, downforceNewtons, STALL_ANGLE_DEG, topSpeedKmh } from "./aero-model";

export function initAeroExplainer(root: ParentNode): void {
  const slider = root.querySelector<HTMLInputElement>('[data-testid="wing-angle-slider"]');
  const downforceOut = root.querySelector<HTMLElement>('[data-testid="downforce-value"]');
  const cornerOut = root.querySelector<HTMLElement>('[data-testid="corner-speed-value"]');
  const dragOut = root.querySelector<HTMLElement>('[data-testid="drag-value"]');
  const topSpeedOut = root.querySelector<HTMLElement>('[data-testid="top-speed-value"]');
  const stallInsight = root.querySelector<HTMLElement>('[data-testid="stall-insight"]');
  if (!slider || !downforceOut || !cornerOut || !dragOut || !topSpeedOut) return;

  let hasPassedStall = false;

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
  };

  slider.addEventListener("input", render);
  render();
}
