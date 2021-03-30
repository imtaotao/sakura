import { tokenizer } from './tokenizer.js'

const dMap = {
  '@': 'on',
  ':': 'bind',
}
const voidTags =(
  '!doctype,area,base,br,col,' +
  'command,embed,hr,img,input,meta,' +
  'keygen,link,param,source,track,wbr'
).split(',')

const isSingleTag = t => voidTags.indexOf(t) > -1
const isDirective = k => {
  const char = k.charAt(0)
  if (char === '@' || char === ':') return true
  return char === 'v' // v-
    ? k.charAt(1) === '-'
    : false
}

function Text(buf, pos) {
  this.buf = buf
  this.type = 'text'
  if (pos) this.pos = pos
}

function Comment(buf, pos) {
  this.buf = buf
  this.type = 'comment'
  if (pos) this.pos = pos
}

function Expression(buf, pos) {
  this.buf = buf
  this.type = 'expression'
  if (pos) this.pos = pos
}

function Node(buf, parent, pos) {
  this.type = 'node'
  this.children = []
  this.attributes = []
  this.directives = []
  this.parent = parent
  this.tagName = buf.toLowerCase()
  if (pos) this.pos = pos
}

function Directive(key, value) {
  this.value = value
  const char = key.charAt(0)
  if (dMap[char]) {
    this.type = dMap[char]
    this.subValue = key.slice(1)
  } else {
    const delimiterIdx = key.indexOf(':', 2)
    if (delimiterIdx > -1) {
      this.type = key.slice(2, delimiterIdx)
      this.subValue = key.slice(delimiterIdx + 1)
    } else {
      this.type = key.slice(2)
      this.subValue = null
    }
  }
}

// pos: boolean
// parent: boolean
export function parse(input, opts = { pos: true }) {
  let node = new Node('', null)
  if (!opts.parent) delete node.parent
  const ts = tokenizer(input, opts.pos)
  const posMsg = (t) => opts.pos
    ? `[${t.pos.start.line},${t.pos.start.column}]: `
    : ''
  const back = (i) => {
    if (opts.pos) {
      node.pos.end = ts[i].pos.end
    }
    const p = node.parent
    if (!opts.parent) delete node.parent
    node = p
  }

  for (let i = 0, l = ts.length; i < l; i++) {
    let t = ts[i]
    let pos = opts.pos ? t.pos : null

    if (t.expr) {
      node.children.push(new Expression(t.buf, pos))
    } else if (t.text) {
      node.children.push(new Text(t.buf, pos))
    } else if (t.startTag) {
      if (t.buf === '<') {
        t = ts[i + 1]
        // <>a</>
        let tagName = ''
        if (t.buf !== '>') {
          i++
          tagName = t.buf
        }
        const newNode = new Node(tagName, node, pos)
        node.children.push(newNode)
        node = newNode
      } else {
        // comment
        if (t.buf === '<!--') {
          i++
          t = ts[i]
          const commentNode = new Comment(t.buf, t.pos)
          node.children.push(commentNode)
          i++
        } else {
          // attributes
          let value = true
          const key = t.buf
          if (ts[i + 1].buf === '=') {
            i += 2
            value = ts[i].buf
          }
          if (isDirective(key)) {
            node.directives.push(new Directive(key, value))
          } else {
            node.attributes.push({ key, value })
          }
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
        back(i)
      } else if (t.buf === '/>') {
        back(i)
        i++
      }
    } else if (t.buf === '>') {
      if (isSingleTag(node.tagName)) {
        back(i)
      }
    }
  }
  return node.children
}