"use client";

import { SmoothScroll } from "./SmoothScroll";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <SmoothScroll>{children}</SmoothScroll>;
}
