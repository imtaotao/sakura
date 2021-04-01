const childlessTags = 'style,script,template'.split(',')
const lessTag = (t) => childlessTags.indexOf(t) > -1
const isNewline = c => c === '\n' || c === '\t' || c === '\r'

export function tokenizer(input, pos) {
  let buf = ''
  let line = pos ? 0 : null
  let column = line
  
  const ts = []
  const ctx = {
    lessTag: null,
    inText: true,
    inExpr: false,
    inQuote: false,
    dbQuote: false,
    startTag: false,
    closeTag: false,
    startLine: line,
    startColumn: column,
  }

  function token() {
    this.buf = buf
    // types
    this.expr = ctx.inExpr
    this.text = ctx.inText
    this.startTag = ctx.startTag
    this.closeTag = ctx.closeTag
    if (pos) {
      this.pos = {
        end: { line, column },
        start: {
          line: ctx.startLine,
          column: ctx.startColumn,
        },
      }
    }
  }

  const last = () => ts[ts.length - 1] || {}
  const updatePosition = (str) => {
    if (!pos) return
    for (let i = 0, l = str.length; i < l; i++) {
      const char = str.charAt(i)
      if (isNewline(char)) {
        line++
        column = 0
      } else {
        column++
      }
    }
  }
  
  const advancePos = (buf) => {
    if (!pos) return
    updatePosition(buf)
    ctx.startLine = line
    ctx.startColumn = column
  }

  const pop = () => {
    if (ts.length === 0) return
    ts.length--
    if (pos) {
      const t = last()
      if (t.pos.end.line === null) return
      line = t.pos.end.line
      column = t.pos.end.column
    }
  }

  const push = () => {
    if (!buf) return
    if (last().buf === '<') {
      if (lessTag(buf)) ctx.lessTag = buf
    }
    updatePosition(buf)
    ts[ts.length] = new token()
    if (pos) {
      ctx.startLine = line
      ctx.startColumn = column
    }
    buf = ''
  }

  // 直接增量添加
  const add = (char) => {
    if (ctx.inQuote) {
      if (char === "'" || char === '"') return false
      buf += char
      return true
    } else if (ctx.inText) {
      if (char === '<' || char === '{') return false
      buf += char
      return true
    }
    return false
  }

  for (let i = 0, l = input.length; i < l; i++) {
    const char = input.charAt(i)
    if (add(char)) continue

    if (char === '<') {
      push()
      ctx.inText = false
      ctx.startTag = true
      buf += char
      const nextChar = input[i + 1]
      if (nextChar === '/') {
        ctx.closeTag = true
        ctx.startTag = false
        buf += nextChar
        i++
      }
      push()
      ctx.closeTag = false
    } else if (char === '/') {
      const nextChar = input[i + 1]
      if (nextChar === '>') {
        push()
        buf += char
        ctx.closeTag = true
        ctx.startTag = false
        buf += nextChar
        i++
        push()
        ctx.inText = true
      } else {
        buf += char
      }
    } else if (char === '>') {
      push()
      ctx.startTag = false
      buf += char
      push()
      ctx.inText = true
      // 需要过滤的节点不可能是单标签
      if (ctx.lessTag) {
        const endOfIdx = input.indexOf(`</${ctx.lessTag}`, i)
        if (endOfIdx > -1) {
          buf = input.slice(i + 1, endOfIdx)
          i = endOfIdx - 1
          ctx.lessTag = null
          push()
        }
      }
    } else if (char === '=') {
      push()
      buf += char
      push()
    } else if (char === '"') {
      if (ctx.inQuote) {
        if (ctx.dbQuote) {
          push()
          advancePos(char)
          ctx.inQuote = false
          ctx.dbQuote = false
        } else {
          buf += char
        }
      } else {
        ctx.inQuote = true
        ctx.dbQuote = true
        push()
        advancePos(char)
      }
    } else if (char === "'") {
      if (ctx.inQuote) {
        if (ctx.dbQuote) {
          buf += char
        } else {
          push()
          advancePos(char)
          ctx.inQuote = false
        }
      } else {
        ctx.inQuote = true
        ctx.dbQuote = false
        push()
        advancePos(char)
      }
    } else if (char === ' ' || isNewline(char)) {
      push()
      // 在引号或者在文本中的空格换行已经增量添加，这里不需要 buf += char
      if (ctx.startTag) {
        advancePos(char)
      }
    } else if (char === '{') {
      const nextChar = input[i + 1]
      if (nextChar === '{') {
        push()
        advancePos('{{')
        ctx.inExpr = true
        const endChar = '}}'
        const endOfExpr = input.indexOf(endChar, i)
        if (endOfExpr > -1) {
          buf = input.slice(i + 2, endOfExpr)
          push()
          i = endOfExpr + 1
          ctx.inExpr = false
          advancePos(endChar)
        }
      } else {
        buf += char
      }
    } else {
      buf += char
    }

    // 处理注释
    if (last().buf === '<' && buf === '!--') {
      pop()
      buf = '<!--'
      push()
      const endOfIdx = input.indexOf('-->', i)
      if (endOfIdx > -1) {
        buf = input.slice(i + 1, endOfIdx)
        i = endOfIdx - 1
        push()
        buf = '-->'
        i += 3
        push()
      }
    }
  }
  push()
  return ts
}
