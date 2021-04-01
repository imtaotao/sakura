export function execScript(node, attributes, context) {
  const { children, position } = node
  const code = children[0].buf
  // TODO: 后面根据 position 更改 sourcemap
  return new Function('ctx', code).call(context, context)
}

export function execExpr(node, context) {
  const { buf, position } = node
  // TODO: 后面根据 position 更改 sourcemap
  return new Function('ctx', `with(ctx.state){return (${buf})}`).call(context, context)
}