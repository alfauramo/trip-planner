export function hapticLight() {
  try { navigator.vibrate?.(10) } catch {}
}

export function hapticMedium() {
  try { navigator.vibrate?.(20) } catch {}
}

export function hapticHeavy() {
  try { navigator.vibrate?.(40) } catch {}
}

export function hapticSelection() {
  try { navigator.vibrate?.(15) } catch {}
}
