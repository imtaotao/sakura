这是 vue4 的模板解析器

```js
const ast = parse(`
  <div>
    <>text</>
    <br>
    <div id='a'/>
    <!-- comment -->
    <li v-for="v in data">
      {{ alert(1) }}
    </li>
  </div>
`)
```