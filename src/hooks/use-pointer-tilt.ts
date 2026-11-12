"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function usePointerTilt(max = 14) {
  const reduced = useReducedMotion();
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const frame = useRef(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const animate = useCallback(() => {
    const step = () => {
      current.current.x += (target.current.x - current.current.x) * 0.12;
      current.current.y += (target.current.y - current.current.y) * 0.12;
      setTilt({ x: current.current.x, y: current.current.y });
      if (
        Math.abs(target.current.x - current.current.x) > 0.04 ||
        Math.abs(target.current.y - current.current.y) > 0.04
      ) {
        frame.current = requestAnimationFrame(step);
      }
    };
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(step);
  }, []);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (reduced) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      target.current = { x: -(ny * max), y: nx * max };
      animate();
    },
    [animate, max, reduced],
  );

  const onPointerLeave = useCallback(() => {
    target.current = { x: 0, y: 0 };
    animate();
  }, [animate]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return { tilt, onPointerMove, onPointerLeave, reduced };
}
