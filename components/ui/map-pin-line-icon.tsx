import type { SVGProps } from "react";
import type { IconType } from "react-icons";

import { cn } from "@/lib/utils";

export function MapPinLineIcon({
  size = 24,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={cn("inline-block shrink-0", className)}
      aria-hidden
      {...props}
    >
      <path
        fill="currentColor"
        d="M200 224h-49.46A267 267 0 0 0 174 200.25c27.45-31.57 42-64.85 42-96.25a88 88 0 0 0-176 0c0 31.4 14.51 64.68 42 96.25A267 267 0 0 0 105.46 224H56a8 8 0 0 0 0 16h144a8 8 0 0 0 0-16M56 104a72 72 0 0 1 144 0c0 57.23-55.47 105-72 118c-16.53-13-72-60.77-72-118m112 0a40 40 0 1 0-40 40a40 40 0 0 0 40-40m-64 0a24 24 0 1 1 24 24a24 24 0 0 1-24-24"
      />
    </svg>
  );
}

/** Compatível com `IconType` do GradientMenu. */
export const MapPinLineMenuIcon: IconType = ({ className, size }) => {
  const pixels =
    typeof size === "number"
      ? size
      : className?.includes("text-2xl")
        ? 24
        : className?.includes("text-xl")
          ? 20
          : 22;

  return (
    <MapPinLineIcon
      className={cn("text-current", className)}
      size={pixels}
    />
  );
};
