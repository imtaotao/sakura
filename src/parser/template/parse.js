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
  this.type = 'node'
  this.children = []
  this.attributes = []
  this.parent = parent
  this.tagName = buf.toLowerCase()
}

export function parse(input, pos = true, parent = true) {
  let node = new Node('', null)
  if (!parent) delete node.parent

  const ts = tokenizer(input, pos)
  const posMsg = (t) => pos ? `[${t.line},${t.column}]: ` : ''
  const back = n => {
    const p = n.parent
    if (!parent) delete n.parent
    node = p
  }

  for (let i = 0, l = ts.length; i < l; i++) {
    let t = ts[i]
    if (t.expr) {
      node.children.push(new Expression(t.buf))
    } else if (t.text) {
      node.children.push(new Text(t.buf))
    } else if (t.startTag) {
      if (t.buf === '<') {
        i++
        t = ts[i]
        const newNode = new Node(t.buf, node)
        node.children.push(newNode)
        node = newNode
      } else {
        // comment
        if (t.buf === '<!--') {
          i++
          t = ts[i]
          node.children.push(new Comment(t.buf))
          i++
        } else {
          // attributes
          let value = true
          const key = t.buf
          if (ts[i + 1].buf === '=') {
            i += 2
            value = ts[i].buf
          }
          node.attributes.push({ key, value })
        }
      }
    } else if(t.closeTag) {
      if (t.buf === '</') {
        i++
        const endTag = ts[i].buf.toLowerCase()
        if (endTag !== node.tagName) {
          throw SyntaxError(
            `${posMsg(t)}The closing tag of "${node.tagName}" is wrong "${endTag}"`
          )
        }
        i++
        back(node)
      } else if (t.buf === '/>') {
        i++
        back(node)
      }
    }
  }
  return node
}