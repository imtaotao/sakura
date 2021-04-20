import { Scope } from './scope.js'
import { toBase64 } from '../utils.js'

export class Actuator {
  constructor(context, template) {
    this.name = '__SCOPE__'
    this.context = context
    this.template = template
    this.filePath = toBase64(template)
    this.scopeManager = new Scope(this.context.state)
  }

  createExecutor(code, position) {
    const { name, context, scopeManager } = this
    const scope = scopeManager.scope
    const args = scopeManager.currentIsBase()
      ? ''
      : Object.keys(scope).join(',')
    const execCode = `with(${name}){return(function(${args}){${code}})(${args})}`
    return new Function('ctx', name, execCode)(context, scope)
  }

  execScript(node) {
    const { children, position } = node
    return this.createExecutor(children[0].buf, position)
  }

  execCommon(node) {
    const { buf, position } = node
    return this.createExecutor(`return(${buf})`, position)
  }

  execFor(node, cb) {
    const { name, context, scopeManager } = this
    const { buf, position } = node
    const forCb = '__vForCallback__'
    const {
      list,
      args: { val, key },
    } = buf
    const code = `with(${name}) {
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
