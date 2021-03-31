import { exec } from '../sandbox/runtime.js'

function applyAttributes(dom, attributes) {

}

function renderNode(node, context) {
  const { tagName, children, attributes, directives } = node
  if (tagName === 'script') {
    if (directives.length > 0) {
      console.warn('Invalid directive in script tag.')
    }
    exec(node, context)
    return document.createComment('<script/>')
  } else {
    const dom = tagName === ''
      ? document.createElement('fragment') // TODO: 后面再改
      : document.createElement(tagName)
    children.forEach(child => createElement(dom, child, context))
    return dom
  }
}

export function createElement(parent, node, context) {
  let dom
  const { buf, type} = node

  if (type === 'text') {
    dom = document.createTextNode(buf)
  } else if (type === 'comment') {
    dom = document.createComment(buf)
  } else if (type === 'expression') {
    // TODO: 后面再改
    dom = document.createComment(`{{ ${buf} }}`)
  } else if (type === 'node') {
    dom = renderNode(node, context)
  }
  if (parent) {
    parent.appendChild(dom)
  }
  return dom
}