const errorReg = /[\s,\(\)]/

export const posMsg = (pos) => pos
  ? `[${pos.start.line},${pos.start.column}]: `
  : ''

// v-for=val in data
// v-for=(key, val) in data
export function parseFor(buf, pos) {
  let key = '', val = '', seg = 0, scope = 0
  const res = {}
  const symbol = ' in '
  const inIdx = buf.indexOf(symbol)
  const check = s => errorReg.test(s) && warn()
  const warn = () => {
    throw SyntaxError(`${posMsg(pos)}v-for="${buf}" syntax error.`)
  }

  if (inIdx < 0) warn()
  res.list = buf.slice(inIdx + symbol.length).trim()

  for (let i = 0; i < inIdx; i++) {
    const c = buf[i]
    if (c === '(') {
      scope++
    } else if (c === ')') {
      scope--
    } else if (c === ',') {
      seg++
    } else {
      seg > 0 ? val += c : key += c 
    }
  }

  // 小括号不对称或者逗号多于一个
  // `(key in data` or `(key, val,) in data`
  if (scope > 0 || seg > 1) warn()
  key = key.trim()
  val = val.trim()
  if (!val) {
    val = key
    key = null
  }
  // 逗号大于一个却没有值 `(key, ) in data`
  if (seg === 1 && !val) warn()
  res.args = { key, val }

  check(key)
  check(val)
  check(res.list)
  return res
}