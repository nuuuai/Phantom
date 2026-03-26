import { useEffect, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  durationMs?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  durationMs = 1000,
  className,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start: number | undefined;
    let frameId = 0;
    const step = (ts: number) => {
      if (start === undefined) start = ts;
      const p = Math.min((ts - start) / durationMs, 1);
      setDisplay(Math.floor(p * value));
      if (p < 1) {
        frameId = requestAnimationFrame(step);
      }
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, durationMs]);

  return <span className={className}>{display.toLocaleString()}</span>;
}
