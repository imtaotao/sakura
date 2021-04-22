import { Scope } from './scope.js'
import { runEsmScript, AsyncFunction } from '../utils.js'
import { createMapping, sourceMappingURL } from './sourcemap.js'

let scriptCount = 0
const mapCache = {}

export class Actuator {
  constructor(name, context, template) {
    this.name = '__SCOPE__'
    this.bridge = '__EXEC_BRIDGE__'
    this.context = context
    this.template = template
    this.scopeManager = new Scope(this.context.state)
    this.file = {
      content: template,
      name: name || 'component',
    }
  }

  execScript(node) {
    const { children, position } = node
    const { file, context, scopeManager } = this
    const scope = scopeManager.scope
    const bridge = `${this.bridge}_${scriptCount++}`
    const args = scopeManager.currentIsBase()
      ? ''
      : Object.keys(scope)
          .filter((v) => v !== 'context')
          .reduce(
            (t, v) => `${t}let ${v} = window['${bridge}'].scope.${v};`,
            '',
          )
    let code =
      `let context = window['${bridge}'].context;${args}\n` +
      children[0].buf +
      `\nwindow['${bridge}'].resolve();delete window['${bridge}'];`

    if (position) {
      let sourcemapURL = mapCache[code]
      if (!sourcemapURL) {
        const lines = code.split('\n')
        const { line, column } = position.start
        const mappings = lines.reduce(
          (t) => `${t}${createMapping([0, 0, 1, 1])}`,
          createMapping([0, 0, line - 1, column + 7]),
        )
        sourcemapURL = sourceMappingURL(file, mappings)
        mapCache[code] = sourcemapURL
      }
      code += sourcemapURL
    }

    return new Promise((resolve) => {
      runEsmScript(code, bridge, {
        scope,
        context,
        resolve,
      })
    })
  }

  execExpression(node) {
    const { buf, position } = node
    const { name, file, context, scopeManager } = this
    const scope = scopeManager.scope
    const args = scopeManager.currentIsBase()
      ? ''
      : Object.keys(scope).join(',')
    const codeInfo = [
      `with(${name}){return(function(${args}){return(${buf})`,
      `\n})(${args})}`,
    ]
    if (position) {
      const chars = codeInfo[0]
      let sourcemapURL = mapCache[chars]
      if (!sourcemapURL) {
        const lines = chars.split('\n')
        const { line, column } = position.start
        const mappings = lines.reduce(
          (t) => `${t}${createMapping([0, 0, 1, 1])}`,
          createMapping([0, 0, line - 1, column - 1]),
        )
        sourcemapURL = sourceMappingURL(file, mappings)
        mapCache[chars] = sourcemapURL
      }
      codeInfo[0] = `${chars}${sourcemapURL}`
    }
    return new Function('context', name, codeInfo.join(''))(context, scope)
  }

  async execFor(node, cb) {
    const { name, file, context, scopeManager } = this
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
            await ${forCb}(i, l[i]);
          }
        } else {
          for (const k in l) {
            await ${forCb}(k, l[k]);
          }
        }
      }
    `

    if (position) {
      let sourcemapURL = mapCache[code]
      if (!sourcemapURL) {
        const lines = code.split('\n')
        const { line, column } = position.start
        const mappings = lines.reduce(
          (t) => `${t}${createMapping([0, 0, 0, 0])}`,
          createMapping([0, 0, line, column]),
        )
        sourcemapURL = sourceMappingURL(file, mappings)
        mapCache[code] = sourcemapURL
      }
      code = `${code}${sourcemapURL}`
    }

    scopeManager.create()
    await new AsyncFunction('context', name, forCb, code)(
      context,
      scopeManager.scope,
      (curKey, curVal) => {
        val && scopeManager.add(key, curKey)
        key && scopeManager.add(val, curVal)
        return cb(curKey, curVal)
      },
    )
    scopeManager.destroy()
  }
}
