function get(target, p, receiver) {
  const result = Reflect.get(target, p, receiver)
    
  return result
}

function set(target, p, receiver) {

}


export function observe(obj) {
  return new Proxy(obj, {
    get,
    set,
  })
}

window.a = observe({
  a: 1,
})