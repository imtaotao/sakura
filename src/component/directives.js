import { FragmentNode } from './fragment.js'
import { Node, Text } from '../parser/template/parser.js'
import { execIf, execFor, execText } from '../sandbox/runtime.js'

function cloneNode(node) {
  const cloned = new Node(
    node.tagName,
    node.parent,
    node.position,
  )
  cloned.children = node.children
  cloned.attributes = node.attributes
  // 过滤自身指令，否则会导致死循环
  cloned.directives = node.directives.filter(d => d.type !== 'for')
  return cloned
}

export function execDirectives(node, context, createEle) {
  let dom, needBreak
  const customDirectives = []
  const { position, directives} = node

  if (directives.length === 0) {
    return createEle(2, node)
  }
  for (let i = 0, l = directives.length; i < l; i++) {
    const cur = directives[i]
    const { buf, type, isCustom } = cur

    if (isCustom) {
      customDirectives.push(cur)
      continue
    } else if (needBreak) {
      continue
    } else {
      if (type === 'for') {
        dom = new FragmentNode()
        const recover = execFor(cur, context, () => {
          dom.appendChild(createEle(3, cloneNode(node))) // 递归 v-for
        })
        recover()
        break
      } else if (type === 'if') {
        if (Boolean(execIf(cur, context)) === false) {
          dom = createEle(1, node)
          needBreak = true
        }
      } else if (type === 'bind') {

      } else if (type === 'on') {

      } else if (type === 'show') {

      } else if (type === 'text') {
        node.children = [new Text(execText(cur, context), position)] 
      } else if (type === 'transition') {

      }
    }
  }
  if (!dom) dom = createEle(2, node)
  // TODO: 自定义指令
  // customDirectives.forEach(({ buf, type }) => {
  //   console.log('customDirective', type, buf);
  // })
  return dom
}