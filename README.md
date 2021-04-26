# 全新的组件模式
组件其实是一种集合的概念，一层可复用的抽象层。这一层的粒度，内部的逻辑的耦合程度在不同的场景下都是不一样的。

vue 前期，小项目中的开发还是很爽的，原因在于响应式与好用的语法糖，但是在项目增大，状态变多的时候，是比较难管理的，开发维护起来也很痛苦，但是如果切换成 react 来开发，配套的工具链，配套的工程化的东西，也是一个不小的负担。

我希望做成什么样子？
1. 继承 vue 的 template 语法
2. 更耦合，内聚的组件模式
3. 原生，运行时的语法糖支持

这个项目中，重要的是快速开发中小型项目，尤其是小项目。重点在开发体验上，性能等方面的考虑是排在后面的。我希望能够极速的启动，在原生的 html 上扩展一些 vue 的模板语法糖。用数据驱动视图开发。


```html
<!-- 默认支持 esm -->
<script>
  import { add } from '/template/test.js'
  context.state.tao = 1
  context.state.data = [
    { name: 'ct' },
    { age: add(10, 12) },
  ]
  context.state.pid = 121
  context.click = function(k, val) {
    console.log(k, val, context.state);
  }
</script>

<div>
  <div v-for="(k, val) in data">
    <span @click="() => context.click(k, val)">
      {{ k }}
      <script>
        console.log(k, val, 'script');
      </script>
    </span>
  </div>
</div>
```