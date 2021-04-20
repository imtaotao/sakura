import { toBase64 } from '../utils.js'

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

function base64Encode(number) {
  if (0 <= number && number < intToCharMap.length) {
    return intToCharMap[number]
  }
  throw new TypeError('Must be between 0 and 63: ' + number)
}

// encode to VLQ
function encoded(aValue) {
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

function genMappings(source, position) {
  const { line, column } = position
  const lines = source.split('\n') // 转换后的源码行数
  const code = (l, c) => encoded(0) + encoded(0) + encoded(l) + encoded(c)
  return code(line, column) + ';' + lines.map((v) => code(1, 1)).join(';')
}

export function sourceMappingURL(file, mappings) {
  const content = JSON.stringify({
    version: 3,
    mappings,
    sources: [file.name],
    sourcesContent: [file.content],
  })
  return `\n//@ sourceMappingURL=${toBase64(content)}`
}
