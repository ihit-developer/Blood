export default function DonutChart({ segments, size = 188, thickness = 22, centerValue, centerLabel, active }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const mid = size / 2;
  let offset = 0;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}
      className="donut"
    >
      <circle cx={mid} cy={mid} r={radius} fill="none" strokeWidth={thickness} style={{ stroke: "var(--line-2)" }} />
      {total > 0 &&
        segments
          .filter((s) => s.value > 0)
          .map((s) => {
            const length = (s.value / total) * circumference;
            const circle = (
              <circle
                key={s.label}
                cx={mid}
                cy={mid}
                r={radius}
                fill="none"
                strokeWidth={thickness}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${mid} ${mid})`}
                style={{ stroke: s.color, opacity: !active || active === s.label ? 1 : 0.22, transition: "opacity .2s" }}
              />
            );
            offset += length;
            return circle;
          })}
      <text x={mid} y={mid - 2} textAnchor="middle" className="donut-value">
        {centerValue}
      </text>
      <text x={mid} y={mid + 20} textAnchor="middle" className="donut-label">
        {centerLabel}
      </text>
    </svg>
  );
}
