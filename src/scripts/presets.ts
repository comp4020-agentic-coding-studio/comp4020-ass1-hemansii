/**
 * Two real circuits sitting at opposite ends of the same trade-off. The page
 * already asserts that Monaco wants corner grip and Monza wants top speed; the
 * presets let you feel it in one press instead of hunting for the angles.
 *
 * Monaco is 17 rather than 18: teams run as much wing as the flow will still
 * hold, not as much as the wing will physically take, so it sits just under the
 * stall angle rather than on it.
 */
export const PRESETS = [
  { id: "monza", angle: 3 },
  { id: "monaco", angle: 17 },
] as const;

interface PresetBinding {
  button: HTMLButtonElement;
  angle: number;
}

export function initPresets(root: ParentNode): void {
  const slider = root.querySelector<HTMLInputElement>('[data-testid="wing-angle-slider"]');
  if (!slider) return;

  const bindings: PresetBinding[] = [];
  for (const { id, angle } of PRESETS) {
    const button = root.querySelector<HTMLButtonElement>(`[data-testid="preset-${id}"]`);
    if (button) bindings.push({ button, angle });
  }
  if (bindings.length === 0) return;

  // aria-pressed rather than a class alone, so the fact that the slider is
  // currently sitting on a named setup is available to a screen reader too, and
  // it clears itself the moment the slider moves off it.
  const syncPressed = () => {
    const current = Number(slider.value);
    for (const { button, angle } of bindings) {
      button.setAttribute("aria-pressed", String(current === angle));
    }
  };

  for (const { button, angle } of bindings) {
    button.addEventListener("click", () => {
      slider.value = String(angle);
      // Everything else on the page (car, chart, stats) already listens for
      // input on the slider, so re-dispatching it is the whole wiring: the
      // preset is a shortcut to a slider position, not a second source of truth.
      slider.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  slider.addEventListener("input", syncPressed);
  syncPressed();
}
