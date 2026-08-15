import { STALL_ANGLE_DEG } from "./aero-model";

const AIRFLOW_SMOOTH_PATHS = ["M 101 100 C 76 94, 46 94, 21 102", "M 101 86 C 76 80, 46 80, 21 88"];

const AIRFLOW_SEPARATED_PATHS = [
  "M 101 100 L 86 106 L 71 94 L 56 106 L 41 92 L 26 104 L 11 94",
  "M 101 86 L 86 94 L 71 80 L 56 94 L 41 78 L 26 92 L 11 82",
];

export function initCarVisual(root: ParentNode): void {
  const slider = root.querySelector<HTMLInputElement>('[data-testid="wing-angle-slider"]');
  const wing = root.querySelector<SVGSVGElement>('[data-testid="rear-wing"]');
  const airflowLines = [
    root.querySelector<SVGPathElement>('[data-testid="airflow-line-1"]'),
    root.querySelector<SVGPathElement>('[data-testid="airflow-line-2"]'),
  ];
  if (!slider || !wing || !airflowLines[0] || !airflowLines[1]) {
    return;
  }

  const render = () => {
    const angle = Number(slider.value);
    wing.style.transform = `rotate(${angle}deg)`;

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
