"use client";

import { motion } from "framer-motion";
import type { ComponentProps } from "react";

type MotionChildren = ComponentProps<typeof motion.div>["children"];

/* -------------------------------------------------------------------------- */
/*  Premium animation tokens — smoother, ease-out, 0.5s                       */
/* -------------------------------------------------------------------------- */

const EASE_OUT = [0.22, 0.61, 0.36, 1] as const;
const DURATION = 0.5;
const DISTANCE = 16;

/* -------------------------------------------------------------------------- */
/*  FadeIn – single-element fade + slide wrapper                               */
/* -------------------------------------------------------------------------- */

interface FadeInProps {
  children: MotionChildren;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  /** Disable whileInView (animate immediately on mount) */
  onMount?: boolean;
}

export default function FadeIn({
  children,
  delay = 0,
  className,
  direction = "up",
  onMount = false,
}: FadeInProps) {
  const offsetX =
    direction === "left" ? DISTANCE : direction === "right" ? -DISTANCE : 0;
  const offsetY =
    direction === "up" ? DISTANCE : direction === "down" ? -DISTANCE : 0;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: offsetX, y: offsetY }}
      {...(onMount
        ? { animate: { opacity: 1, x: 0, y: 0 } }
        : { whileInView: { opacity: 1, x: 0, y: 0 } })}
      {...(onMount ? {} : { viewport: { once: true, margin: "-40px" } })}
      transition={{ duration: DURATION, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  FadeInStagger – container that staggers its FadeInItem children           */
/* -------------------------------------------------------------------------- */

interface FadeInStaggerProps {
  children: MotionChildren;
  className?: string;
  staggerDelay?: number;
}

export function FadeInStagger({
  children,
  className,
  staggerDelay = 0.06,
}: FadeInStaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      variants={{
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: staggerDelay, delayChildren: 0.05 },
        },
      }}
      viewport={{ once: true, margin: "-40px" }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  FadeInItem – child element used inside FadeInStagger                       */
/* -------------------------------------------------------------------------- */

interface FadeInItemProps {
  children: MotionChildren;
  className?: string;
}

export function FadeInItem({ children, className }: FadeInItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: DISTANCE },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: DURATION, ease: EASE_OUT },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
