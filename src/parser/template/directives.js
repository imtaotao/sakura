// 顺序与指令的优先级有关
const directivesPriority = [
  'for',
  'if',
  'bind',
  'on',
  'show',
  'text',
  'transition',
]
const errorReg = /[\s,\(\)]/
const customIdx = directivesPriority.length
const parsingDirectives = Object.create(null)
directivesPriority.forEach((k, i) => (parsingDirectives[k] = { i }))

export function sortDirectives(ds) {
  return ds.sort((a, b) => {
    const aIdx = parsingDirectives[a.type] || { i: customIdx }
    const bIdx = parsingDirectives[b.type] || { i: customIdx }
    return aIdx.i - bIdx.i
  })
}

export const isCustomDirective = (t) => directivesPriority.indexOf(t) < 0

// 一般文件展示都是从第一行开始
export const posMsg = (pos) =>
  pos ? `[${pos.start.line + 1},${pos.start.column}]: ` : ''

// v-for=val in data
// v-for=(key, val) in data
export function parseFor(buf, pos) {
  let key = '',
    val = '',
    seg = 0,
    scope = 0
  const res = {}
  const symbol = ' in '
  const inIdx = buf.indexOf(symbol)
  const check = (s) => errorReg.test(s) && error()
  const error = () => {
    throw SyntaxError(`${posMsg(pos)}v-for="${buf}" syntax error.`)
  }

  if (inIdx < 0) error()
  res.list = buf.slice(inIdx + symbol.length).trim()

  for (let i = 0; i < inIdx; i++) {
    const c = buf[i]
    if (c === '(') {
      scope++
    } else if (c === ')') {
      scope--
    } else if (c === ',') {
      if (scope === 0) error()
      seg++
    } else {
      seg > 0 ? (val += c) : (key += c)
    }
  }

  // 小括号不对称或者逗号多于一个
  // `(key in data` or `(key, val,) in data`
  if (scope > 0 || seg > 1) error()
  key = key.trim()
  val = val.trim()
  if (!val) {
    val = key
    key = undefined
  }
  // 逗号大于一个却没有值 `(key, ) in data`
  if (seg === 1 && !val) error()
  res.args = { key, val }

  check(key)
  check(val)
  check(res.list)
  return res
}
