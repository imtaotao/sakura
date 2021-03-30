这是 vue4 的模板解析器

```js
const ast = parse(`
  <div>
    <>text</>
    <br>
    <div id='a'>
    <!-- comment -->
    {{ alert(1) }}
  </div>
`)
```