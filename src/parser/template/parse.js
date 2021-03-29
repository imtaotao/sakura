import { tokenizer } from './tokenizer.js'

function Text(buf) {
  this.buf = buf
  this.type = 'text'
}

function Comment(buf) {
  this.buf = buf
  this.type = 'comment'
}

function Expression(buf) {
  this.buf = buf
  this.type = 'expression'
}

function Node(buf, parent) {
  this.tagName = buf
  this.type = 'node'
  this.children = []
  this.attribute = []
  this.parent = parent
}

export function parse(input, pos = true) {
  let node = new Node('', parent)

  const ts = tokenizer(input, pos)
  for (let i = 0, l = ts.length; i < l; i++) {
    const t = ts[i]
    // console.log(t);
    if (t.expr) {
      node.children.push(new Expression(t.buf))
    } else if (t.text) {
      node.children.push(new Text(t.buf))
    } else if (t.buf === '<') {
      i++
      const tagToken = ts[i]
      node = new Node(tagToken.buf, node)
    } else if (t.buf = ' ') {

    }
  }
  return node
}