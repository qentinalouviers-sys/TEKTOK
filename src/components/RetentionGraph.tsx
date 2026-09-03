import React from "react";

interface RetentionGraphProps {
  data: number[];
  durationSeconds: number;
}

export const RetentionGraph: React.FC<RetentionGraphProps> = ({ data, durationSeconds }) => {
  if (!data || data.length === 0) return null;

  const width = 360;
  const height = 110;
  const paddingX = 24;
  const paddingY = 18;

  const minVal = 70;
  const maxVal = 100;

  const points = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((val - minVal) / (maxVal - minVal)) * (height - paddingY * 2);
    return { x, y, val };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x},${pt.y}`;
    const prev = points[idx - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${pt.x},${pt.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

  return (
    <div className="w-full bg-white/[0.03] rounded-2xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Courbe de Rétention Prédictive (TikTok)
          </span>
        </div>
        <span className="text-xs text-cyan-400 font-mono font-bold">
          {data[0]}% ➔ {data[data.length - 1]}%
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
        <defs>
          <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#050507" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid guide */}
        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
          stroke="rgba(255,255,255,0.08)"
          strokeDasharray="3 3"
        />

        {/* Gradient fill */}
        <path d={areaD} fill="url(#retentionGrad)" />

        {/* Smooth line */}
        <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />

        {/* Nodes */}
        {points.map((pt, i) => (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r="3.5" className="fill-cyan-400 stroke-[#050507] stroke-2" />
            {i === 0 && (
              <text x={pt.x} y={pt.y - 8} fill="#67e8f9" fontSize="10" fontWeight="bold" textAnchor="middle">
                0s ({pt.val}%)
              </text>
            )}
            {i === points.length - 1 && (
              <text x={pt.x} y={pt.y - 8} fill="#67e8f9" fontSize="10" fontWeight="bold" textAnchor="middle">
                {durationSeconds}s ({pt.val}%)
              </text>
            )}
          </g>
        ))}
      </svg>

      <div className="flex items-center justify-between text-[11px] text-white/40 mt-1 font-mono">
        <span>0s (Hook)</span>
        <span className="text-white/20">Maintien de l'attention</span>
        <span>{durationSeconds}s (Fin)</span>
      </div>
    </div>
  );
};
