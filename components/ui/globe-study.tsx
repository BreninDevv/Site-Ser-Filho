"use client";

import { type CSSProperties } from "react";

export type GlobeStudyProps = {
  mode?: "dark" | "light";
  scale?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  className?: string;
  style?: CSSProperties;
};

export const GLOBE_STUDY_DEFAULTS = {
  mode: "light",
  scale: 1,
  opacity: 1,
  hue: 0,
  saturation: 1,
  brightness: 1,
} as const;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export default function GlobeStudy({
  mode = GLOBE_STUDY_DEFAULTS.mode,
  scale = GLOBE_STUDY_DEFAULTS.scale,
  opacity = GLOBE_STUDY_DEFAULTS.opacity,
  hue = GLOBE_STUDY_DEFAULTS.hue,
  saturation = GLOBE_STUDY_DEFAULTS.saturation,
  brightness = GLOBE_STUDY_DEFAULTS.brightness,
  className,
  style,
}: GlobeStudyProps) {
  const safeMode = mode === "light" ? "light" : "dark";
  const boundedScale = clamp(scale, 0.65, 1.5);
  const boundedOpacity = clamp(opacity, 0.1, 1);
  const boundedHue = clamp(hue, -180, 180);
  const boundedSaturation = clamp(saturation, 0, 2);
  const boundedBrightness = clamp(brightness, 0.4, 1.8);
  const filter =
    boundedHue === 0 && boundedSaturation === 1 && boundedBrightness === 1
      ? undefined
      : `hue-rotate(${boundedHue}deg) saturate(${boundedSaturation}) brightness(${boundedBrightness})`;

  return (
    <iframe
      src="/globe-study.html"
      title="Globo Ser Filho"
      className={["text-path-study", `text-path-study--${safeMode}`, className]
        .filter(Boolean)
        .join(" ")}
      data-mode={safeMode}
      style={{
        opacity: boundedOpacity,
        filter,
        width: "100%",
        height: "100%",
        border: 0,
        background: "transparent",
        transform: boundedScale === 1 ? undefined : `scale(${boundedScale})`,
        ...style,
      }}
    />
  );
}
