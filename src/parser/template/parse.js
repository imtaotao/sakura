import { tokenizer } from './tokenizer.js'

const voidTags =(
  '!doctype,area,base,br,col,' +
  'command,embed,hr,img,input,meta,' +
  'keygen,link,param,source,track,wbr'
).split(',')
const isSingleTag = t => voidTags.indexOf(t) > -1

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

// pos: boolean
// parent: boolean
export function parse(input, opts = { pos: true }) {
  let node = new Node('', null)
  if (!opts.parent) delete node.parent
  const ts = tokenizer(input, opts.pos)
  const posMsg = (t) => opts.pos ? `[${t.line},${t.column}]: ` : ''
  const back = () => {
    const p = node.parent
    if (!opts.parent) delete node.parent
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
        t = ts[i + 1]
        // <>a</>
        let tagName = ''
        if (t.buf !== '>') {
          i++
          tagName = t.buf
        }
        const newNode = new Node(tagName, node)
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
        const buf = ts[i].buf
        const endTag = buf === '>' ? '' : buf.toLowerCase()
        if (endTag !== node.tagName) {
          throw SyntaxError(
            `${posMsg(t)}The closing tag of "${node.tagName}" is wrong "${endTag}"`
          )
        }
        // <></> 不是单标签，这种情况 i++ 也是可以的
        i++
        back()
      } else if (t.buf === '/>') {
        i++
        back()
      }
    } else if (t.buf === '>') {
      if (isSingleTag(node.tagName)) {
        back()
      }
    }
  }
  return node
}