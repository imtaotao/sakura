// 检查 position 的位置是否正确
export function testPosition(code, nodes) {
  const input = code.split('\n')
  const test = (node) => {
    const { buf, type, position, children, directives } = node
    children && children.forEach(test)
    directives && directives.forEach(test)
    if (!position) return

    let str = ''
    const { start, end } = position
    if (end.line === start.line) {
      str = input[start.line].slice(start.column, end.column)
    } else {
      for (let i = start.line; i < end.line + 1; i++) {
        if (i === start.line) {
          str += (input[i].slice(start.column) + '\n')
        } else if (i === end.line) {
          str += input[i].slice(0, end.column)
        } else {
          str += (input[i] + '\n')
        }
      }
    }

    const isSuccess = str === buf
    if (isSuccess) {
      console.log(isSuccess, type)
    } else {
      // 如果是 node，用肉眼看是否正确
      console.log(isSuccess, str)
    }
  }
  nodes.forEach(test)
}