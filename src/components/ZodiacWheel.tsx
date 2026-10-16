import { GLYPHS, SIGNS } from "@/lib/zodiac";

export function ZodiacWheel({ className = "" }: { className?: string }) {
  const c = 200;
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label="Zodiac wheel">
      <g className="wheel-turn">
        <circle cx={c} cy={c} r="192" fill="none" stroke="#e6c479" strokeOpacity="0.55" />
        <circle cx={c} cy={c} r="140" fill="none" stroke="#9ea1cc" strokeOpacity="0.35" />
        <circle cx={c} cy={c} r="60" fill="none" stroke="#9ea1cc" strokeOpacity="0.25" />
        {SIGNS.map((s, i) => {
          const a = (i * 30 - 90) * (Math.PI / 180);
          const mid = ((i * 30 + 15) - 90) * (Math.PI / 180);
          return (
            <g key={s}>
              <line
                x1={c + 140 * Math.cos(a)} y1={c + 140 * Math.sin(a)}
                x2={c + 192 * Math.cos(a)} y2={c + 192 * Math.sin(a)}
                stroke="#9ea1cc" strokeOpacity="0.4"
              />
              <text
                x={c + 166 * Math.cos(mid)} y={c + 166 * Math.sin(mid)}
                textAnchor="middle" dominantBaseline="central"
                fontSize="22" fill="#efd08a"
              >
                {GLYPHS[s]}&#xFE0E;
              </text>
            </g>
          );
        })}
        <circle cx={c} cy={c} r="5" fill="#efd08a" />
      </g>
    </svg>
  );
}
