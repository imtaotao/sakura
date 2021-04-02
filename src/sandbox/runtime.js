const addTempScope = (scope, obj) => {
  Object.setPrototypeOf(obj, scope)
  return {
    scope: obj,
    recover: () => scope,
  }
}

// TODO: 后面根据 position 更改 sourcemap
export const execCommon = (node, context) => {
  const { buf, position } = node
  return new Function('ctx', `with(ctx.state){return(${buf})}`)(context)
}

export function execFor(node, context, cb) {
  const { buf, position } = node
  const forCb = '__forCallback__'
  const { list, args: { val, key = 'key' } } = buf
  const code = `with(ctx.state){
    const l = ${list};
    if (Array.isArray(l)) {
      for (let i = 0; i < l.length; i++) {
        ${key} = i;
        ${val} = l[i];
        ${forCb}(i, l[i])
      }
    } else {
      for (const k in l) {
        ${key} = k;
        ${val} = l[k];
        ${forCb}(k, l[k])
      }
    }
  }`
  const { scope, recover } = addTempScope(
    context.state,
    { [key]: undefined, [val]: undefined },
  )
  context.state = scope
  new Function('ctx', forCb, code)(context, cb)
  context.state = recover()
}

export function execScript(node, attributes, context) {
  const { children, position } = node
  const code = children[0].buf
  return new Function('ctx', code)(context)
}