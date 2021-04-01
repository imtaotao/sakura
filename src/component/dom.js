import { isSVG }  from '../utils.js'
import { FragmentNode } from './fragment.js'
import { execDirectives } from './directives.js'
import { execExpr, execScript } from '../sandbox/runtime.js'

const xChar = 120
const colonChar = 58
const ns = 'http://www.w3.org/2000/svg';
const xlinkNS = 'http://www.w3.org/1999/xlink'
const xmlNS = 'http://www.w3.org/XML/1998/namespace'

function applyAttributes(dom, attributes) {
  console.log(attributes);
  if (attributes.length === 0) return;
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

function createEleByNode(node, context) {
  let dom
  const { tagName, children, attributes, directives } = node
  if (tagName === 'script') {
    execScript(node, attributes, context)
    dom = document.createComment('<script/>')
  } else {
    dom = tagName === ''
      ? new FragmentNode()
      : isSVG(tagName)
        ? document.createElementNS(ns, tagName)
        : document.createElement(tagName)
    applyAttributes(dom, attributes)
    children.forEach(child => createElement(dom, child, context))
  }
  return dom
}

export function createElement(parent, node, context) {
  let dom
  const { buf, type} = node

  if (type === 'text') {
    dom = document.createTextNode(buf)
  } else if (type === 'comment') {
    dom = document.createComment(buf)
  } else if (type === 'expression') {
    const text = String(execExpr(node, context))
    dom = document.createTextNode(text)
  } else if (type === 'node') {
    dom = createEleByNode(node, context)
  }
  if (parent) {
    dom.isFragment
      ? dom.appendChildInParent(parent)
      : parent.appendChild(dom)
  }
  return dom
}