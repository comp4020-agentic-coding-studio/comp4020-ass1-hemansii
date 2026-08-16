import { STALL_ANGLE_DEG } from "./aero-model";

// Upper hull of the drawing's top surface (public/car.png is 2720x1104 and the
// scene shows its top 830, so these are the image's own pixels). It bridges the
// gap between bodywork and rear wing the way attached flow actually would,
// rather than diving into it.
const HULL: ReadonlyArray<readonly [number, number]> = [
  [-60, 272],
  [260, 269],
  [400, 272],
  [780, 288],
  [1100, 300],
  [1240, 308],
  [1400, 350],
  [1580, 376],
  [1760, 428],
  [1920, 462],
  [2060, 466],
];

const X_START = 2060;
const X_END = -60;
const X_SEPARATION = 1040; // flow only starts letting go behind the airbox
const HALF_WAVE = 100;
const SMOOTH_STEP = 170;

// One streamline per entry: how far it rides above the hull, and how hard it
// tumbles once the wing is fully stalled.
const STREAMLINES = [
  { offset: 34, maxAmplitude: 26 },
  { offset: 92, maxAmplitude: 34 },
  { offset: 152, maxAmplitude: 42 },
];
const MAX_LIFT = 15; // separated flow also floats away from the surface

const DASH_CYCLE = 1100; // 760 + 340, must match stroke-dasharray in global.css
const SPEED_CALM = 380; // user units per second at 0 degrees
const SPEED_STALLED = 1900;

// Speed rises on a curve rather than a straight line. Linear left the last few
// degrees before stall almost indistinguishable from stalled (~15% apart);
// weighting the climb toward the top of the range makes near-stall visibly
// calmer than stalled while keeping the low angles slow.
const SPEED_CURVE = 2.4;
const HUE_CALM = 212; // blue
const HUE_STALLED = 360; // red, reached via violet and magenta

function hullAt(x: number): number {
  const last = HULL[HULL.length - 1];
  if (x <= HULL[0][0]) return HULL[0][1];
  if (x >= last[0]) return last[1];
  for (let i = 0; i < HULL.length - 1; i++) {
    const [x0, y0] = HULL[i];
    const [x1, y1] = HULL[i + 1];
    if (x >= x0 && x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return last[1];
}

/** Catmull-Rom through the sampled points, emitted as cubic beziers. */
function smoothThrough(points: ReadonlyArray<readonly [number, number]>): string {
  const ext = [points[0], ...points, points[points.length - 1]];
  let d = `M ${points[0][0]} ${points[0][1].toFixed(1)}`;
  for (let i = 1; i < ext.length - 2; i++) {
    const [x0, y0] = ext[i - 1];
    const [x1, y1] = ext[i];
    const [x2, y2] = ext[i + 1];
    const [x3, y3] = ext[i + 2];
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += ` C ${c1x.toFixed(0)} ${c1y.toFixed(1)} ${c2x.toFixed(0)} ${c2y.toFixed(1)} ${x2.toFixed(0)} ${y2.toFixed(1)}`;
  }
  return d;
}

/**
 * One streamline. `wave` is the same 0..1 ramp that drives colour and speed:
 * at 0 the trailing half is as smooth as the leading half, at 1 it tumbles at
 * full amplitude. Everything in between is a real intermediate shape, not a
 * blend between two fixed paths.
 */
function flowPath(offset: number, maxAmplitude: number, wave: number, flip: boolean): string {
  const samples: Array<[number, number]> = [];
  for (let x = X_START; x >= X_SEPARATION; x -= SMOOTH_STEP) {
    samples.push([x, hullAt(x) - offset]);
  }
  if (samples[samples.length - 1][0] !== X_SEPARATION) {
    samples.push([X_SEPARATION, hullAt(X_SEPARATION) - offset]);
  }

  let d = smoothThrough(samples);
  const span = X_SEPARATION - X_END;
  let sign = flip ? -1 : 1;

  for (let x = X_SEPARATION; x > X_END; x -= HALF_WAVE) {
    const xm = x - HALF_WAVE / 2;
    const xe = x - HALF_WAVE;
    // Disturbance builds toward the tail, and the whole envelope scales with
    // how close the wing is to stalling.
    const tm = Math.min(Math.max((X_SEPARATION - xm) / span, 0), 1) ** 1.25 * wave;
    const te = Math.min(Math.max((X_SEPARATION - xe) / span, 0), 1) ** 1.25 * wave;
    const cy = hullAt(xm) - offset - MAX_LIFT * tm - sign * 2 * maxAmplitude * tm;
    const ey = hullAt(xe) - offset - MAX_LIFT * te;
    d += ` Q ${xm.toFixed(0)} ${cy.toFixed(1)} ${xe.toFixed(0)} ${ey.toFixed(1)}`;
    sign = -sign;
  }
  return d;
}

export function initCarVisual(root: ParentNode): void {
  const slider = root.querySelector<HTMLInputElement>('[data-testid="wing-angle-slider"]');
  const scene = root.querySelector<HTMLElement>('[data-testid="car-scene"]');
  const lines = STREAMLINES.map((_, i) =>
    root.querySelector<SVGPathElement>(`[data-testid="airflow-line-${i + 1}"]`),
  );
  if (!slider || !scene || lines.some((line) => line === null)) {
    return;
  }

  let speed = SPEED_CALM;
  let phase = 0;
  let previous = 0;

  const render = () => {
    // A single 0..1 ramp drives colour, speed and waviness together. It
    // saturates at the stall angle instead of switching there, so nothing in
    // the scene changes state discontinuously as the slider crosses it.
    const approach = Math.min(Number(slider.value) / STALL_ANGLE_DEG, 1);

    lines.forEach((line, i) => {
      const { offset, maxAmplitude } = STREAMLINES[i];
      line?.setAttribute("d", flowPath(offset, maxAmplitude, approach, i % 2 === 1));
    });

    scene.style.setProperty("--flow-hue", (HUE_CALM + (HUE_STALLED - HUE_CALM) * approach).toFixed(1));
    speed = SPEED_CALM + (SPEED_STALLED - SPEED_CALM) * approach ** SPEED_CURVE;
  };

  // The dash phase is integrated per frame rather than handed to a CSS
  // animation: changing a CSS animation-duration mid-drag jumps the flow to a
  // new position, whereas integrating lets the speed bend continuously.
  const step = (now: number) => {
    const dt = previous === 0 ? 0 : Math.min((now - previous) / 1000, 0.1);
    previous = now;
    phase = (phase - speed * dt) % DASH_CYCLE;
    for (const line of lines) {
      line?.style.setProperty("stroke-dashoffset", phase.toFixed(1));
    }
    requestAnimationFrame(step);
  };

  slider.addEventListener("input", render);
  render();

  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!still) requestAnimationFrame(step);
}
