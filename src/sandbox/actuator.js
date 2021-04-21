import { Scope } from './scope.js'
import { toBase64 } from '../utils.js'
import { createMapping, sourceMappingURL } from './sourcemap.js'

export class Actuator {
  constructor(context, template) {
    this.name = '__SCOPE__'
    this.runBridge = '__EXEC_BRIDGE__'
    this.context = context
    this.template = template
    this.filePath = toBase64(template)
    this.scopeManager = new Scope(this.context.state)
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
  executeCodeByModule() {

  }

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
      console.log(code);
      if (!position) return code
      const { line, column } = position.start
      const lines = code.split('\n')
      // let mappings = createMapping([])
      return code
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
    const code = 
      `with(${name}) {
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
      }`

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
