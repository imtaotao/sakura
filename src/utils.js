// https://developer.mozilla.org/en-US/docs/Web/SVG/Element
export const isSVG = makeMap(
  'svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,' +
    'defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,' +
    'feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,' +
    'feDistanceLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,' +
    'feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,' +
    'fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,' +
    'foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,' +
    'mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,' +
    'polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,' +
    'text,textPath,title,tspan,unknown,use,view',
)

export function makeMap(list) {
  list = list.split(',')
  const map = Object.create(null)
  for (let i = 0, l = list.length; i < l; i++) {
    map[list[i]] = true
  }
  return (val) => map[val]
}

export function toString(v) {
  return v && typeof v === 'object' ? JSON.stringify(v) : String(v)
}

export const AsyncFunction = Object.getPrototypeOf(async function () {})
  .constructor

export function runEsmScript(code, bridge, context) {
  const script = document.createElement('script')
  script.text = code
  script.type = 'module'
  script.style.display = 'none'
  window[bridge] = context
  document.body.append(script)
  document.body.removeChild(script)
}
