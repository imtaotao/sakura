let activeEffect = null

export function watchEffect(effect) {
  activeEffect = effect()
}