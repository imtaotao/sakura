export class Scope {
  constructor(baseScope, namespace) {
    this.scope = Object.create(baseScope)
    this.scopeChain = [this.scope]
    this.namespace = namespace || ''
  }

  currentIsBase() {
    return this.scope === this.scopeChain[0]
  }

  add(key, val) {
    this.scope[key] = val
  }

  create(obj) {
    if (obj) {
      Object.setPrototypeOf(obj, this.scope)
      this.scopeChain.push(obj)
      return obj
    } else {
      this.scope = Object.create(this.scope)
      this.scopeChain.push(this.scope)
      return this.scope
    }
  }

  destroy() {
    const chain = this.scopeChain
    chain.pop()
    this.scope = chain[chain.length - 1]
    return this.scope
  }
}
