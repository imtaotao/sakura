// https://github.com/mozilla/source-map/blob/master/lib/base64-vlq.js
// http://www.ruanyifeng.com/blog/2013/01/javascript_source_map.html
const VLQ_BASE_SHIFT = 5
const VLQ_BASE = 1 << VLQ_BASE_SHIFT
const VLQ_BASE_MASK = VLQ_BASE - 1
const VLQ_CONTINUATION_BIT = VLQ_BASE
const intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split(
  '',
)

function toVLQSigned(aValue) {
  return aValue < 0 ? (-aValue << 1) + 1 : (aValue << 1) + 0
}

function toBase64(v) {
  return `data:application/json;base64,${btoa(unescape(encodeURIComponent(v)))}`
}

function base64Encode(number) {
  if (0 <= number && number < intToCharMap.length) {
    return intToCharMap[number]
  }
  throw new TypeError('Must be between 0 and 63: ' + number)
}

// encode to VLQ
export function encoded(aValue) {
  let encoded = ''
  let digit
  let vlq = toVLQSigned(aValue)
  do {
    digit = vlq & VLQ_BASE_MASK
    vlq >>>= VLQ_BASE_SHIFT
    if (vlq > 0) {
      digit |= VLQ_CONTINUATION_BIT
    }
    encoded += base64Encode(digit)
  } while (vlq > 0)
  return encoded
}

// 1. 表示这个位置在（转换后的代码的）的第几列
// 2. 表示这个位置属于 sources 属性中的哪一个文件
// 3. 表示这个位置属于转换前代码的第几行
// 4. 表示这个位置属于转换前代码的第几列
export function createMapping(cs) {
  return cs.reduce((t, v) => t + encoded(v), '') + ';'
}

export function sourceMappingURL(file, mappings) {
  const content = JSON.stringify({
    version: 3,
    mappings,
    sources: ['a.js'],
    sourcesContent: [file.content],
  })
  return `\n//# sourceMappingURL=${toBase64(content)}`
}
