import { cornerSpeedKmh, dragCoefficient, downforceNewtons, topSpeedKmh } from "./aero-model";

export function initAeroExplainer(root: ParentNode): void {
  const slider = root.querySelector<HTMLInputElement>('[data-testid="wing-angle-slider"]');
  const downforceOut = root.querySelector<HTMLElement>('[data-testid="downforce-value"]');
  const cornerOut = root.querySelector<HTMLElement>('[data-testid="corner-speed-value"]');
  const dragOut = root.querySelector<HTMLElement>('[data-testid="drag-value"]');
  const topSpeedOut = root.querySelector<HTMLElement>('[data-testid="top-speed-value"]');
  if (!slider || !downforceOut || !cornerOut || !dragOut || !topSpeedOut) return;

  const render = () => {
    const angle = Number(slider.value);
    downforceOut.textContent = `${Math.round(downforceNewtons(angle))} N`;
    cornerOut.textContent = `${Math.round(cornerSpeedKmh(angle))} km/h`;
    dragOut.textContent = dragCoefficient(angle).toFixed(2);
    topSpeedOut.textContent = `${Math.round(topSpeedKmh(angle))} km/h`;
  };

  slider.addEventListener("input", render);
  render();
}
