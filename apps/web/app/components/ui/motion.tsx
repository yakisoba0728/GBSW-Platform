'use client'

import type { Easing, TargetAndTransition, Transition } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'

export const MOTION_EASE = [0.16, 1, 0.3, 1] as const
const LINEAR_EASE: Easing = 'linear'

type EnterExitMotion = {
  initial: TargetAndTransition
  animate: TargetAndTransition
  exit: TargetAndTransition
  transition: Transition
}

type AxisMotion = {
  initial: TargetAndTransition
  animate: TargetAndTransition
  exit: TargetAndTransition
  transition: Transition
}

export function useMotionPreference() {
  return useReducedMotion() ?? false
}

export function getStaggerDelay(index: number) {
  return Math.min(index, 6) * 0.05
}

export function getPageMotion(
  prefersReducedMotion: boolean,
  delay = 0,
): EnterExitMotion {
  return prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2, delay, ease: LINEAR_EASE },
      }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 6 },
        transition: { duration: 0.3, delay, ease: MOTION_EASE },
      }
}

export function getSectionMotion(
  prefersReducedMotion: boolean,
  delay = 0,
): {
  initial: TargetAndTransition
  animate: TargetAndTransition
  transition: Transition
} {
  return prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2, delay, ease: LINEAR_EASE },
      }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.28, delay, ease: MOTION_EASE },
      }
}

export function getItemMotion(
  prefersReducedMotion: boolean,
  index: number,
): {
  initial: TargetAndTransition
  animate: TargetAndTransition
  transition: Transition
} {
  return prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: {
          duration: 0.16,
          delay: getStaggerDelay(index),
          ease: LINEAR_EASE,
        },
      }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.24, delay: getStaggerDelay(index), ease: MOTION_EASE },
      }
}

export function getOverlayMotion(prefersReducedMotion: boolean): EnterExitMotion {
  return prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.16, ease: LINEAR_EASE },
      }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.24, ease: MOTION_EASE },
      }
}

export function getModalMotion(prefersReducedMotion: boolean): EnterExitMotion {
  return prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.18, ease: LINEAR_EASE },
      }
    : {
        initial: { opacity: 0, y: 16, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 8, scale: 0.98 },
        transition: { duration: 0.3, ease: MOTION_EASE },
      }
}

export function getDrawerMotion(prefersReducedMotion: boolean): AxisMotion {
  return prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.18, ease: LINEAR_EASE },
      }
    : {
        initial: { x: -280, opacity: 0.96 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -280, opacity: 0.96 },
        transition: { duration: 0.32, ease: MOTION_EASE },
      }
}
