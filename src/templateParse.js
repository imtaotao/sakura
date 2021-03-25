function tokenizer(input) {
  let buf = ''
  let fs = false
  let inQuote = false
  let dbQuote = false

  const ts = []
  const push = () => {
    if (!buf) return
    ts[ts.length] = buf
    buf = ''
  }

  console.log(input)
  for (let i = 0, l = input.length; i < l; i++) {
    const char = input[i]

    if (char === '/') {

    } else if (char === '<') {
      fs = true
      buf += char
      push()
    } else if (char === '>') {
      fs = false
      push()
      buf += char
    } else if (char === '=') {
      push()
      buf += char
      push()
    } else if (char === '"') {
      if (inQuote) {
        if (dbQuote) {
          push()
          inQuote = false
          dbQuote = false
        } else {
          buf += char
        }
      } else {
        inQuote = true
        dbQuote = true
        push()
      }
    } else if (char === '\'') {
      if (inQuote && !dbQuote) {
        push()
        inQuote = false
      }
    } else if (char === ' ') {
      push()
      if (fs) continue
      buf += char
      push()
    } else {
      buf += char
    }
  }

  return ts
}

export function parse(input) {
  const ts = tokenizer(input.trim())
  console.log(ts);
}
