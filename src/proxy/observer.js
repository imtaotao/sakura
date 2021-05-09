import { isObject } from '../utils'
import { track, trigger, TrackTypes, TriggerTypes } from './deps.js'

function getter(target, p, receiver) {
  track(target, TrackTypes.GET, p)
  const result = Reflect.get(target, p, receiver)
  if (isObject(result)) {
    return observe(result)
  } else if (Array.isArray(result)) {

  }
  return result
}

function setter(target, p, value, receiver) {
  const oldValue = target[p]
  const result = Reflect.set(target, p, value, receiver)
  if (result === true) {
    // prettier-ignore
    const type = target.hasOwnProperty(p)
      ? TriggerTypes.SET
      : TriggerTypes.ADD
    trigger(target, type, p, value, oldValue)
  }
  return result
}

export function observe(obj) {
  return new Proxy(obj, {
    get: getter,
    set: setter,
  })
}

window.a = observe({
  a: 1,
})
