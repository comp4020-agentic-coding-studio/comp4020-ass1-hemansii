import { downforceNewtons, STALL_ANGLE_DEG } from "./aero-model";

const TAU = Math.PI * 2;

// Upper hull of the drawing's top surface (public/car.png is 2720x1104 and the
// scene shows its top 830, so these are the image's own pixels). The car faces
// right: the low nose and flat front wing are at high x, the tall rear wing and
// the larger rear tyre at low x. The hull bridges the gap between bodywork and
// rear wing the way attached flow actually would, rather than diving into it.
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
  [2060, 480],
  [2300, 530],
  [2520, 570],
  [2650, 585],
];

// The streak enters ahead of the nose and leaves past the rear wing, both
// outside the visible crop, so it never appears to start or stop mid-scene.
const X_START = 2650;
const X_END = -220;
const SAMPLE_STEP = 42;

// Clearance above the hull. The arc term lifts the streak clear of the bodywork
// over the middle of the car and settles back down toward both ends.
const ARC_BASE = 30;
const ARC_HEIGHT = 125;
const ARC_SKEW = 0.8; // <1 pushes the crest rearward, over the airbox

// Past the rear wing there is no more car to follow, so the streak stops
// tracking a hull and curls down toward the road instead --- the wake sweeping
// away behind the car rather than a flat line running off the top of the frame.
const TAIL_X = 260;
const TAIL_DROP = 230;

// Flow only starts letting go behind the airbox, so the ripple is confined to
// the rear of the arc and grows toward the tail.
const RIPPLE_START = 1040;
const RIPPLE_WAVELENGTH = 260;
const RIPPLE_MAX = 46;

const DASH_CYCLE = 3300; // 2200 + 1100, must match stroke-dasharray in global.css
const SPEED_CALM = 780; // user units per second at 0 degrees
const SPEED_STALLED = 3200;

// Speed rises on a curve rather than a straight line. Linear left the last few
// degrees before stall almost indistinguishable from stalled (~15% apart);
// weighting the climb toward the top of the range makes near-stall visibly
// calmer than stalled while keeping the low angles slow.
const SPEED_CURVE = 2.4;
const HUE_CALM = 212; // blue
const HUE_STALLED = 360; // red, reached via violet and magenta

// Downforce arrows straddle the rear wheel, under the rear wing --- the end the
// wing actually loads. Both coordinates are in the same image pixels as the
// streak, and each tip sits on the top of the rear tyre.
const DOWNFORCE_ARROWS = [
  { x: 330, tipY: 496 },
  { x: 470, tipY: 480 },
];
const ARROW_MIN_LENGTH = 38;
const ARROW_MAX_LENGTH = 200;
const ARROW_MIN_SHAFT = 9;
const ARROW_MAX_SHAFT = 30;

// Same ramp logic as the streak, a different arc of the hue wheel: green to
// yellow, so downforce never reads as the same quantity as the airflow.
const DOWNFORCE_HUE_LOW = 145;
const DOWNFORCE_HUE_HIGH = 68;

/** A filled arrow pointing straight down, growing upward from a fixed tip. */
function arrowPath(cx: number, tipY: number, length: number, shaft: number): string {
  const half = shaft / 2;
  const headHalf = shaft * 1.35;
  const shoulderY = tipY - shaft * 2;
  const topY = tipY - length;
  return [
    `M ${(cx - half).toFixed(1)} ${topY.toFixed(1)}`,
    `L ${(cx + half).toFixed(1)} ${topY.toFixed(1)}`,
    `L ${(cx + half).toFixed(1)} ${shoulderY.toFixed(1)}`,
    `L ${(cx + headHalf).toFixed(1)} ${shoulderY.toFixed(1)}`,
    `L ${cx} ${tipY.toFixed(1)}`,
    `L ${(cx - headHalf).toFixed(1)} ${shoulderY.toFixed(1)}`,
    `L ${(cx - half).toFixed(1)} ${shoulderY.toFixed(1)}`,
    "Z",
  ].join(" ");
}

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

/** How far above the bodywork the streak rides at normalised position `t`. */
function clearanceAt(t: number): number {
  return ARC_BASE + ARC_HEIGHT * Math.sin(Math.PI * t ** ARC_SKEW);
}

/** How far the wake has curled back down at `x`, behind the rear wing. */
function tailDropAt(x: number): number {
  if (x >= TAIL_X) return 0;
  return TAIL_DROP * ((TAIL_X - x) / (TAIL_X - X_END)) ** 1.6;
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
 * The single streak, sampled along one continuous arc. `wave` is the same 0..1
 * ramp that drives colour and speed: at 0 the whole arc is glassy, at 1 the
 * rear half ripples at full amplitude. Everything between is a real intermediate
 * shape, not a blend between two fixed paths. `phase` slides the ripple along
 * the arc so the turbulence travels with the flow instead of sitting frozen.
 */
function streakPath(wave: number, phase: number): string {
  const span = X_START - X_END;
  const rippleSpan = RIPPLE_START - X_END;
  const samples: Array<[number, number]> = [];

  for (let x = X_START; x >= X_END; x -= SAMPLE_STEP) {
    const t = (X_START - x) / span;
    let y = hullAt(x) - clearanceAt(t) + tailDropAt(x);
    if (x < RIPPLE_START && wave > 0) {
      const travelled = RIPPLE_START - x;
      const amplitude = RIPPLE_MAX * wave * (travelled / rippleSpan) ** 1.25;
      y -= amplitude * Math.sin(((travelled + phase) * TAU) / RIPPLE_WAVELENGTH);
    }
    samples.push([x, y]);
  }

  return smoothThrough(samples);
}

export function initCarVisual(root: ParentNode): void {
  const slider = root.querySelector<HTMLInputElement>('[data-testid="wing-angle-slider"]');
  const scene = root.querySelector<HTMLElement>('[data-testid="car-scene"]');
  const streaks = [
    root.querySelector<SVGPathElement>('[data-testid="airflow-bloom"]'),
    root.querySelector<SVGPathElement>('[data-testid="airflow-streak"]'),
  ];
  const arrows = DOWNFORCE_ARROWS.map((_, i) =>
    root.querySelector<SVGPathElement>(`[data-testid="downforce-arrow-${i + 1}"]`),
  );
  if (!slider || !scene || streaks.some((streak) => streak === null)) {
    return;
  }

  // Downforce peaks at the stall angle and falls away past it, so normalising
  // against the peak makes the arrows shrink once the wing gives up --- the
  // same story the chart tells, drawn on the car.
  const peakDownforce = downforceNewtons(STALL_ANGLE_DEG);

  let wave = 0;
  let speed = SPEED_CALM;
  let phase = 0;
  let previous = 0;

  // Both passes share one geometry, so the bloom can never drift off the core.
  const paint = () => {
    const d = streakPath(wave, phase);
    const offset = (phase % DASH_CYCLE).toFixed(1);
    for (const streak of streaks) {
      streak?.setAttribute("d", d);
      streak?.style.setProperty("stroke-dashoffset", offset);
    }
  };

  const render = () => {
    const angle = Number(slider.value);

    // A single 0..1 ramp drives colour, speed and ripple together. It saturates
    // at the stall angle instead of switching there, so nothing in the scene
    // changes state discontinuously as the slider crosses it.
    const approach = Math.min(angle / STALL_ANGLE_DEG, 1);
    wave = approach;

    scene.style.setProperty("--flow-hue", (HUE_CALM + (HUE_STALLED - HUE_CALM) * approach).toFixed(1));
    speed = SPEED_CALM + (SPEED_STALLED - SPEED_CALM) * approach ** SPEED_CURVE;

    // Arrow size tracks the actual load, so it peaks at stall and drops after;
    // arrow hue tracks `approach` like the airflow, so both stay saturated
    // past stall. Together they read as "worst state, and now losing grip".
    const load = downforceNewtons(angle) / peakDownforce;
    arrows.forEach((arrow, i) => {
      const { x, tipY } = DOWNFORCE_ARROWS[i];
      const length = ARROW_MIN_LENGTH + (ARROW_MAX_LENGTH - ARROW_MIN_LENGTH) * load;
      const shaft = ARROW_MIN_SHAFT + (ARROW_MAX_SHAFT - ARROW_MIN_SHAFT) * load;
      arrow?.setAttribute("d", arrowPath(x, tipY, length, shaft));
    });

    scene.style.setProperty(
      "--downforce-hue",
      (DOWNFORCE_HUE_LOW + (DOWNFORCE_HUE_HIGH - DOWNFORCE_HUE_LOW) * approach).toFixed(1),
    );
    // At 0 degrees the wing makes no downforce at all, so the arrows should
    // very nearly not be there.
    scene.style.setProperty("--downforce-strength", (0.12 + 0.88 * load).toFixed(2));

    paint();
  };

  // The phase is integrated per frame rather than handed to a CSS animation:
  // changing a CSS animation-duration mid-drag jumps the animation to a new
  // position, whereas integrating lets the speed bend continuously. One phase
  // drives both the dash and the ripple, so the trail and its turbulence travel
  // together at whatever speed the current angle asks for.
  const step = (now: number) => {
    const dt = previous === 0 ? 0 : Math.min((now - previous) / 1000, 0.1);
    previous = now;
    phase -= speed * dt;
    paint();
    requestAnimationFrame(step);
  };

  slider.addEventListener("input", render);
  render();

  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!still) requestAnimationFrame(step);
}
