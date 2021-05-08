import { track, trigger, TrackTypes, TriggerTypes } from './deps.js'

function getter(target, p, receiver) {
  track(target, TrackTypes.GET, p)
  return Reflect.get(target, p, receiver)
}

function setter(target, p, value, receiver) {
  const oldValue = target[p]
  const result = Reflect.set(target, p, receiver)
  if (result === true) {
    trigger(target, TriggerTypes.SET, p, value, oldValue)
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
