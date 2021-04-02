import { tokenizer } from './tokenizer.js'
import { posMsg, parseFor, isCustomDirective, sortDirectives } from './directives.js'

// 暂时只做只有一个字符的别名
const alias = {
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
  if (alias[char]) return true
  return char === 'v' // v-
    ? k.charAt(1) === '-'
    : false
}

export function Text(buf, pos) {
  this.buf = buf
  this.type = 'text'
  if (pos) this.position = pos
}

export function Comment(buf, pos) {
  this.buf = buf
  this.type = 'comment'
  if (pos) this.position = pos
}

export function Expression(buf, pos) {
  this.buf = buf
  this.type = 'expression'
  if (pos) this.position = pos
}

export function Node(buf, parent, pos) {
  this.type = 'node'
  this.children = []
  this.attributes = []
  this.directives = []
  this.parent = parent
  this.tagName = buf.toLowerCase()
  if (pos) this.position = pos
}

export function Directive(key, buf, pos) {
  this.buf = buf
  const char = key.charAt(0)
  if (alias[char]) {
    this.type = alias[char]
    this.typeBuf = key.slice(1)
  } else {
    const delimiterIdx = key.indexOf(':', 2)
    if (delimiterIdx > -1) {
      this.type = key.slice(2, delimiterIdx)
      this.typeBuf = key.slice(delimiterIdx + 1)
    } else {
      this.type = key.slice(2)
      this.typeBuf = null
    }
  }
  if (this.type === 'for') {
    this.buf = parseFor(this.buf, pos)
  }
  this.isCustom = isCustomDirective(this.type)
  // position 只是表达式的位置，方便在 js 中执行时使用 sourcemap
  if (pos) this.position = pos
}

export function parse(input, opts = { pos: true }) {
  let node = new Node('', null, null)
  if (!opts.parent) delete node.parent
  const ts = tokenizer(input, opts.pos)
  const back = (i) => {
    const p = node.parent
    if (!opts.parent) delete node.parent
    if (node.position) {
      node.position.end = ts[i].pos.end
    }
    node.directives = sortDirectives(node.directives)
    node = p
  }

  for (let i = 0, l = ts.length; i < l; i++) {
    let t = ts[i]
    const pos = t.pos

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
          let buf = true
          const key = t.buf
          if (ts[i + 1].buf === '=') {
            i += 2
            t = ts[i]
            buf = t.buf
          }
          if (isDirective(key)) {
            if (buf === true) buf = ''
            node.directives.push(new Directive(key, buf, t.pos))
          } else {
            node.attributes.push({ key, buf })
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
            `${posMsg(t.pos)}Invalid end tag.`
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
  console.log(node.children);
  return node.children
}