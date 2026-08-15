import { STALL_ANGLE_DEG } from "./aero-model";

const WING_PIVOT_X = 100;
const WING_PIVOT_Y = 112;

const AIRFLOW_SMOOTH_PATHS = ["M 100 100 C 75 94, 45 94, 20 102", "M 100 86 C 75 80, 45 80, 20 88"];

const AIRFLOW_SEPARATED_PATHS = [
  "M 100 100 L 85 106 L 70 94 L 55 106 L 40 92 L 25 104 L 10 94",
  "M 100 86 L 85 94 L 70 80 L 55 94 L 40 78 L 25 92 L 10 82",
];

export function initCarVisual(root: ParentNode): void {
  const slider = root.querySelector<HTMLInputElement>('[data-testid="wing-angle-slider"]');
  const wing = root.querySelector<SVGGElement>('[data-testid="rear-wing"]');
  const airflowLines = [
    root.querySelector<SVGPathElement>('[data-testid="airflow-line-1"]'),
    root.querySelector<SVGPathElement>('[data-testid="airflow-line-2"]'),
  ];
  if (!slider || !wing || !airflowLines[0] || !airflowLines[1]) {
    return;
  }

  const render = () => {
    const angle = Number(slider.value);
    wing.setAttribute("transform", `rotate(${angle} ${WING_PIVOT_X} ${WING_PIVOT_Y})`);

    const separated = angle > STALL_ANGLE_DEG;
    airflowLines.forEach((line, i) => {
      if (!line) return;
      line.setAttribute("d", separated ? AIRFLOW_SEPARATED_PATHS[i] : AIRFLOW_SMOOTH_PATHS[i]);
      line.classList.toggle("separated", separated);
    });
  };

  slider.addEventListener("input", render);
  render();
}
