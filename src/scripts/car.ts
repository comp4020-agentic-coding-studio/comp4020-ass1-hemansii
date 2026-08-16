import { STALL_ANGLE_DEG } from "./aero-model";

// Streamlines traced over the drawing's own top contour (public/car.png is
// 2720x1104; the scene crops to the top 830, so these coordinates are the
// image's own pixels). Three parallel lines run from over the front wheel,
// back along the bodywork and the rear wing, and off the tail.
//
// The separated set keeps the identical attached run as far as the airbox
// (x=1040) and only then breaks into a wave whose amplitude grows toward the
// rear --- the flow letting go of the wing rather than being turbulent all
// along the car.
const AIRFLOW_ATTACHED = [
  "M 2060 432 C 2032 430 1947 430 1890 422 C 1833 413 1777 396 1720 382 C 1663 368 1607 350 1550 338 C 1493 326 1437 322 1380 311 C 1323 300 1267 280 1210 272 C 1153 264 1097 266 1040 264 C 983 261 927 260 870 257 C 813 255 757 253 700 251 C 643 248 587 246 530 243 C 473 241 417 238 360 237 C 303 236 247 236 190 236 C 133 236 62 237 20 237 C -22 238 -47 238 -60 238",
  "M 2060 374 C 2032 372 1947 372 1890 364 C 1833 355 1777 338 1720 324 C 1663 310 1607 292 1550 280 C 1493 268 1437 264 1380 253 C 1323 242 1267 222 1210 214 C 1153 206 1097 208 1040 206 C 983 203 927 202 870 199 C 813 197 757 195 700 193 C 643 190 587 188 530 185 C 473 183 417 180 360 179 C 303 178 247 178 190 178 C 133 178 62 179 20 179 C -22 180 -47 180 -60 180",
  "M 2060 314 C 2032 312 1947 312 1890 304 C 1833 295 1777 278 1720 264 C 1663 250 1607 232 1550 220 C 1493 208 1437 204 1380 193 C 1323 182 1267 162 1210 154 C 1153 146 1097 148 1040 146 C 983 143 927 142 870 139 C 813 137 757 135 700 133 C 643 130 587 128 530 125 C 473 123 417 120 360 119 C 303 118 247 118 190 118 C 133 118 62 119 20 119 C -22 120 -47 120 -60 120",
];

const AIRFLOW_SEPARATED = [
  "M 2060 432 C 2032 430 1947 430 1890 422 C 1833 413 1777 396 1720 382 C 1663 368 1607 350 1550 338 C 1493 326 1437 322 1380 311 C 1323 300 1267 280 1210 272 C 1153 264 1068 265 1040 264 Q 990 260 940 259 Q 890 261 840 254 Q 790 244 740 249 Q 690 259 640 244 Q 590 224 540 238 Q 490 257 440 233 Q 390 203 340 228 Q 290 259 240 225 Q 190 187 140 224 Q 90 267 40 224 Q -10 174 -60 223",
  "M 2060 374 C 2032 372 1947 372 1890 364 C 1833 355 1777 338 1720 324 C 1663 310 1607 292 1550 280 C 1493 268 1437 264 1380 253 C 1323 242 1267 222 1210 214 C 1153 206 1068 207 1040 206 Q 990 205 940 201 Q 890 193 840 196 Q 790 205 740 191 Q 690 172 640 186 Q 590 205 540 180 Q 490 149 440 175 Q 390 207 340 170 Q 290 126 240 167 Q 190 216 140 166 Q 90 109 40 166 Q -10 230 -60 165",
  "M 2060 314 C 2032 312 1947 312 1890 304 C 1833 295 1777 278 1720 264 C 1663 250 1607 232 1550 220 C 1493 208 1437 204 1380 193 C 1323 182 1267 162 1210 154 C 1153 146 1068 147 1040 146 Q 990 142 940 141 Q 890 146 840 136 Q 790 121 740 131 Q 690 149 640 126 Q 590 96 540 120 Q 490 153 440 115 Q 390 68 340 110 Q 290 160 240 107 Q 190 46 140 106 Q 90 176 40 106 Q -10 26 -60 105",
];

export function initCarVisual(root: ParentNode): void {
  const slider = root.querySelector<HTMLInputElement>('[data-testid="wing-angle-slider"]');
  const scene = root.querySelector<HTMLElement>('[data-testid="car-scene"]');
  const lines = AIRFLOW_ATTACHED.map((_, i) =>
    root.querySelector<SVGPathElement>(`[data-testid="airflow-line-${i + 1}"]`),
  );
  if (!slider || !scene || lines.some((line) => line === null)) {
    return;
  }

  const render = () => {
    // The car is a fixed drawing, so the flow is the only thing that responds
    // to the slider. "Reaches or passes" the stall angle, so this is >=, one
    // degree earlier than the chart's stall-insight copy.
    const separated = Number(slider.value) >= STALL_ANGLE_DEG;
    const paths = separated ? AIRFLOW_SEPARATED : AIRFLOW_ATTACHED;
    lines.forEach((line, i) => line?.setAttribute("d", paths[i]));
    scene.classList.toggle("stalled", separated);
  };

  slider.addEventListener("input", render);
  render();
}
