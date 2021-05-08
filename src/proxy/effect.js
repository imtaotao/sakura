export const activeEffect = {
  value: null
}

export function watchEffect(effect) {
  activeEffect.value = effect()
}
