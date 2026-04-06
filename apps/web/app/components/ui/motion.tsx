'use client'

import type { Easing, TargetAndTransition, Transition } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'

type MotionEase = NonNullable<Transition['ease']>

export const MOTION_EASE: MotionEase = [0.16, 1, 0.3, 1]
export const MOTION_EASE_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)'
const LINEAR_EASE: Easing = 'linear'
const LINEAR_EASE_CSS = 'linear'

export const MOTION_DURATION = {
  micro: 0.18,
  pageEnter: 0.22,
  pageExit: 0.18,
  section: 0.22,
  item: 0.22,
  overlayEnter: 0.28,
  overlayExit: 0.22,
  modalEnter: 0.2,
  modalExit: 0.15,
  drawer: 0.28,
  toastEnter: 0.2,
  toastExit: 0.15,
  tooltip: 0.18,
  chart: 0.56,
  inlineMessageEnter: 0.18,
  inlineMessageExit: 0.15,
} as const

const REDUCED_MOTION_DURATION = {
  micro: 0.14,
  page: 0.18,
  section: 0.18,
  item: 0.18,
  overlay: 0.18,
  modal: 0.18,
  drawer: 0.18,
  toast: 0.16,
  tooltip: 0.14,
  chart: 0.16,
  inlineMessage: 0.16,
} as const

const LEGACY_STAGGER_DELAYS = [0, 0.08, 0.16, 0.24, 0.32, 0.4] as const
const STAGGER_TAPER_STEP = 0.04
const STAGGER_MAX_DELAY = 0.64

export const CHART_LANE_OFFSET = 0.08
export const MODAL_BASE_EXIT_DURATION_MS = 220

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

function withTransition(
  target: TargetAndTransition,
  transition: Transition,
): TargetAndTransition {
  return { ...target, transition }
}

function getTransition(
  duration: number,
  delay = 0,
  ease: MotionEase = MOTION_EASE,
): Transition {
  return { duration, delay, ease }
}

function getMotionTransition(
  prefersReducedMotion: boolean,
  normalDuration: number,
  reducedDuration: number,
  delay = 0,
  ease: MotionEase = MOTION_EASE,
): Transition {
  return prefersReducedMotion
    ? getTransition(reducedDuration, delay, LINEAR_EASE)
    : getTransition(normalDuration, delay, ease)
}

export function getStaggerDelay(index: number) {
  if (index <= 0) {
    return 0
  }

  const legacyDelay = LEGACY_STAGGER_DELAYS[index]
  if (legacyDelay !== undefined) {
    return legacyDelay
  }

  const taperedDelay =
    LEGACY_STAGGER_DELAYS[LEGACY_STAGGER_DELAYS.length - 1] +
    (index - (LEGACY_STAGGER_DELAYS.length - 1)) * STAGGER_TAPER_STEP

  return Math.min(taperedDelay, STAGGER_MAX_DELAY)
}

export function getChartDelay(index: number, laneOffset = 0) {
  return Math.min(getStaggerDelay(index) + laneOffset, STAGGER_MAX_DELAY)
}

export function getChartRevealTransition(
  prefersReducedMotion: boolean,
  index: number,
  laneOffset = 0,
) {
  return getMotionTransition(
    prefersReducedMotion,
    MOTION_DURATION.chart,
    REDUCED_MOTION_DURATION.chart,
    getChartDelay(index, laneOffset),
  )
}

export function getMicroInteractionTransition(
  prefersReducedMotion: boolean,
  delay = 0,
) {
  return getMotionTransition(
    prefersReducedMotion,
    MOTION_DURATION.micro,
    REDUCED_MOTION_DURATION.micro,
    delay,
  )
}

export function getAccordionTransitionCss(prefersReducedMotion: boolean) {
  const durationMs = Math.round(
    (prefersReducedMotion
      ? REDUCED_MOTION_DURATION.section
      : MOTION_DURATION.item) * 1000,
  )
  const easing = prefersReducedMotion ? LINEAR_EASE_CSS : MOTION_EASE_CSS

  return `grid-template-rows ${durationMs}ms ${easing}, margin-bottom ${durationMs}ms ${easing}`
}

export function getPageMotion(
  prefersReducedMotion: boolean,
  delay = 0,
): EnterExitMotion {
  const enterTransition = getMotionTransition(
    prefersReducedMotion,
    MOTION_DURATION.pageEnter,
    REDUCED_MOTION_DURATION.page,
    delay,
  )
  const exitTransition = getMotionTransition(
    prefersReducedMotion,
    MOTION_DURATION.pageExit,
    REDUCED_MOTION_DURATION.page,
  )

  return prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: withTransition({ opacity: 1 }, enterTransition),
        exit: withTransition({ opacity: 0 }, exitTransition),
        transition: enterTransition,
      }
    : {
        initial: { opacity: 0, y: 10 },
        animate: withTransition({ opacity: 1, y: 0 }, enterTransition),
        exit: withTransition({ opacity: 0, y: 6 }, exitTransition),
        transition: enterTransition,
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
  const transition = getMotionTransition(
    prefersReducedMotion,
    MOTION_DURATION.section,
    REDUCED_MOTION_DURATION.section,
    delay,
  )

  return prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: withTransition({ opacity: 1 }, transition),
        transition,
      }
    : {
        initial: { opacity: 0, y: 10 },
        animate: withTransition({ opacity: 1, y: 0 }, transition),
        transition,
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
  const transition = getMotionTransition(
    prefersReducedMotion,
    MOTION_DURATION.item,
    REDUCED_MOTION_DURATION.item,
    getStaggerDelay(index),
  )

  return prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: withTransition({ opacity: 1 }, transition),
        transition,
      }
    : {
        initial: { opacity: 0, y: 10 },
        animate: withTransition({ opacity: 1, y: 0 }, transition),
        transition,
      }
}

export function getOverlayMotion(prefersReducedMotion: boolean): EnterExitMotion {
  const enterTransition = getMotionTransition(
    prefersReducedMotion,
    MOTION_DURATION.overlayEnter,
    REDUCED_MOTION_DURATION.overlay,
  )
  const exitTransition = getMotionTransition(
    prefersReducedMotion,
    MOTION_DURATION.overlayExit,
    REDUCED_MOTION_DURATION.overlay,
  )

  return prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: withTransition({ opacity: 1 }, enterTransition),
        exit: withTransition({ opacity: 0 }, exitTransition),
        transition: enterTransition,
      }
    : {
        initial: { opacity: 0 },
        animate: withTransition({ opacity: 1 }, enterTransition),
        exit: withTransition({ opacity: 0 }, exitTransition),
        transition: enterTransition,
      }
}

export function getModalMotion(prefersReducedMotion: boolean): EnterExitMotion {
  const enterTransition = getMotionTransition(
    prefersReducedMotion,
    MOTION_DURATION.modalEnter,
    REDUCED_MOTION_DURATION.modal,
  )
  const exitTransition = getMotionTransition(
    prefersReducedMotion,
    MOTION_DURATION.modalExit,
    REDUCED_MOTION_DURATION.modal,
  )

  return prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: withTransition({ opacity: 1 }, enterTransition),
        exit: withTransition({ opacity: 0 }, exitTransition),
        transition: enterTransition,
      }
    : {
        initial: { opacity: 0, y: 16, scale: 0.97 },
        animate: withTransition({ opacity: 1, y: 0, scale: 1 }, enterTransition),
        exit: withTransition({ opacity: 0, y: 8, scale: 0.98 }, exitTransition),
        transition: enterTransition,
      }
}

export function getDrawerMotion(prefersReducedMotion: boolean): AxisMotion {
  const transition = getMotionTransition(
    prefersReducedMotion,
    MOTION_DURATION.drawer,
    REDUCED_MOTION_DURATION.drawer,
  )

  return prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: withTransition({ opacity: 1 }, transition),
        exit: withTransition({ opacity: 0 }, transition),
        transition,
      }
    : {
        initial: { x: -280, opacity: 0.96 },
        animate: withTransition({ x: 0, opacity: 1 }, transition),
        exit: withTransition({ x: -280, opacity: 0.96 }, transition),
        transition,
      }
}

export function getInlineMessageMotion(
  prefersReducedMotion: boolean,
  delay = 0,
): EnterExitMotion {
  const enterTransition = getMotionTransition(
    prefersReducedMotion,
    MOTION_DURATION.inlineMessageEnter,
    REDUCED_MOTION_DURATION.inlineMessage,
    delay,
  )
  const exitTransition = getMotionTransition(
    prefersReducedMotion,
    MOTION_DURATION.inlineMessageExit,
    REDUCED_MOTION_DURATION.inlineMessage,
  )

  return prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: withTransition({ opacity: 1 }, enterTransition),
        exit: withTransition({ opacity: 0 }, exitTransition),
        transition: enterTransition,
      }
    : {
        initial: { opacity: 0, y: -6 },
        animate: withTransition({ opacity: 1, y: 0 }, enterTransition),
        exit: withTransition({ opacity: 0, y: -4 }, exitTransition),
        transition: enterTransition,
      }
}

export function getToastMotion(prefersReducedMotion: boolean): EnterExitMotion {
  const enterTransition = getMotionTransition(
    prefersReducedMotion,
    MOTION_DURATION.toastEnter,
    REDUCED_MOTION_DURATION.toast,
  )
  const exitTransition = getMotionTransition(
    prefersReducedMotion,
    MOTION_DURATION.toastExit,
    REDUCED_MOTION_DURATION.toast,
  )

  return prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: withTransition({ opacity: 1 }, enterTransition),
        exit: withTransition({ opacity: 0 }, exitTransition),
        transition: enterTransition,
      }
    : {
        initial: { opacity: 0, x: 48, scale: 0.98 },
        animate: withTransition({ opacity: 1, x: 0, scale: 1 }, enterTransition),
        exit: withTransition({ opacity: 0, x: 32, scale: 0.97 }, exitTransition),
        transition: enterTransition,
      }
}

export function getTooltipMotion(prefersReducedMotion: boolean): EnterExitMotion {
  const transition = getMotionTransition(
    prefersReducedMotion,
    MOTION_DURATION.tooltip,
    REDUCED_MOTION_DURATION.tooltip,
  )

  return prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: withTransition({ opacity: 1 }, transition),
        exit: withTransition({ opacity: 0 }, transition),
        transition,
      }
    : {
        initial: { opacity: 0, scale: 0.97 },
        animate: withTransition({ opacity: 1, scale: 1 }, transition),
        exit: withTransition({ opacity: 0, scale: 0.97 }, transition),
        transition,
      }
}
