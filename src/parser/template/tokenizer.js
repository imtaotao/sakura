const childlessTags = ['style', 'script', 'template']

export function tokenizer(input, pos) {
  let buf = ''
  let line = pos ? 1 : null
  let column = line
  
  const ts = []
  const ctx = {
    fs: false, // 过滤空格
    lessTag: null,
    inText: true,
    inExpr: false,
    inQuote: false,
    dbQuote: false,
    closeTag: false,
    singleTag: false,
  }

  function token() {
    this.buf = buf
    this.line = line
    this.column = column
    this.expr = ctx.inExpr
    this.text = ctx.inText
    this.closeTag = ctx.closeTag
    this.singleTag = ctx.singleTag
  }

  const last = () => ts[ts.length - 1] || {}
  const lessTag = (t) => childlessTags.indexOf(t) > -1
  const updatePosition = (str) => {
    if (!pos) return
    if (str === ' ') { column++; return }
    for (let i = 0, l = str.length; i < l; i++) {
      const char = str.charAt(i)
      if (char === '\n' || char === '\t' || char === '\r') {
        line++
        column = 0
      } else {
        column++
      }
    }
  }

  const pop = () => {
    if (ts.length === 0) return
    ts.length--
    if (pos) {
      const t = last()
      if (!t.line) return
      line = t.line
      column = t.column
    }
  }

  const push = () => {
    if (!buf) return
    if (last().buf === '<') {
      if (lessTag(buf)) ctx.lessTag = buf
    }
    updatePosition(buf)
    ts[ts.length] = new token()
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
      ctx.fs = true
      ctx.inText = false
      buf += char
      const nextChar = input[i + 1]
      if (nextChar === '/') {
        ctx.closeTag = true
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
        ctx.singleTag = true
        buf += nextChar
        i++
        push()
        ctx.inText = true
      } else {
        buf += char
        push()
      }
      ctx.closeTag = false
      ctx.singleTag = false
    } else if (char === '>') {
      push()
      ctx.fs = false
      buf += char
      push()
      ctx.inText = true
      // 需要过滤的节点不可能是单标签
      if (ctx.lessTag) {
        const endOfIdx = input.indexOf('</' + ctx.lessTag, i)
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
          ctx.inQuote = false
          ctx.dbQuote = false
        } else {
          buf += char
        }
      } else {
        ctx.inQuote = true
        ctx.dbQuote = true
        push()
      }
    } else if (char === "'") {
      if (ctx.inQuote) {
        if (ctx.dbQuote) {
          buf += char
        } else {
          push()
          ctx.inQuote = false
        }
      } else {
        ctx.inQuote = true
        ctx.dbQuote = false
        push()
      }
    } else if (char === ' ') {
      push()
      if (ctx.fs) {
        updatePosition(char)
      } else {
        buf += char
        push()
      }
    } else if (char === '{') {
      const nextChar = input[i + 1]
      if (nextChar === '{') {
        push()
        ctx.inExpr = true
        const endOfExpr = input.indexOf('}}', i)
        if (endOfExpr > -1) {
          buf = input.slice(i + 2, endOfExpr)
          push()
          i = endOfExpr + 1
          ctx.inExpr = false
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
