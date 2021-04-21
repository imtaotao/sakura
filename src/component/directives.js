import { FragmentNode } from './fragment.js'
import { Node, Text, Attribute } from '../parser/template/parser.js'

const cloneAttribute = (attr) => {
  return new Attribute(attr.key, attr.buf)
}

const cloneNode = (node, filterFor) => {
  const cloned = new Node(node.tagName, node.parent, node.position)
  cloned.children = node.children.map((v) => v)
  cloned.attributes = node.attributes.map((v) => cloneAttribute(v))
  cloned.directives = !filterFor
    ? node.directives.map((v) => v)
    : node.directives.filter((d) => d.type !== 'for')
  return cloned
}

const concatDisplayStyle = (attributes, isShow) => {
  let style = attributes.find((v) => v.key === 'style')
  const val = isShow ? 'block' : 'none'

  if (!style) {
    style = new Attribute('style', `display:${val}`)
    attributes.push(style)
  } else {
    const sheets = style.buf.split(';').map((v) => v.split(':'))
    const display = sheets.find((v) => /display/i.test(v[0]))
    display ? (display[1] = val) : sheets.push(['display', val])
    style.buf = sheets.map((v) => v.join(':')).join(';')
  }
}

export function execDirectives(node, actuator, createEle) {
  node = cloneNode(node)
  let dom, needBreak
  const eventCbs = []
  const customDirectives = []
  const { position, directives, attributes } = node

  for (let i = 0, l = directives.length; i < l; i++) {
    const cur = directives[i]
    const { type, typeBuf, isCustom } = cur

    if (isCustom) {
      customDirectives.push(cur)
      continue
    } else if (needBreak) {
      continue
    } else {
      if (type === 'for') {
        dom = new FragmentNode()
        actuator.execFor(cur, () => {
          // 递归 v-for
          dom.appendChild(createEle(3, cloneNode(node, true)))
        })
        break
      } else {
        let val = actuator.execExpression(cur)
        if (type === 'if') {
          const canRender = Boolean(val) === true
          if (!canRender) {
            dom = createEle(1, node)
            needBreak = true
          }
        } else if (type === 'bind') {
          val = String(val)
          const attr = attributes.find((v) => v.key === typeBuf)
          attr ? (attr.buf = val) : attributes.push(new Attribute(typeBuf, val))
        } else if (type === 'on') {
          eventCbs.push((dom) => (dom[`on${typeBuf}`] = val))
        } else if (type === 'show') {
          const canShow = Boolean(val) === true
          concatDisplayStyle(attributes, canShow)
        } else if (type === 'text') {
          node.children = [new Text(val, position)]
        } else if (type === 'transition') {
          console.error('Temporarily does not support the "transition" command')
        }
      }
    }
  }
  if (!dom) {
    dom = createEle(2, node)
  }
  eventCbs.forEach((fn) => fn(dom))
  // TODO: 自定义指令
  // customDirectives.forEach(({ buf, type }) => {
  //   console.log('customDirective', type, buf);
  // })
  return dom
}
