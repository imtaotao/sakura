import { Scope } from './scope.js'
import { toBase64 } from '../utils.js'
import { sourceMappingURL } from './sourcemap.js'

export class Actuator {
  constructor(context, template) {
    this.name = '__SCOPE__'
    this.context = context
    this.template = template
    this.filePath = toBase64(template)
    this.scopeManager = new Scope(this.context.state)
  }

  sourcemap(code, position) {
    if (!position) return code
    return `${code}${sourceMappingURL(code, this.template, position)}`
  }

  createExecutor(code, position) {
    const { name, context, scopeManager } = this
    const scope = scopeManager.scope
    const args = scopeManager.currentIsBase()
      ? ''
      : Object.keys(scope).join(',')
    const execCode = this.sourcemap(
      `with(${name}){return(function(${args}){${code}})(${args})}`,
      position,
    )
    return new Function('ctx', name, execCode)(context, scope)
  }

  // 第一行需要用新增的脚本 - <script>
  // 后面的行数不变
  execScript(node) {
    const { children, position } = node
    const p = {
      line: position.start.line - 2,
      column: position.start.column, // '<script>.length'
    }
    return this.createExecutor(children[0].buf, p)
  }

  execCommon(node) {
    const { buf, position } = node
    return this.createExecutor(`return(${buf})`, {
      line: position.start.line - 2,
      column: position.start.column,
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
    const code = this.sourcemap(
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
      }`,
      {
        line: position.start.line - 3,
        column: position.start.column - 3,
      },
    )

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
