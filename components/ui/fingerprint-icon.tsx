"use client";

/**
 * fingerprint — Lucide Animated (https://lucide-animated.com)
 * Author: dmytro (@pqoqubbw) · MIT
 * https://github.com/pqoqubbw/icons
 */
import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes, MouseEvent } from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type { IconType } from "react-icons";

import { cn } from "@/lib/utils";

export interface FingerprintIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FingerprintIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const PATH_VARIANTS: Variants = {
  normal: { pathLength: 1, opacity: 1 },
  animate: {
    opacity: [0, 0, 1, 1, 1],
    pathLength: [0.1, 0.3, 0.5, 0.7, 0.9, 1],
    transition: {
      opacity: { duration: 0.5 },
      pathLength: {
        duration: 2,
      },
    },
  },
};

const FingerprintIcon = forwardRef<FingerprintIconHandle, FingerprintIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    // Anima também no hover do botão do menu (pai `.group`)
    useEffect(() => {
      const node = rootRef.current;
      if (!node) return;
      const group = node.closest(".group");
      if (!group) return;

      const enter = () => {
        if (!isControlledRef.current) controls.start("animate");
      };
      const leave = () => {
        if (!isControlledRef.current) controls.start("normal");
      };

      group.addEventListener("mouseenter", enter);
      group.addEventListener("mouseleave", leave);
      return () => {
        group.removeEventListener("mouseenter", enter);
        group.removeEventListener("mouseleave", leave);
      };
    }, [controls]);

    const handleMouseEnter = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave]
    );

    return (
      <div
        ref={rootRef}
        className={cn("inline-flex items-center justify-center", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"
            fill="none"
            strokeOpacity={0.4}
            strokeWidth="2"
          />
          <motion.path
            animate={controls}
            d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"
            variants={PATH_VARIANTS}
          />

          <path
            d="M14 13.12c0 2.38 0 6.38-1 8.88"
            fill="none"
            strokeOpacity={0.4}
            strokeWidth="2"
          />
          <motion.path
            animate={controls}
            d="M14 13.12c0 2.38 0 6.38-1 8.88"
            variants={PATH_VARIANTS}
          />

          <path
            d="M17.29 21.02c.12-.6.43-2.3.5-3.02"
            fill="none"
            strokeOpacity={0.4}
            strokeWidth="2"
          />
          <motion.path
            animate={controls}
            d="M17.29 21.02c.12-.6.43-2.3.5-3.02"
            variants={PATH_VARIANTS}
          />

          <path
            d="M2 12a10 10 0 0 1 18-6"
            fill="none"
            strokeOpacity={0.4}
            strokeWidth="2"
          />
          <motion.path
            animate={controls}
            d="M2 12a10 10 0 0 1 18-6"
            variants={PATH_VARIANTS}
          />

          <path d="M2 16h.01" fill="none" strokeOpacity={0.4} strokeWidth="2" />
          <motion.path
            animate={controls}
            d="M2 16h.01"
            variants={PATH_VARIANTS}
          />

          <path
            d="M21.8 16c.2-2 .131-5.354 0-6"
            fill="none"
            strokeOpacity={0.4}
            strokeWidth="2"
          />
          <motion.path
            animate={controls}
            d="M21.8 16c.2-2 .131-5.354 0-6"
            variants={PATH_VARIANTS}
          />

          <path
            d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"
            fill="none"
            strokeOpacity={0.4}
            strokeWidth="2"
          />
          <motion.path
            animate={controls}
            d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"
            variants={PATH_VARIANTS}
          />

          <path
            d="M8.65 22c.21-.66.45-1.32.57-2"
            fill="none"
            strokeOpacity={0.4}
            strokeWidth="2"
          />
          <motion.path
            animate={controls}
            d="M8.65 22c.21-.66.45-1.32.57-2"
            variants={PATH_VARIANTS}
          />

          <path
            d="M9 6.8a6 6 0 0 1 9 5.2v2"
            fill="none"
            strokeOpacity={0.4}
            strokeWidth="2"
          />
          <motion.path
            animate={controls}
            d="M9 6.8a6 6 0 0 1 9 5.2v2"
            variants={PATH_VARIANTS}
          />
        </svg>
      </div>
    );
  }
);

FingerprintIcon.displayName = "FingerprintIcon";

/** Compatível com `IconType` do GradientMenu. */
export const FingerprintMenuIcon: IconType = ({ className, size }) => {
  const pixels =
    typeof size === "number"
      ? size
      : className?.includes("text-2xl")
        ? 24
        : className?.includes("text-xl")
          ? 20
          : 22;

  return (
    <FingerprintIcon
      className={cn("text-current", className)}
      size={pixels}
      aria-hidden
    />
  );
};

export { FingerprintIcon };
