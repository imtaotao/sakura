import { activeEffect } from './effect.js'

const targetMap = new WeakMap()

export const TrackTypes = {
  GET: 'get',
  HAS: 'has',
  ITERATE: 'iterate',
}

export const TriggerTypes = {
  SET: 'set',
  ADD: 'add',
  CLEAR: 'clear',
  DELETE: 'delete',
}

export function track(target, type, p) {
  const effect = activeEffect.value
  if (effect === null) return
  let deps = targetMap.get(target)
  if (!deps) {
    deps = new Map()
    targetMap.set(target, deps)
  }
  if (!deps.has(effect)) {
    deps.add({
      p,
      type,
      target,
      effect,
    })
  }
}

export function trigger(target, type, p, value, oldValue) {
  console.log(arguments)
}
