// F1 rear-wing angle model: illustrative constants chosen to be physically
// plausible (checked against real-world F1 corner/top-speed ranges), not
// measured telemetry. See PROCESS.md for how the constants were derived and
// verified.

export const STALL_ANGLE_DEG = 18;
export const MAX_ANGLE_DEG = 30;

const CL_MAX = 3.0;
const CL_SLOPE_PRE = CL_MAX / STALL_ANGLE_DEG; // linear rise to CL_MAX at stall
const CL_SLOPE_POST = 0.1; // per degree, linear decline past stall

const CD0 = 0.7; // baseline parasitic drag
const K = 0.06; // induced-drag factor: CD = CD0 + K*CL^2 (drag polar)
const CD_STALL_CLIMB_RATE = 0.02; // per degree past stall: separated flow keeps drag climbing

const RHO = 1.225; // air density, kg/m^3
const V_REF = 200 / 3.6; // reference speed for wing downforce calc, m/s
const A_WING = 1.5; // wing reference area, m^2
const A_FRONTAL = 1.5; // frontal area for drag/top-speed calc, m^2

const MASS = 800; // kg
const G = 9.81;
const MU = 1.6; // effective tyre friction coefficient
const CORNER_RADIUS = 100; // m, a fixed medium-speed corner
const ENGINE_POWER = 500_000; // W, at the wheels

export function liftCoefficient(angleDeg: number): number {
  if (angleDeg <= STALL_ANGLE_DEG) {
    return CL_SLOPE_PRE * angleDeg;
  }
  return CL_MAX - CL_SLOPE_POST * (angleDeg - STALL_ANGLE_DEG);
}

export function downforceNewtons(angleDeg: number): number {
  return 0.5 * RHO * V_REF ** 2 * A_WING * liftCoefficient(angleDeg);
}

export function dragCoefficient(angleDeg: number): number {
  if (angleDeg <= STALL_ANGLE_DEG) {
    return CD0 + K * liftCoefficient(angleDeg) ** 2;
  }
  const cdAtStall = CD0 + K * CL_MAX ** 2;
  return cdAtStall + CD_STALL_CLIMB_RATE * (angleDeg - STALL_ANGLE_DEG);
}

export function cornerSpeedKmh(angleDeg: number): number {
  const load = MASS * G + downforceNewtons(angleDeg);
  const speedMs = Math.sqrt((MU * CORNER_RADIUS * load) / MASS);
  return speedMs * 3.6;
}

export function topSpeedKmh(angleDeg: number): number {
  const cd = dragCoefficient(angleDeg);
  const speedMs = ((2 * ENGINE_POWER) / (RHO * cd * A_FRONTAL)) ** (1 / 3);
  return speedMs * 3.6;
}
