// fragment 抽象层
export class FragmentNode {
  constructor() {
    this.children = []
    this.parent = null
    this.isFragment = true
    this.tagName = 'fragment'
  }

  get first() {
    return this.nodes[0]
  }

  get last() {
    const nodes = this.nodes
    return nodes[nodes.length - 1]
  }

  get nextSibling() {
    const last = this.last
    return last ? last.nextSibling() : null
  }

  get nodes() {
    const ls = []
    for (let i = 0, l = this.children.length; i < l; i++) {
      const node = this.children[i]
      node.isFragment ? ls.push.apply(ls, node.nodes) : ls.push(node)
    }
    return ls
  }

  realParent() {
    return this.parent.isFragment ? this.parent.realParent() : this.parent
  }

  appendChild(child) {
    if (child) {
      if (child.isFragment) {
        child.parent = this
      }
      this.children.push(child)
    }
    if (this.parent) {
      child.isFragment
        ? child.appendChildInParent(this.parent)
        : this.realParent().appendChild(child)
    }
  }

  removeChild(child) {
    const index = this.children.indexOf(child)
    if (index > -1) {
      this.children.splice(index, 1)
    }
    if (this.parent) {
      child.isFragment
        ? child.removeChildInParent(this.parent)
        : this.realParent().removeChild(child)
    }
  }

  insertBefore(node, ref) {
    const idx = this.children.indexOf(ref)
    if (idx > -1) {
      this.children.splice(idx, 0, node)
    } else {
      this.children.push(node)
    }
    if (this.parent) {
      if (node.isFragment) {
        node.insertBeforeChildInParent(this.parent, ref)
      } else {
        if (ref && ref.isFragment) {
          ref = ref.first
        }
        this.realParent().insertBefore(node, ref)
      }
    }
  }

  appendChildInParent(parent) {
    this.parent = parent
    if (parent.isFragment) {
      parent.appendChild(this)
    } else {
      const nodes = this.nodes
      for (let i = 0, l = nodes.length; i < l; i++) {
        parent.appendChild(nodes[i])
      }
    }
  }

  removeChildInParent(parent) {
    const nodes = this.nodes
    for (let i = 0, l = nodes.length; i < l; i++) {
      parent.removeChild(nodes[i])
    }
    this.parent = null
  }

  insertBeforeChildInParent(parent, ref) {
    this.parent = parent
    if (parent.isFragment) {
      parent.insertBefore(this, ref)
    } else {
      if (ref && ref.isFragment) {
        ref = ref.first
      }
      const nodes = this.nodes
      for (let i = 0, l = nodes.length; i < l; i++) {
        parent.insertBefore(nodes[i], ref)
      }
    }
  }

  dispatchEvent(event, isBubbles) {
    if (isBubbles) {
      this.realParent().dispatchEvent(event)
    } else {
      const nodes = this.nodes
      for (let i = 0, l = nodes.length; i < l; i++) {
        nodes[i].dispatchEvent(event)
      }
    }
  }
}
