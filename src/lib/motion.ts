/**
 * Unified Motion & Physics Design Tokens for XiLust
 * Adhering to Emil Kowalski's animation philosophy and Apple Human Interface Guidelines.
 *
 * Rules:
 * 1. Only animate composite-friendly properties: transform and opacity.
 * 2. Never scale from 0; start from 0.9 - 0.96 for natural physical appearance.
 * 3. Never use uniform linear timing; use calibrated spring physics or cubic curves.
 */

import { type Transition, type Variants } from "framer-motion";

// --- Spring Physics Configurations ---

/**
 * Snappy, immediate response for high-frequency interactions (tab indicators, active pills, clicks).
 */
export const SPRING_SNAPPY: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 35,
  mass: 0.8,
};

/**
 * Tactile, playful bounce for delight moments (bookmark heart, likes, badge pops).
 */
export const SPRING_BOUNCY: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 22,
  mass: 1,
};

/**
 * Gentle, cinematic glide for panels, drawers, sidebar expand/collapse, and modals.
 */
export const SPRING_GENTLE: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 30,
  mass: 1,
};

/**
 * Smooth deceleration curve for entrances and crossfades.
 */
export const EASE_DECEL = [0.16, 1, 0.3, 1] as const;

// --- Standard Animation Variants ---

/**
 * Subtle modal entrance/exit (scale 0.95 -> 1.0, opacity 0 -> 1)
 */
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: SPRING_GENTLE,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 4,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

/**
 * Card stagger item for catalog arrivals (first 8 items max)
 */
export const cardArrivalVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: Math.min(i, 8) * 0.035,
      duration: 0.28,
      ease: EASE_DECEL,
    },
  }),
};

/**
 * Micro-bounce tap effect for buttons and pills
 */
export const buttonTapMotion = {
  scale: 0.96,
  transition: { duration: 0.1, ease: "easeOut" },
};
