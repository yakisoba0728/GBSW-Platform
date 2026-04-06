'use client'

let bodyScrollLockCount = 0
let previousOverflow = ''

export function acquireBodyScrollLock() {
  if (typeof document === 'undefined') {
    return () => {}
  }

  if (bodyScrollLockCount === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }

  bodyScrollLockCount += 1

  let released = false

  return () => {
    if (released || typeof document === 'undefined') {
      return
    }

    released = true
    bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1)

    if (bodyScrollLockCount === 0) {
      document.body.style.overflow = previousOverflow
      previousOverflow = ''
    }
  }
}
