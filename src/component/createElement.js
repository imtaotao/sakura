import { FragmentNode } from './fragment.js'
import { isSVG, toString } from '../utils.js'
import { execDirectives } from './directives.js'

const xChar = 120
const colonChar = 58
const ns = 'http://www.w3.org/2000/svg'
const xlinkNS = 'http://www.w3.org/1999/xlink'
const xmlNS = 'http://www.w3.org/XML/1998/namespace'

// 游标节点
function cursorElement(buf) {
  return document.createComment(buf)
}

function applyAttributes(dom, attributes) {
  if (attributes.length === 0) return
  for (const { key, buf } of attributes) {
    if (key.charCodeAt(0) !== xChar) {
      dom.setAttribute(key, buf)
    } else if (key.charCodeAt(3) === colonChar) {
      dom.setAttributeNS(xmlNS, key, buf)
    } else if (key.charCodeAt(5) === colonChar) {
      dom.setAttributeNS(xlinkNS, key, buf)
    } else {
      dom.setAttribute(key, buf)
    }
  }
}

function createEleByNode(node, actuator) {
  return execDirectives(node, actuator, (type, curNode) => {
    if (type === 1) {
      return cursorElement(curNode.tagName)
    } else if (type === 2) {
      let dom
      const { tagName, children, attributes } = curNode
      if (tagName === 'script') {
        actuator.execScript(curNode)
        dom = cursorElement('<script/>')
      } else {
        // prettier-ignore
        dom =
          tagName === ''
            ? new FragmentNode()
            : isSVG(tagName)
              ? document.createElementNS(ns, tagName)
              : document.createElement(tagName)
        applyAttributes(dom, attributes)
        children.forEach((child) => createElement(dom, child, actuator))
      }
      return dom
    } else if (type === 3) {
      return createEleByNode(curNode, actuator)
    }
  })
}

export function createElement(parent, node, actuator) {
  let dom
  const { buf, type } = node

  if (type === 'text') {
    dom = document.createTextNode(buf)
  } else if (type === 'comment') {
    dom = document.createComment(buf)
  } else if (type === 'expression') {
    const text = toString(actuator.execCommon(node))
    dom = document.createTextNode(text)
  } else if (type === 'node') {
    dom = createEleByNode(node, actuator)
  }
  if (parent) {
    dom.isFragment ? dom.appendChildInParent(parent) : parent.appendChild(dom)
  }
  return dom
}
