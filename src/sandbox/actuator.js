import { Scope } from './scope.js'
import { createMapping, sourceMappingURL } from './sourcemap.js'

export class Actuator {
  constructor(name, context, template) {
    this.name = '__SCOPE__'
    this.runBridge = '__EXEC_BRIDGE__'
    this.context = context
    this.template = template
    this.scopeManager = new Scope(this.context.state)
    this.file = {
      content: template,
      name: name || 'component',
    }
  }

  runScript(code, args, isModule) {
    const node = document.createElement('script')
    node.text = code
    node.style.display = 'none'
    window[this.runBridge] = args
    document.body.append(node)
    document.body.removeChild(node)
    delete window[this.runBridge]
  }

  executeCode(code, cb) {
    const { name, context, scopeManager } = this
    const scope = scopeManager.scope
    const args = scopeManager.currentIsBase()
      ? ''
      : Object.keys(scope).join(',')
    const execCode = cb(
      `with(${name}){return(function(${args}){${code}})(${args})}`,
    )
    return new Function('ctx', name, execCode)(context, scope)
  }

  // 通过 esm
  executeCodeByModule() {}

  // 第一行需要用新增的脚本 - <script>
  // 后面的行数不变
  execScript(node) {
    const { children, position } = node
    return this.executeCode(children[0].buf, (code) => {
      const { line, column } = position.start
      return code
    })
  }

  execExpression(node) {
    const { buf, position } = node
    return this.executeCode(`return(${buf})`, (code) => {
      if (!position) return code
      const lines = code.split('\n')
      const { line, column } = position.start
      const mappings = lines.reduce(
        (t) => `${t}${createMapping([0, 0, 1, 1])}`,
        createMapping([0, 0, line - 1, column - 1]),
      )
      return `${code}${sourceMappingURL(this.file, mappings)}`
    })
  }

  execFor(node, cb) {
    const { name, context, scopeManager } = this
    const { buf, position } = node
    const forCb = '__vForCallback__'
    const {
      list,
      args: { val, key },
    } = buf
    let code = `
      with(${name}) {
        const l = ${list};
        if (!l) return;
        if (Array.isArray(l)) {
          for (let i = 0; i < l.length; i++) {
            ${forCb}(i, l[i]);
          }
        } else {
          for (const k in l) {
            ${forCb}(k, l[k]);
          }
        }
      }
    `

    if (position) {
      const lines = code.split('\n')
      const { line, column } = position.start
      const mappings = lines.reduce(
        (t) => `${t}${createMapping([0, 0, 0, 0])}`,
        createMapping([0, 0, line, column]),
      )
      code = `${code}${sourceMappingURL(this.file, mappings)}`
    }

    scopeManager.create()
    new Function('ctx', name, forCb, code)(
      context,
      scopeManager.scope,
      (curKey, curVal) => {
        val && scopeManager.add(key, curKey)
        key && scopeManager.add(val, curVal)
        cb(curKey, curVal)
      },
    )
    scopeManager.destroy()
  }
}
