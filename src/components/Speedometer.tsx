// src/components/Speedometer.tsx
import { useMemo } from "react";

interface Props {
  speed: number;       // km/h   (0‑400)
  rpm: number;         // 0‑15k
  gear: number | "N";
  throttle: number;    // 0‑1
  brake: number;       // 0‑1
  drs: boolean;        // true = active
}

/**
 * Converts a value in [0,1] to an angle on the gauge.
 * We reserve 260° sweep:  -40° (left bottom) to +220° (right bottom)
 */
const valueToAngle = (v: number) => -40 + v * 260;

export default function Speedometer({
  speed,
  rpm,
  gear,
  throttle,
  brake,
  drs,
}: Props) {
  /**
   * Build SVG arc paths only when inputs change
   * (avoids string concatenation every render).
   */
  const { throttlePath, brakePath } = useMemo(() => {
    // Arc generator helper
    const arc = (from: number, to: number) => {
      const r = 90;                    // radius
      const polar = (a: number) => {
        const rad = (a * Math.PI) / 180;
        return [100 + r * Math.cos(rad), 100 + r * Math.sin(rad)];
      };
      const [x1, y1] = polar(from);
      const [x2, y2] = polar(to);
      const large = to - from > 180 ? 1 : 0;
      return `M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
    };

    // Throttle draws from -40° up to (-40+ throttle*220)
    const throttleEnd = valueToAngle(throttle * 0.846); // scale to 220°
    const throttlePath = arc(-40, throttleEnd);

    // Brake draws from 180° up to (180+ brake*80)
    const brakeStart = 180;
    const brakeEnd = 180 + brake * 80;
    const brakePath = arc(brakeStart, brakeEnd);

    return { throttlePath, brakePath };
  }, [throttle, brake]);

  return (
    <div className="w-56 select-none">
      <svg width={200} height={200} viewBox="0 0 200 200">
        {/* BACKGROUND TICKS (static) */}
        <circle cx={100} cy={100} r={90} fill="none" stroke="#2e2e46" strokeWidth={18} />

        {/* THROTTLE ARC */}
        <path d={throttlePath} stroke="#00c851" strokeWidth={18} fill="none" strokeLinecap="round" />

        {/* BRAKE ARC */}
        <path d={brakePath} stroke="#ff3547" strokeWidth={18} fill="none" strokeLinecap="round" />

        {/* Center texts */}
        <text x="100" y="85" textAnchor="middle" fontSize="32" fill="#fff" fontFamily="Orbitron">
          {Math.round(speed)}
        </text>
        <text x="100" y="110" textAnchor="middle" fontSize="12" letterSpacing="1" fill="#ccc">
          KM/H
        </text>
        <text x="100" y="128" textAnchor="middle" fontSize="16" fill="#fff">
          {Math.round(rpm / 1000)}k
        </text>
        <text x="100" y="142" textAnchor="middle" fontSize="10" fill="#ccc">
          RPM
        </text>

        {/* DRS / Gear row */}
        <rect x="80" y="150" width="40" height="16" rx="3" fill={drs ? "#ff3547" : "#444"} />
        <text x="100" y="162" textAnchor="middle" fontSize="10" fill="#fff">
          DRS
        </text>

        <text x="100" y="185" textAnchor="middle" fontSize="14" fill="#fff">
          GEAR {gear}
        </text>
      </svg>
    </div>
  );
}
