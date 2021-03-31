export function exec(node, context) {
  const { children, position } = node
  const code = children[0].buf
  // TODO: 后面根据 position 更改 sourcemap
  new Function('ctx', code).call(context, context)
}