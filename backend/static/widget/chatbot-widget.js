var Fo=Object.defineProperty;var Ho=(ae,V,le)=>V in ae?Fo(ae,V,{enumerable:!0,configurable:!0,writable:!0,value:le}):ae[V]=le;var Q=(ae,V,le)=>Ho(ae,typeof V!="symbol"?V+"":V,le);(function(){"use strict";const ae={botName:"Assistant",primaryColor:"#1a56db",position:"bottom-right",role:"guest",suggestionChips:["What can I do here?"]};function V(){const n=window.ChatbotConfig;return!n||!n.apiKey?null:{...ae,...n,baseUrl:n.baseUrl||""}}const le="dlc_session_id";function fn(){let n=sessionStorage.getItem(le);return n||(n=crypto.randomUUID(),sessionStorage.setItem(le,n)),n}async function ht(n,t,r,i=1){const s=`${t.replace(/\/+$/,"")}/api/v1/chat/message/`;try{const c=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${n}`},body:JSON.stringify(r)});if(!c.ok){const d=await c.json().catch(()=>({error:"Request failed"}));throw new Error(d.error||`HTTP ${c.status}`)}return await c.json()}catch(c){if(i>0)return ht(n,t,r,i-1);throw c}}/*! @license DOMPurify 3.4.11 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.11/LICENSE */function gt(n,t){(t==null||t>n.length)&&(t=n.length);for(var r=0,i=Array(t);r<t;r++)i[r]=n[r];return i}function pn(n){if(Array.isArray(n))return n}function mn(n,t){var r=n==null?null:typeof Symbol<"u"&&n[Symbol.iterator]||n["@@iterator"];if(r!=null){var i,s,c,d,m=[],f=!0,S=!1;try{if(c=(r=r.call(n)).next,t!==0)for(;!(f=(i=c.call(r)).done)&&(m.push(i.value),m.length!==t);f=!0);}catch(B){S=!0,s=B}finally{try{if(!f&&r.return!=null&&(d=r.return(),Object(d)!==d))return}finally{if(S)throw s}}return m}}function hn(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function gn(n,t){return pn(n)||mn(n,t)||bn(n,t)||hn()}function bn(n,t){if(n){if(typeof n=="string")return gt(n,t);var r={}.toString.call(n).slice(8,-1);return r==="Object"&&n.constructor&&(r=n.constructor.name),r==="Map"||r==="Set"?Array.from(n):r==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?gt(n,t):void 0}}const bt=Object.entries,yt=Object.setPrototypeOf,yn=Object.isFrozen,Tn=Object.getPrototypeOf,En=Object.getOwnPropertyDescriptor;let k=Object.freeze,L=Object.seal,pe=Object.create,Tt=typeof Reflect<"u"&&Reflect,$e=Tt.apply,We=Tt.construct;k||(k=function(t){return t}),L||(L=function(t){return t}),$e||($e=function(t,r){for(var i=arguments.length,s=new Array(i>2?i-2:0),c=2;c<i;c++)s[c-2]=arguments[c];return t.apply(r,s)}),We||(We=function(t){for(var r=arguments.length,i=new Array(r>1?r-1:0),s=1;s<r;s++)i[s-1]=arguments[s];return new t(...i)});const xe=A(Array.prototype.forEach),_n=A(Array.prototype.lastIndexOf),Et=A(Array.prototype.pop),me=A(Array.prototype.push),xn=A(Array.prototype.splice),ee=Array.isArray,we=A(String.prototype.toLowerCase),Ge=A(String.prototype.toString),_t=A(String.prototype.match),Ae=A(String.prototype.replace),xt=A(String.prototype.indexOf),wn=A(String.prototype.trim),An=A(Number.prototype.toString),Sn=A(Boolean.prototype.toString),wt=typeof BigInt>"u"?null:A(BigInt.prototype.toString),At=typeof Symbol>"u"?null:A(Symbol.prototype.toString),N=A(Object.prototype.hasOwnProperty),Se=A(Object.prototype.toString),v=A(RegExp.prototype.test),ce=Cn(TypeError);function A(n){return function(t){t instanceof RegExp&&(t.lastIndex=0);for(var r=arguments.length,i=new Array(r>1?r-1:0),s=1;s<r;s++)i[s-1]=arguments[s];return $e(n,t,i)}}function Cn(n){return function(){for(var t=arguments.length,r=new Array(t),i=0;i<t;i++)r[i]=arguments[i];return We(n,r)}}function g(n,t){let r=arguments.length>2&&arguments[2]!==void 0?arguments[2]:we;if(yt&&yt(n,null),!ee(t))return n;let i=t.length;for(;i--;){let s=t[i];if(typeof s=="string"){const c=r(s);c!==s&&(yn(t)||(t[i]=c),s=c)}n[s]=!0}return n}function Nn(n){for(let t=0;t<n.length;t++)N(n,t)||(n[t]=null);return n}function M(n){const t=pe(null);for(const i of bt(n)){var r=gn(i,2);const s=r[0],c=r[1];N(n,s)&&(ee(c)?t[s]=Nn(c):c&&typeof c=="object"&&c.constructor===Object?t[s]=M(c):t[s]=c)}return t}function On(n){switch(typeof n){case"string":return n;case"number":return An(n);case"boolean":return Sn(n);case"bigint":return wt?wt(n):"0";case"symbol":return At?At(n):"Symbol()";case"undefined":return Se(n);case"function":case"object":{if(n===null)return Se(n);const t=n,r=W(t,"toString");if(typeof r=="function"){const i=r(t);return typeof i=="string"?i:Se(i)}return Se(n)}default:return Se(n)}}function W(n,t){for(;n!==null;){const i=En(n,t);if(i){if(i.get)return A(i.get);if(typeof i.value=="function")return A(i.value)}n=Tn(n)}function r(){return null}return r}function Rn(n){try{return v(n,""),!0}catch{return!1}}const St=k(["a","abbr","acronym","address","area","article","aside","audio","b","bdi","bdo","big","blink","blockquote","body","br","button","canvas","caption","center","cite","code","col","colgroup","content","data","datalist","dd","decorator","del","details","dfn","dialog","dir","div","dl","dt","element","em","fieldset","figcaption","figure","font","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","img","input","ins","kbd","label","legend","li","main","map","mark","marquee","menu","menuitem","meter","nav","nobr","ol","optgroup","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","search","section","select","shadow","slot","small","source","spacer","span","strike","strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","tr","track","tt","u","ul","var","video","wbr"]),je=k(["svg","a","altglyph","altglyphdef","altglyphitem","animatecolor","animatemotion","animatetransform","circle","clippath","defs","desc","ellipse","enterkeyhint","exportparts","filter","font","g","glyph","glyphref","hkern","image","inputmode","line","lineargradient","marker","mask","metadata","mpath","part","path","pattern","polygon","polyline","radialgradient","rect","stop","style","switch","symbol","text","textpath","title","tref","tspan","view","vkern"]),Ye=k(["feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence"]),kn=k(["animate","color-profile","cursor","discard","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","foreignobject","hatch","hatchpath","mesh","meshgradient","meshpatch","meshrow","missing-glyph","script","set","solidcolor","unknown","use"]),qe=k(["math","menclose","merror","mfenced","mfrac","mglyph","mi","mlabeledtr","mmultiscripts","mn","mo","mover","mpadded","mphantom","mroot","mrow","ms","mspace","msqrt","mstyle","msub","msup","msubsup","mtable","mtd","mtext","mtr","munder","munderover","mprescripts"]),Ln=k(["maction","maligngroup","malignmark","mlongdiv","mscarries","mscarry","msgroup","mstack","msline","msrow","semantics","annotation","annotation-xml","mprescripts","none"]),Ct=k(["#text"]),Nt=k(["accept","action","align","alt","autocapitalize","autocomplete","autopictureinpicture","autoplay","background","bgcolor","border","capture","cellpadding","cellspacing","checked","cite","class","clear","color","cols","colspan","command","commandfor","controls","controlslist","coords","crossorigin","datetime","decoding","default","dir","disabled","disablepictureinpicture","disableremoteplayback","download","draggable","enctype","enterkeyhint","exportparts","face","for","headers","height","hidden","high","href","hreflang","id","inert","inputmode","integrity","ismap","kind","label","lang","list","loading","loop","low","max","maxlength","media","method","min","minlength","multiple","muted","name","nonce","noshade","novalidate","nowrap","open","optimum","part","pattern","placeholder","playsinline","popover","popovertarget","popovertargetaction","poster","preload","pubdate","radiogroup","readonly","rel","required","rev","reversed","role","rows","rowspan","spellcheck","scope","selected","shape","size","sizes","slot","span","srclang","start","src","srcset","step","style","summary","tabindex","title","translate","type","usemap","valign","value","width","wrap","xmlns"]),Xe=k(["accent-height","accumulate","additive","alignment-baseline","amplitude","ascent","attributename","attributetype","azimuth","basefrequency","baseline-shift","begin","bias","by","class","clip","clippathunits","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","cx","cy","d","dx","dy","diffuseconstant","direction","display","divisor","dur","edgemode","elevation","end","exponent","fill","fill-opacity","fill-rule","filter","filterunits","flood-color","flood-opacity","font-family","font-size","font-size-adjust","font-stretch","font-style","font-variant","font-weight","fx","fy","g1","g2","glyph-name","glyphref","gradientunits","gradienttransform","height","href","id","image-rendering","in","in2","intercept","k","k1","k2","k3","k4","kerning","keypoints","keysplines","keytimes","lang","lengthadjust","letter-spacing","kernelmatrix","kernelunitlength","lighting-color","local","marker-end","marker-mid","marker-start","markerheight","markerunits","markerwidth","maskcontentunits","maskunits","max","mask","mask-type","media","method","mode","min","name","numoctaves","offset","operator","opacity","order","orient","orientation","origin","overflow","paint-order","path","pathlength","patterncontentunits","patterntransform","patternunits","points","preservealpha","preserveaspectratio","primitiveunits","r","rx","ry","radius","refx","refy","repeatcount","repeatdur","restart","result","rotate","scale","seed","shape-rendering","slope","specularconstant","specularexponent","spreadmethod","startoffset","stddeviation","stitchtiles","stop-color","stop-opacity","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke","stroke-width","style","surfacescale","systemlanguage","tabindex","tablevalues","targetx","targety","transform","transform-origin","text-anchor","text-decoration","text-rendering","textlength","type","u1","u2","unicode","values","viewbox","visibility","version","vert-adv-y","vert-origin-x","vert-origin-y","width","word-spacing","wrap","writing-mode","xchannelselector","ychannelselector","x","x1","x2","xmlns","y","y1","y2","z","zoomandpan"]),Ot=k(["accent","accentunder","align","bevelled","close","columnalign","columnlines","columnspacing","columnspan","denomalign","depth","dir","display","displaystyle","encoding","fence","frame","height","href","id","largeop","length","linethickness","lquote","lspace","mathbackground","mathcolor","mathsize","mathvariant","maxsize","minsize","movablelimits","notation","numalign","open","rowalign","rowlines","rowspacing","rowspan","rspace","rquote","scriptlevel","scriptminsize","scriptsizemultiplier","selection","separator","separators","stretchy","subscriptshift","supscriptshift","symmetric","voffset","width","xmlns"]),Le=k(["xlink:href","xml:id","xlink:title","xml:space","xmlns:xlink"]),vn=L(/{{[\w\W]*|^[\w\W]*}}/g),In=L(/<%[\w\W]*|^[\w\W]*%>/g),Mn=L(/\${[\w\W]*/g),Dn=L(/^data-[\-\w.\u00B7-\uFFFF]+$/),Pn=L(/^aria-[\-\w]+$/),Rt=L(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i),Un=L(/^(?:\w+script|data):/i),Fn=L(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),Hn=L(/^html$/i),zn=L(/^[a-z][.\w]*(-[.\w]+)+$/i),kt=L(/<[/\w!]/g),Bn=L(/<[/\w]/g),$n=L(/<\/no(script|embed|frames)/i),Wn=L(/\/>/i),G={element:1,attribute:2,text:3,cdataSection:4,entityReference:5,entityNode:6,processingInstruction:7,comment:8,document:9,documentType:10,documentFragment:11,notation:12},Gn=function(){return typeof window>"u"?null:window},jn=function(t,r){if(typeof t!="object"||typeof t.createPolicy!="function")return null;let i=null;const s="data-tt-policy-suffix";r&&r.hasAttribute(s)&&(i=r.getAttribute(s));const c="dompurify"+(i?"#"+i:"");try{return t.createPolicy(c,{createHTML(d){return d},createScriptURL(d){return d}})}catch{return console.warn("TrustedTypes policy "+c+" could not be created."),null}},Lt=function(){return{afterSanitizeAttributes:[],afterSanitizeElements:[],afterSanitizeShadowDOM:[],beforeSanitizeAttributes:[],beforeSanitizeElements:[],beforeSanitizeShadowDOM:[],uponSanitizeAttribute:[],uponSanitizeElement:[],uponSanitizeShadowNode:[]}},te=function(t,r,i,s){return N(t,r)&&ee(t[r])?g(s.base?M(s.base):{},t[r],s.transform):i};function vt(){let n=arguments.length>0&&arguments[0]!==void 0?arguments[0]:Gn();const t=l=>vt(l);if(t.version="3.4.11",t.removed=[],!n||!n.document||n.document.nodeType!==G.document||!n.Element)return t.isSupported=!1,t;let r=n.document;const i=r,s=i.currentScript;n.DocumentFragment;const c=n.HTMLTemplateElement,d=n.Node,m=n.Element,f=n.NodeFilter,S=n.NamedNodeMap;S===void 0&&(n.NamedNodeMap||n.MozNamedAttrMap),n.HTMLFormElement;const B=n.DOMParser,j=n.trustedTypes,Z=m.prototype,ve=W(Z,"cloneNode"),Ie=W(Z,"remove"),Dt=W(Z,"nextSibling"),oe=W(Z,"childNodes"),h=W(Z,"parentNode"),O=W(Z,"shadowRoot"),he=W(Z,"attributes"),I=d&&d.prototype?W(d.prototype,"nodeType"):null,Y=d&&d.prototype?W(d.prototype,"nodeName"):null;if(typeof c=="function"){const l=r.createElement("template");l.content&&l.content.ownerDocument&&(r=l.content.ownerDocument)}let y,F="",Ke,Pt=!1,Ce=0;const Ut=function(){if(Ce>0)throw ce('A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the "DOMPurify and Trusted Types" section of the README.')},ge=function(e){Ut(),Ce++;try{return y.createHTML(e)}finally{Ce--}},co=function(e){Ut(),Ce++;try{return y.createScriptURL(e)}finally{Ce--}},uo=function(){return Pt||(Ke=jn(j,s),Pt=!0),Ke},Me=r,Ze=Me.implementation,Ft=Me.createNodeIterator,fo=Me.createDocumentFragment,po=Me.getElementsByTagName,mo=i.importNode;let w=Lt();t.isSupported=typeof bt=="function"&&typeof h=="function"&&Ze&&Ze.createHTMLDocument!==void 0;const ho=vn,go=In,bo=Mn,yo=Dn,To=Pn,Eo=Un,Ht=Fn,_o=zn;let zt=Rt,T=null;const Bt=g({},[...St,...je,...Ye,...qe,...Ct]);let E=null;const $t=g({},[...Nt,...Xe,...Ot,...Le]);let _=Object.seal(pe(null,{tagNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},allowCustomizedBuiltInElements:{writable:!0,configurable:!1,enumerable:!0,value:!1}})),Ne=null,Wt=null;const re=Object.seal(pe(null,{tagCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeCheck:{writable:!0,configurable:!1,enumerable:!0,value:null}}));let Gt=!0,Je=!0,jt=!1,Yt=!0,ie=!1,Oe=!0,de=!1,Qe=!1,et=null,tt=null,nt=!1,be=!1,De=!1,Pe=!1,qt=!0,Xt=!1;const Vt="user-content-";let ot=!0,rt=!1,ye={},q=null;const it=g({},["annotation-xml","audio","colgroup","desc","foreignobject","head","iframe","math","mi","mn","mo","ms","mtext","noembed","noframes","noscript","plaintext","script","selectedcontent","style","svg","template","thead","title","video","xmp"]);let Kt=null;const Zt=g({},["audio","video","img","source","image","track"]);let st=null;const Jt=g({},["alt","class","for","id","label","name","pattern","placeholder","role","summary","title","value","style","xmlns"]),Ue="http://www.w3.org/1998/Math/MathML",Fe="http://www.w3.org/2000/svg",X="http://www.w3.org/1999/xhtml";let Te=X,at=!1,lt=null;const xo=g({},[Ue,Fe,X],Ge),Qt=k(["mi","mo","mn","ms","mtext"]);let ct=g({},Qt);const en=k(["annotation-xml"]);let ut=g({},en);const wo=g({},["title","style","font","a","script"]);let Re=null;const Ao=["application/xhtml+xml","text/html"],So="text/html";let x=null,Ee=null;const Co=r.createElement("form"),tn=function(e){return e instanceof RegExp||e instanceof Function},dt=function(){let e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};if(Ee&&Ee===e)return;(!e||typeof e!="object")&&(e={}),e=M(e),Re=Ao.indexOf(e.PARSER_MEDIA_TYPE)===-1?So:e.PARSER_MEDIA_TYPE,x=Re==="application/xhtml+xml"?Ge:we,T=te(e,"ALLOWED_TAGS",Bt,{transform:x}),E=te(e,"ALLOWED_ATTR",$t,{transform:x}),lt=te(e,"ALLOWED_NAMESPACES",xo,{transform:Ge}),st=te(e,"ADD_URI_SAFE_ATTR",Jt,{transform:x,base:Jt}),Kt=te(e,"ADD_DATA_URI_TAGS",Zt,{transform:x,base:Zt}),q=te(e,"FORBID_CONTENTS",it,{transform:x}),Ne=te(e,"FORBID_TAGS",M({}),{transform:x}),Wt=te(e,"FORBID_ATTR",M({}),{transform:x}),ye=N(e,"USE_PROFILES")?e.USE_PROFILES&&typeof e.USE_PROFILES=="object"?M(e.USE_PROFILES):e.USE_PROFILES:!1,Gt=e.ALLOW_ARIA_ATTR!==!1,Je=e.ALLOW_DATA_ATTR!==!1,jt=e.ALLOW_UNKNOWN_PROTOCOLS||!1,Yt=e.ALLOW_SELF_CLOSE_IN_ATTR!==!1,ie=e.SAFE_FOR_TEMPLATES||!1,Oe=e.SAFE_FOR_XML!==!1,de=e.WHOLE_DOCUMENT||!1,be=e.RETURN_DOM||!1,De=e.RETURN_DOM_FRAGMENT||!1,Pe=e.RETURN_TRUSTED_TYPE||!1,nt=e.FORCE_BODY||!1,qt=e.SANITIZE_DOM!==!1,Xt=e.SANITIZE_NAMED_PROPS||!1,ot=e.KEEP_CONTENT!==!1,rt=e.IN_PLACE||!1,zt=Rn(e.ALLOWED_URI_REGEXP)?e.ALLOWED_URI_REGEXP:Rt,Te=typeof e.NAMESPACE=="string"?e.NAMESPACE:X,ct=N(e,"MATHML_TEXT_INTEGRATION_POINTS")&&e.MATHML_TEXT_INTEGRATION_POINTS&&typeof e.MATHML_TEXT_INTEGRATION_POINTS=="object"?M(e.MATHML_TEXT_INTEGRATION_POINTS):g({},Qt),ut=N(e,"HTML_INTEGRATION_POINTS")&&e.HTML_INTEGRATION_POINTS&&typeof e.HTML_INTEGRATION_POINTS=="object"?M(e.HTML_INTEGRATION_POINTS):g({},en);const o=N(e,"CUSTOM_ELEMENT_HANDLING")&&e.CUSTOM_ELEMENT_HANDLING&&typeof e.CUSTOM_ELEMENT_HANDLING=="object"?M(e.CUSTOM_ELEMENT_HANDLING):pe(null);if(_=pe(null),N(o,"tagNameCheck")&&tn(o.tagNameCheck)&&(_.tagNameCheck=o.tagNameCheck),N(o,"attributeNameCheck")&&tn(o.attributeNameCheck)&&(_.attributeNameCheck=o.attributeNameCheck),N(o,"allowCustomizedBuiltInElements")&&typeof o.allowCustomizedBuiltInElements=="boolean"&&(_.allowCustomizedBuiltInElements=o.allowCustomizedBuiltInElements),L(_),ie&&(Je=!1),De&&(be=!0),ye&&(T=g({},Ct),E=pe(null),ye.html===!0&&(g(T,St),g(E,Nt)),ye.svg===!0&&(g(T,je),g(E,Xe),g(E,Le)),ye.svgFilters===!0&&(g(T,Ye),g(E,Xe),g(E,Le)),ye.mathMl===!0&&(g(T,qe),g(E,Ot),g(E,Le))),re.tagCheck=null,re.attributeCheck=null,N(e,"ADD_TAGS")&&(typeof e.ADD_TAGS=="function"?re.tagCheck=e.ADD_TAGS:ee(e.ADD_TAGS)&&(T===Bt&&(T=M(T)),g(T,e.ADD_TAGS,x))),N(e,"ADD_ATTR")&&(typeof e.ADD_ATTR=="function"?re.attributeCheck=e.ADD_ATTR:ee(e.ADD_ATTR)&&(E===$t&&(E=M(E)),g(E,e.ADD_ATTR,x))),N(e,"ADD_URI_SAFE_ATTR")&&ee(e.ADD_URI_SAFE_ATTR)&&g(st,e.ADD_URI_SAFE_ATTR,x),N(e,"FORBID_CONTENTS")&&ee(e.FORBID_CONTENTS)&&(q===it&&(q=M(q)),g(q,e.FORBID_CONTENTS,x)),N(e,"ADD_FORBID_CONTENTS")&&ee(e.ADD_FORBID_CONTENTS)&&(q===it&&(q=M(q)),g(q,e.ADD_FORBID_CONTENTS,x)),ot&&(T["#text"]=!0),de&&g(T,["html","head","body"]),T.table&&(g(T,["tbody"]),delete Ne.tbody),e.TRUSTED_TYPES_POLICY){if(typeof e.TRUSTED_TYPES_POLICY.createHTML!="function")throw ce('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');if(typeof e.TRUSTED_TYPES_POLICY.createScriptURL!="function")throw ce('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');const a=y;y=e.TRUSTED_TYPES_POLICY;try{F=ge("")}catch(u){throw y=a,u}}else e.TRUSTED_TYPES_POLICY===null?(y=void 0,F=""):(y===void 0&&(y=uo()),y&&typeof F=="string"&&(F=ge("")));k&&k(e),Ee=e},nn=g({},[...je,...Ye,...kn]),on=g({},[...qe,...Ln]),No=function(e,o,a){return o.namespaceURI===X?e==="svg":o.namespaceURI===Ue?e==="svg"&&(a==="annotation-xml"||ct[a]):!!nn[e]},Oo=function(e,o,a){return o.namespaceURI===X?e==="math":o.namespaceURI===Fe?e==="math"&&ut[a]:!!on[e]},Ro=function(e,o,a){return o.namespaceURI===Fe&&!ut[a]||o.namespaceURI===Ue&&!ct[a]?!1:!on[e]&&(wo[e]||!nn[e])},ko=function(e){let o=h(e);(!o||!o.tagName)&&(o={namespaceURI:Te,tagName:"template"});const a=we(e.tagName),u=we(o.tagName);return lt[e.namespaceURI]?e.namespaceURI===Fe?No(a,o,u):e.namespaceURI===Ue?Oo(a,o,u):e.namespaceURI===X?Ro(a,o,u):!!(Re==="application/xhtml+xml"&&lt[e.namespaceURI]):!1},se=function(e){me(t.removed,{element:e});try{h(e).removeChild(e)}catch{if(Ie(e),!h(e))throw ce("a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place")}},rn=function(e){const o=oe(e);if(o){const u=[];xe(o,p=>{me(u,p)}),xe(u,p=>{try{Ie(p)}catch{}})}const a=he(e);if(a)for(let u=a.length-1;u>=0;--u){const p=a[u],b=p&&p.name;if(typeof b=="string")try{e.removeAttribute(b)}catch{}}},fe=function(e,o){try{me(t.removed,{attribute:o.getAttributeNode(e),from:o})}catch{me(t.removed,{attribute:null,from:o})}if(o.removeAttribute(e),e==="is")if(be||De)try{se(o)}catch{}else try{o.setAttribute(e,"")}catch{}},Lo=function(e){const o=he(e);if(o)for(let a=o.length-1;a>=0;--a){const u=o[a],p=u&&u.name;if(!(typeof p!="string"||E[x(p)]))try{e.removeAttribute(p)}catch{}}},vo=function(e){const o=[e];for(;o.length>0;){const a=o.pop();(I?I(a):a.nodeType)===G.element&&Lo(a);const p=oe(a);if(p)for(let b=p.length-1;b>=0;--b)o.push(p[b])}},sn=function(e){let o=null,a=null;if(nt)e="<remove></remove>"+e;else{const b=_t(e,/^[\r\n\t ]+/);a=b&&b[0]}Re==="application/xhtml+xml"&&Te===X&&(e='<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>'+e+"</body></html>");const u=y?ge(e):e;if(Te===X)try{o=new B().parseFromString(u,Re)}catch{}if(!o||!o.documentElement){o=Ze.createDocument(Te,"template",null);try{o.documentElement.innerHTML=at?F:u}catch{}}const p=o.body||o.documentElement;return e&&a&&p.insertBefore(r.createTextNode(a),p.childNodes[0]||null),Te===X?po.call(o,de?"html":"body")[0]:de?o.documentElement:p},an=function(e){return Ft.call(e.ownerDocument||e,e,f.SHOW_ELEMENT|f.SHOW_COMMENT|f.SHOW_TEXT|f.SHOW_PROCESSING_INSTRUCTION|f.SHOW_CDATA_SECTION,null)},He=function(e){return e=Ae(e,ho," "),e=Ae(e,go," "),e=Ae(e,bo," "),e},ft=function(e){var o;e.normalize();const a=Ft.call(e.ownerDocument||e,e,f.SHOW_TEXT|f.SHOW_COMMENT|f.SHOW_CDATA_SECTION|f.SHOW_PROCESSING_INSTRUCTION,null);let u=a.nextNode();for(;u;)u.data=He(u.data),u=a.nextNode();const p=(o=e.querySelectorAll)===null||o===void 0?void 0:o.call(e,"template");p&&xe(p,b=>{_e(b.content)&&ft(b.content)})},ze=function(e){const o=Y?Y(e):null;return typeof o!="string"||x(o)!=="form"?!1:typeof e.nodeName!="string"||typeof e.textContent!="string"||typeof e.removeChild!="function"||e.attributes!==he(e)||typeof e.removeAttribute!="function"||typeof e.setAttribute!="function"||typeof e.namespaceURI!="string"||typeof e.insertBefore!="function"||typeof e.hasChildNodes!="function"||e.nodeType!==I(e)||e.childNodes!==oe(e)},_e=function(e){if(!I||typeof e!="object"||e===null)return!1;try{return I(e)===G.documentFragment}catch{return!1}},ke=function(e){if(!I||typeof e!="object"||e===null)return!1;try{return typeof I(e)=="number"}catch{return!1}};function J(l,e,o){l.length!==0&&xe(l,a=>{a.call(t,e,o,Ee)})}const Io=function(e,o){return!!(Oe&&e.hasChildNodes()&&!ke(e.firstElementChild)&&v(kt,e.textContent)&&v(kt,e.innerHTML)||Oe&&e.namespaceURI===X&&o==="style"&&ke(e.firstElementChild)||e.nodeType===G.processingInstruction||Oe&&e.nodeType===G.comment&&v(Bn,e.data))},Mo=function(e,o){if(!Ne[o]&&un(o)&&(_.tagNameCheck instanceof RegExp&&v(_.tagNameCheck,o)||_.tagNameCheck instanceof Function&&_.tagNameCheck(o)))return!1;if(ot&&!q[o]){const a=h(e),u=oe(e);if(u&&a){const p=u.length;for(let b=p-1;b>=0;--b){const R=rt?u[b]:ve(u[b],!0);a.insertBefore(R,Dt(e))}}}return se(e),!0},ln=function(e){if(J(w.beforeSanitizeElements,e,null),ze(e))return se(e),!0;const o=x(Y?Y(e):e.nodeName);if(J(w.uponSanitizeElement,e,{tagName:o,allowedTags:T}),Io(e,o))return se(e),!0;if(Ne[o]||!(re.tagCheck instanceof Function&&re.tagCheck(o))&&!T[o])return Mo(e,o);if((I?I(e):e.nodeType)===G.element&&!ko(e)||(o==="noscript"||o==="noembed"||o==="noframes")&&v($n,e.innerHTML))return se(e),!0;if(ie&&e.nodeType===G.text){const u=He(e.textContent);e.textContent!==u&&(me(t.removed,{element:e.cloneNode()}),e.textContent=u)}return J(w.afterSanitizeElements,e,null),!1},cn=function(e,o,a){if(Wt[o]||qt&&(o==="id"||o==="name")&&(a in r||a in Co))return!1;const u=E[o]||re.attributeCheck instanceof Function&&re.attributeCheck(o,e);if(!(Je&&v(yo,o))){if(!(Gt&&v(To,o))){if(u){if(!st[o]){if(!v(zt,Ae(a,Ht,""))){if(!((o==="src"||o==="xlink:href"||o==="href")&&e!=="script"&&xt(a,"data:")===0&&Kt[e])){if(!(jt&&!v(Eo,Ae(a,Ht,"")))){if(a)return!1}}}}}else if(!(un(e)&&(_.tagNameCheck instanceof RegExp&&v(_.tagNameCheck,e)||_.tagNameCheck instanceof Function&&_.tagNameCheck(e))&&(_.attributeNameCheck instanceof RegExp&&v(_.attributeNameCheck,o)||_.attributeNameCheck instanceof Function&&_.attributeNameCheck(o,e))||o==="is"&&_.allowCustomizedBuiltInElements&&(_.tagNameCheck instanceof RegExp&&v(_.tagNameCheck,a)||_.tagNameCheck instanceof Function&&_.tagNameCheck(a))))return!1}}return!0},Do=g({},["annotation-xml","color-profile","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","missing-glyph"]),un=function(e){return!Do[we(e)]&&v(_o,e)},Po=function(e,o,a,u){if(y&&typeof j=="object"&&typeof j.getAttributeType=="function"&&!a)switch(j.getAttributeType(e,o)){case"TrustedHTML":return ge(u);case"TrustedScriptURL":return co(u)}return u},Uo=function(e,o,a,u){try{a?e.setAttributeNS(a,o,u):e.setAttribute(o,u),ze(e)?se(e):Et(t.removed)}catch{fe(o,e)}},dn=function(e){J(w.beforeSanitizeAttributes,e,null);const o=e.attributes;if(!o||ze(e))return;const a={attrName:"",attrValue:"",keepAttr:!0,allowedAttributes:E,forceKeepAttr:void 0};let u=o.length;const p=x(e.nodeName);for(;u--;){const b=o[u],R=b.name,C=b.namespaceURI,H=b.value,$=x(R),mt=H;let P=R==="value"?mt:wn(mt);if(a.attrName=$,a.attrValue=P,a.keepAttr=!0,a.forceKeepAttr=void 0,J(w.uponSanitizeAttribute,e,a),P=a.attrValue,Xt&&($==="id"||$==="name")&&xt(P,Vt)!==0&&(fe(R,e),P=Vt+P),Oe&&v(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i,P)){fe(R,e);continue}if($==="attributename"&&_t(P,"href")){fe(R,e);continue}if(!a.forceKeepAttr){if(!a.keepAttr){fe(R,e);continue}if(!Yt&&v(Wn,P)){fe(R,e);continue}if(ie&&(P=He(P)),!cn(p,$,P)){fe(R,e);continue}P=Po(p,$,C,P),P!==mt&&Uo(e,R,C,P)}}J(w.afterSanitizeAttributes,e,null)},Be=function(e){let o=null;const a=an(e);for(J(w.beforeSanitizeShadowDOM,e,null);o=a.nextNode();)if(J(w.uponSanitizeShadowNode,o,null),ln(o),dn(o),_e(o.content)&&Be(o.content),(I?I(o):o.nodeType)===G.element){const p=O(o);_e(p)&&(pt(p),Be(p))}J(w.afterSanitizeShadowDOM,e,null)},pt=function(e){const o=[{node:e,shadow:null}];for(;o.length>0;){const a=o.pop();if(a.shadow){Be(a.shadow);continue}const u=a.node,b=(I?I(u):u.nodeType)===G.element,R=oe(u);if(R)for(let C=R.length-1;C>=0;--C)o.push({node:R[C],shadow:null});if(b){const C=Y?Y(u):null;if(typeof C=="string"&&x(C)==="template"){const H=u.content;_e(H)&&o.push({node:H,shadow:null})}}if(b){const C=O(u);_e(C)&&o.push({node:null,shadow:C},{node:C,shadow:null})}}};return t.sanitize=function(l){let e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},o=null,a=null,u=null,p=null;if(at=!l,at&&(l="<!-->"),typeof l!="string"&&!ke(l)&&(l=On(l),typeof l!="string"))throw ce("dirty is not a string, aborting");if(!t.isSupported)return l;Qe?(T=et,E=tt):dt(e),(w.uponSanitizeElement.length>0||w.uponSanitizeAttribute.length>0)&&(T=M(T)),w.uponSanitizeAttribute.length>0&&(E=M(E)),t.removed=[];const b=rt&&typeof l!="string"&&ke(l);if(b){const H=Y?Y(l):l.nodeName;if(typeof H=="string"){const $=x(H);if(!T[$]||Ne[$])throw ce("root node is forbidden and cannot be sanitized in-place")}if(ze(l))throw ce("root node is clobbered and cannot be sanitized in-place");try{pt(l)}catch($){throw rn(l),$}}else if(ke(l))o=sn("<!---->"),a=o.ownerDocument.importNode(l,!0),a.nodeType===G.element&&a.nodeName==="BODY"||a.nodeName==="HTML"?o=a:o.appendChild(a),pt(a);else{if(!be&&!ie&&!de&&l.indexOf("<")===-1)return y&&Pe?ge(l):l;if(o=sn(l),!o)return be?null:Pe?F:""}o&&nt&&se(o.firstChild);const R=an(b?l:o);try{for(;u=R.nextNode();)ln(u),dn(u),_e(u.content)&&Be(u.content)}catch(H){throw b&&rn(l),H}if(b)return xe(t.removed,H=>{H.element&&vo(H.element)}),ie&&ft(l),l;if(be){if(ie&&ft(o),De)for(p=fo.call(o.ownerDocument);o.firstChild;)p.appendChild(o.firstChild);else p=o;return(E.shadowroot||E.shadowrootmode)&&(p=mo.call(i,p,!0)),p}let C=de?o.outerHTML:o.innerHTML;return de&&T["!doctype"]&&o.ownerDocument&&o.ownerDocument.doctype&&o.ownerDocument.doctype.name&&v(Hn,o.ownerDocument.doctype.name)&&(C="<!DOCTYPE "+o.ownerDocument.doctype.name+`>
`+C),ie&&(C=He(C)),y&&Pe?ge(C):C},t.setConfig=function(){let l=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};dt(l),Qe=!0,et=T,tt=E},t.clearConfig=function(){Ee=null,Qe=!1,et=null,tt=null,y=Ke,F=""},t.isValidAttribute=function(l,e,o){Ee||dt({});const a=x(l),u=x(e);return cn(a,u,o)},t.addHook=function(l,e){typeof e=="function"&&N(w,l)&&me(w[l],e)},t.removeHook=function(l,e){if(N(w,l)){if(e!==void 0){const o=_n(w[l],e);return o===-1?void 0:xn(w[l],o,1)[0]}return Et(w[l])}},t.removeHooks=function(l){N(w,l)&&(w[l]=[])},t.removeAllHooks=function(){w=Lt()},t}var Yn=vt();const qn={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"};function Xn(n){return n.replace(/[&<>"]/g,t=>qn[t]||t)}function Vn(n){let t=Xn(n);return t=t.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\*(.*?)\*/g,"<em>$1</em>"),t=t.replace(/`(.*?)`/g,"<code>$1</code>"),t=t.replace(/^[\-\*] (.+)$/gm,"<li>$1</li>"),t=t.replace(/((?:<li>.*<\/li>\n?)+)/g,"<ul>$1</ul>"),t=t.replace(/\n/g,"<br>"),t=Yn.sanitize(t,{ALLOWED_TAGS:["strong","em","code","ul","ol","li","br","p"],ALLOWED_ATTR:[]}),t}const Kn=2e3,Zn=["footer","header","nav-","-nav","privacy","terms","cookie","newsletter","contact","legal","copyright","disclaimer","social-links","sidebar","advert","promo","banner-","utility","supplemental","modal-backdrop","cookie-consent"],Jn=["footer","header","nav","aside","style","script","noscript","iframe","canvas","svg"],Qn=["navigation","banner","contentinfo","complementary","alert","presentation"];function eo(n){var d,m;const t=((d=n.tagName)==null?void 0:d.toLowerCase())||"",r=(n.className||"").toString().toLowerCase(),i=(n.id||"").toLowerCase(),s=(n.getAttribute("role")||"").toLowerCase();if(Jn.includes(t)||Qn.includes(s))return!0;for(const f of Zn)if(r.includes(f)||i.includes(f))return!0;if(!((m=n.textContent)!=null&&m.trim()))return!0;const c=n.getBoundingClientRect();if(c.width<10&&c.height<10){const f=K(n.textContent||"");if(!U(f))return!0}return!1}function D(n){if(!n||!(n instanceof Element)||eo(n))return!1;const t=window.getComputedStyle(n);if(!t||t.display==="none"||t.visibility==="hidden"||t.opacity==="0"||parseFloat(t.opacity)===0)return!1;const r=n.getBoundingClientRect();if(!r)return!1;if(r.width<8&&r.height<8){const i=K(n.textContent||"");if(!U(i))return!1}return r.bottom>0&&r.right>0&&r.top<window.innerHeight&&r.left<window.innerWidth&&(r.width>0||r.height>0)}function K(n){return(n??"").toString().replace(/\u00A0/g," ").replace(/\s+/g," ").trim()}function ue(n,t=Kn){const r=K(n);return r?r.length>t?r.slice(0,t):r:""}function U(n){const t=K(n);if(!t||t.length<2)return!1;const r=t.toLowerCase();return!(["icon","menu","more","more...","settings","filter","search","close","x","⋮","…","open","show","hide","toggle","expand","collapse","submit","cancel","reset","clear","refresh","reload"].includes(r)||/^[\s\W]*$/.test(t))}function ne(n,t=200){const r=new Set,i=[];for(const s of n){const c=K(s);if(!U(c))continue;const d=c.toLowerCase();if(!r.has(d)&&(r.add(d),i.push(c),i.length>=t))break}return i}function to(n){if(!n)return"";const t=n.getAttribute("aria-label");if(t&&U(t))return t;const r=n.getAttribute("aria-labelledby");if(r){const c=r.split(/\s+/).filter(Boolean).map(d=>document.getElementById(d)).filter(Boolean).map(d=>K(d.textContent||"")).filter(Boolean).join(" ");if(c&&U(c))return c}if(n.id){const i=document.querySelector(`label[for="${n.id}"]`),s=i?K(i.textContent||""):"";if(s&&U(s))return s}return n.textContent||""}function z(n){if(!n)return"";const t=to(n);if(t)return ue(t);const r=n.getAttribute("aria-label");if(r&&U(r))return ue(r);const i=n.getAttribute("data-testid");return i&&U(i)?ue(i):ue(n.textContent||"")}function It(n){return K(n.textContent||"")}function no(n){if(!n)return[];const t=[];return n.querySelectorAll("th").forEach(i=>{if(!D(i))return;const s=z(i);s&&t.push(s)}),ne(t,50)}function oo(){const n=["step","first","second","third","next","then","after","click","fill","enter","select","save","submit","upload","create","edit","delete","confirm","complete","generate"],t=[],r=Array.from(document.querySelectorAll("ol li, ul li")).filter(s=>D(s));for(const s of r.slice(0,40)){const c=ue(It(s),300);if(!c||c.length<10)continue;const d=c.toLowerCase();(n.some(f=>d.includes(f))||/^\d+\./.test(c))&&t.push(c)}const i=Array.from(document.querySelectorAll('h2, h3, [role="heading"]')).filter(s=>D(s)).map(s=>z(s)).filter(s=>{const c=s.toLowerCase();return/step\s*\d/.test(c)||/phase\s*\d/.test(c)});return t.push(...i.slice(0,10)),ne(t,25)}function ro(){const n=[],t=Array.from(document.querySelectorAll('section, [role="region"], .card, .panel, .form-section')).filter(r=>D(r));for(const r of t.slice(0,30)){const i=r.querySelector('h1,h2,h3,h4,[role="heading"],legend,.card-title,.section-title');if(!i||!D(i))continue;const s=z(i);if(!s||s.length<3)continue;const c=Array.from(r.querySelectorAll('button, [role="button"], a.btn')).filter(D).map(z).filter(m=>m&&m.length>2),d=Array.from(r.querySelectorAll('form, [role="form"]')).filter(D).map(m=>{const f=m.querySelector("h1,h2,h3,legend,.form-title");return z(f||m)}).filter(m=>m&&m.length>2);n.push({title:s,buttons:ne(c,10),forms:ne(d,8)})}return n.slice(0,20)}function io(){const n=["click","select","fill","enter","choose","upload","save","submit","required","optional","note:","hint:","first","then","next","after","finally","step"],t=Array.from(document.querySelectorAll(".help-text, .hint, .instruction, .form-text, .alert-info, p, li, .step-description, .tooltip-content, .workflow-desc")).filter(D),r=[];for(const i of t.slice(0,80)){const s=ue(It(i),400);if(!s||s.length<15)continue;const c=s.toLowerCase(),d=n.some(f=>c.includes(f)),m=s.length<200;(d||m)&&r.push(s)}return ne(r,25)}function so(){const n=['[aria-label="breadcrumb"]','nav[aria-label="breadcrumb"]',".breadcrumb",'[role="navigation"][aria-label*="breadcrumb" i]',"ol.breadcrumb"];let t=null;for(const i of n){const s=document.querySelector(i);if(s&&D(s)){t=s;break}}if(!t)return[];const r=Array.from(t.querySelectorAll("a, span, li")).map(i=>z(i)).filter(i=>U(i));return ne(r,10)}function Ve(n,t){for(const r of t){let i=n.parentElement;for(;i&&i!==document.body;){const s=i.querySelector('h1,h2,h3,h4,[role="heading"]');if(s&&z(s)===r.title)return r.title;i=i.parentElement}}return null}function ao(n={}){var oe;const t=n.route??window.location.pathname,r=K(document.title)||"Untitled Page",i=n.role??null,s=ro(),c=oo(),d=Array.from(document.querySelectorAll('button:not([type="hidden"]):not([type="reset"]), [role="button"]:not(.sr-only), input[type="submit"], a.btn-primary, a.btn-success, button[type="submit"], .btn-primary:not(.footer-btn)')).filter(D),m=[];for(const h of d.slice(0,50)){const O=z(h);!O||O.length<2||!U(O)||m.push({label:O,section:Ve(h,s),tagName:((oe=h.tagName)==null?void 0:oe.toLowerCase())||"button"})}const f=Array.from(document.querySelectorAll('form:not([hidden]), [role="form"]')).filter(D),S=[];for(const h of f.slice(0,10)){const O=h.querySelector('h1,h2,h3,legend,[role="heading"],.card-title,.form-title'),he=O&&D(O)?z(O):null,I=Ve(h,s);he&&S.push({label:ue(he,160),section:I});const Y=h.querySelectorAll('input:not([type="hidden"]), textarea, select');for(const y of Array.from(Y).slice(0,15)){if(!D(y))continue;const F=y.getAttribute("aria-label")||y.getAttribute("placeholder")||y.getAttribute("name")||y.getAttribute("title");F&&U(F)&&F.length<100&&S.push({label:F,section:I,fieldType:y.getAttribute("type")||y.tagName.toLowerCase()})}}const B=Array.from(document.querySelectorAll('h1, h2, h3, h4, [role="heading"]')).filter(D),j=[];for(const h of B.slice(0,30)){const O=z(h);O&&U(O)&&j.push({text:O,level:parseInt(h.tagName.substring(1))||2,section:Ve(h,s)})}const Z=Array.from(document.querySelectorAll("table:not([hidden])")).filter(D),ve=[];for(const h of Z.slice(0,10)){const O=no(h);O.length&&ve.push(...O)}const Ie=io();return{page_title:r,route:t,role:i,sections:s.map(h=>({title:h.title,buttons:h.buttons.slice(0,10),forms:h.forms.slice(0,8)})),actions:m.map(h=>({label:h.label,section:h.section,type:h.tagName||"button"})),buttons:m.map(h=>h.label).slice(0,50),headings:j.map(h=>h.text).slice(0,30),heading_details:j.slice(0,30),tables:ne(ve,50),forms:ne(S.map(h=>h.label),30),form_details:S.slice(0,30),workflows:c.map(h=>({text:h,type:"sequential"})),workflow_steps:c.slice(0,20),instructional_text:Ie.slice(0,25),breadcrumbs:so()}}class lo{constructor(t){Q(this,"config");Q(this,"panel",null);Q(this,"messagesEl",null);Q(this,"inputEl",null);Q(this,"isOpen",!1);Q(this,"history",[]);Q(this,"sendBtn",null);Q(this,"fab",null);this.config=t}mount(){this.injectStyles(),this.createFAB()}injectStyles(){const t=document.createElement("style");t.textContent=`
      [data-dlc] { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
      [data-dlc] * { box-sizing: border-box; }
      .dlc-fab {
        position: fixed;
        ${this.config.position==="bottom-left"?"left: 20px":"right: 20px"};
        bottom: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.adjustColor(this.config.primaryColor,-30)});
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 16px ${this.config.primaryColor}44;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .dlc-fab:hover { transform: scale(1.08); box-shadow: 0 8px 24px ${this.config.primaryColor}66; }
      .dlc-fab.open { transform: scale(0.9); opacity: 0.8; }
      .dlc-panel {
        position: fixed;
        ${this.config.position==="bottom-left"?"left: 20px":"right: 20px"};
        bottom: 84px;
        width: 380px;
        height: 580px;
        max-height: calc(100vh - 120px);
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 2147483646;
        font-size: 14px;
        color: #1f2937;
        animation: dlc-slide-up 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }
      @keyframes dlc-slide-up {
        from { opacity: 0; transform: translateY(12px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .dlc-panel.open { display: flex; }
      .dlc-header {
        background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.adjustColor(this.config.primaryColor,-30)});
        color: white;
        padding: 18px 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
      }
      .dlc-header-avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .dlc-header-info { flex: 1; min-width: 0; }
      .dlc-header-name { font-weight: 600; font-size: 15px; }
      .dlc-header-status { font-size: 11px; opacity: 0.8; display: flex; align-items: center; gap: 4px; }
      .dlc-header-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; display: inline-block; }
      .dlc-header-close {
        width: 28px; height: 28px; border-radius: 8px;
        background: rgba(255,255,255,0.15);
        border: none; color: white; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.15s; flex-shrink: 0;
      }
      .dlc-header-close:hover { background: rgba(255,255,255,0.25); }
      .dlc-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: #f9fafb;
      }
      .dlc-messages::-webkit-scrollbar { width: 4px; }
      .dlc-messages::-webkit-scrollbar-track { background: transparent; }
      .dlc-messages::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
      .dlc-msg {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 14px;
        line-height: 1.55;
        word-wrap: break-word;
        animation: dlc-msg-in 0.2s ease-out;
      }
      @keyframes dlc-msg-in {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .dlc-msg.user {
        align-self: flex-end;
        background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.adjustColor(this.config.primaryColor,-20)});
        color: white;
        border-bottom-right-radius: 4px;
      }
      .dlc-msg.bot {
        align-self: flex-start;
        background: white;
        color: #1f2937;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }
      .dlc-msg.bot strong { font-weight: 600; }
      .dlc-msg.bot code {
        background: #f3f4f6;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 13px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        color: #ef4444;
      }
      .dlc-msg.bot ul, .dlc-msg.bot ol {
        margin: 6px 0;
        padding-left: 20px;
      }
      .dlc-msg.bot li { margin-bottom: 3px; }
      .dlc-msg.bot p { margin: 6px 0; }
      .dlc-msg.bot p:first-child { margin-top: 0; }
      .dlc-msg.bot p:last-child { margin-bottom: 0; }
      .dlc-input-area {
        padding: 12px 14px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
        align-items: flex-end;
        background: white;
        flex-shrink: 0;
      }
      .dlc-input-wrap {
        flex: 1;
        display: flex;
        align-items: flex-end;
        border: 1px solid #d1d5db;
        border-radius: 12px;
        padding: 4px 4px 4px 14px;
        background: #f9fafb;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .dlc-input-wrap:focus-within {
        border-color: ${this.config.primaryColor};
        box-shadow: 0 0 0 3px ${this.config.primaryColor}22;
        background: white;
      }
      .dlc-input {
        flex: 1;
        border: none;
        background: transparent;
        padding: 8px 0;
        font-size: 14px;
        resize: none;
        outline: none;
        font-family: inherit;
        min-height: 24px;
        max-height: 100px;
        color: #1f2937;
        line-height: 1.4;
      }
      .dlc-input::placeholder { color: #9ca3af; }
      .dlc-send {
        background: ${this.config.primaryColor};
        color: white;
        border: none;
        border-radius: 10px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: opacity 0.15s, transform 0.15s;
        flex-shrink: 0;
      }
      .dlc-send:hover { opacity: 0.9; transform: scale(1.03); }
      .dlc-send:active { transform: scale(0.97); }
      .dlc-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
      .dlc-typing {
        display: flex;
        gap: 5px;
        padding: 12px 16px;
        align-self: flex-start;
        background: white;
        border-radius: 14px;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }
      .dlc-typing span {
        width: 8px; height: 8px;
        background: #9ca3af;
        border-radius: 50%;
        display: inline-block;
        animation: dlc-bounce 1.4s infinite ease-in-out both;
      }
      .dlc-typing span:nth-child(1) { animation-delay: -0.32s; }
      .dlc-typing span:nth-child(2) { animation-delay: -0.16s; }
      @keyframes dlc-bounce {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }
      .dlc-nav-pills {
        margin-top: 10px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .dlc-nav-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 14px;
        background: white;
        color: ${this.config.primaryColor};
        border: 1.5px solid ${this.config.primaryColor}33;
        border-radius: 99px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.2s ease;
      }
      .dlc-nav-pill:hover {
        background: ${this.config.primaryColor};
        color: white;
        border-color: ${this.config.primaryColor};
        transform: translateY(-1px);
        box-shadow: 0 2px 8px ${this.config.primaryColor}44;
      }
      .dlc-nav-pill svg { width: 12px; height: 12px; flex-shrink: 0; }
      .dlc-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 12px;
      }
      .dlc-chip {
        padding: 8px 16px;
        background: white;
        color: #374151;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.15s;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      }
      .dlc-chip:hover {
        background: ${this.config.primaryColor};
        color: white;
        border-color: ${this.config.primaryColor};
        transform: translateY(-1px);
        box-shadow: 0 2px 8px ${this.config.primaryColor}33;
      }
      .dlc-welcome {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 8px;
        padding: 32px 20px 20px;
        text-align: center;
      }
      .dlc-welcome-icon {
        width: 56px; height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${this.config.primaryColor}22, ${this.adjustColor(this.config.primaryColor,-30)}22);
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 4px;
      }
      .dlc-welcome-title {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
        line-height: 1.3;
      }
      .dlc-welcome-title span { font-weight: 500; }
      .dlc-welcome-desc {
        font-size: 13px;
        color: #6b7280;
        line-height: 1.5;
        max-width: 280px;
      }
      @media (max-width: 600px) {
        .dlc-panel {
          width: 100vw;
          height: 100vh;
          max-height: 100vh;
          bottom: 0;
          left: 0;
          right: 0;
          border-radius: 0;
        }
        .dlc-fab { bottom: 16px; ${this.config.position==="bottom-left"?"left: 16px":"right: 16px"}; }
        .dlc-nav-pill { padding: 8px 16px; font-size: 13px; }
      }
    `,document.head.appendChild(t)}adjustColor(t,r){const i=parseInt(t.replace("#",""),16),s=Math.min(255,Math.max(0,(i>>16&255)+r)),c=Math.min(255,Math.max(0,(i>>8&255)+r)),d=Math.min(255,Math.max(0,(i&255)+r));return`#${(s<<16|c<<8|d).toString(16).padStart(6,"0")}`}chatIconSvg(){return'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'}closeIconSvg(){return'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}arrowUpSvg(){return'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'}externalLinkSvg(){return'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'}robotSvg(){return'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>'}createFAB(){const t=document.createElement("button");t.setAttribute("data-dlc",""),t.className="dlc-fab",t.innerHTML=this.chatIconSvg(),t.onclick=()=>this.toggle(),document.body.appendChild(t),this.fab=t}toggle(){this.isOpen=!this.isOpen,this.isOpen?(this.createPanel(),this.panel.classList.add("open"),this.fab&&this.fab.classList.add("open")):this.panel&&(this.panel.classList.remove("open"),this.fab&&this.fab.classList.remove("open"))}createPanel(){if(this.panel)return;const t=document.createElement("div");t.setAttribute("data-dlc",""),t.className="dlc-panel";const r=document.createElement("div");r.className="dlc-header",r.innerHTML=`
      <div class="dlc-header-avatar">${this.robotSvg()}</div>
      <div class="dlc-header-info">
        <div class="dlc-header-name">${this.escapeHtml(this.config.botName)}</div>
        <div class="dlc-header-status"><span class="dlc-header-status-dot"></span> Online</div>
      </div>
    `;const i=document.createElement("button");i.className="dlc-header-close",i.innerHTML=this.closeIconSvg(),i.onclick=()=>this.toggle(),r.appendChild(i);const s=document.createElement("div");s.className="dlc-messages";const c=document.createElement("div");c.className="dlc-input-area";const d=document.createElement("div");d.className="dlc-input-wrap";const m=document.createElement("textarea");m.className="dlc-input",m.placeholder="Type a message...",m.rows=1,m.addEventListener("keydown",S=>{S.key==="Enter"&&!S.shiftKey&&(S.preventDefault(),this.handleSend())}),m.addEventListener("input",()=>{m.style.height="auto",m.style.height=Math.min(m.scrollHeight,100)+"px"});const f=document.createElement("button");f.className="dlc-send",f.innerHTML=this.arrowUpSvg(),f.title="Send message",f.onclick=()=>this.handleSend(),d.appendChild(m),d.appendChild(f),c.appendChild(d),t.appendChild(r),t.appendChild(s),t.appendChild(c),document.body.appendChild(t),this.panel=t,this.messagesEl=s,this.inputEl=m,this.sendBtn=f,this.showWelcome()}escapeHtml(t){const r=document.createElement("div");return r.textContent=t,r.innerHTML}showWelcome(){if(!this.messagesEl)return;const t=this.config.welcomeMessage||`Hi! I'm ${this.config.botName}. How can I help you today?`,r=document.createElement("div");r.className="dlc-welcome",r.innerHTML=`
      <div class="dlc-welcome-icon">${this.robotSvg()}</div>
      <div class="dlc-welcome-title">${this.escapeHtml(t)}</div>
      <div class="dlc-welcome-desc">Ask about features, navigation, or anything on this site.</div>
    `;const i=this.config.suggestionChips||["What can I do here?"];if(i.length>0){const s=document.createElement("div");s.className="dlc-chips",i.forEach(c=>{const d=document.createElement("div");d.className="dlc-chip",d.textContent=c,d.onclick=()=>{this.inputEl.value=c,this.handleSend()},s.appendChild(d)}),r.appendChild(s)}this.messagesEl.appendChild(r)}addMessage(t,r,i,s,c){if(!this.messagesEl)return;const d=document.createElement("div");if(d.className=`dlc-msg ${t}`,t==="user")d.textContent=r;else if(d.innerHTML=Vn(r),c&&c.length>0&&c.some(f=>f.url&&f.url!=="/"&&f.url!=="#"&&f.title)){const f=document.createElement("div");f.className="dlc-nav-pills",c.forEach(S=>{const B=document.createElement("a");B.className="dlc-nav-pill",B.innerHTML=`${this.externalLinkSvg()} ${this.escapeHtml(S.title)}`,B.href="#",B.onclick=j=>{j.preventDefault(),window.dispatchEvent(new CustomEvent("dlc:navigate",{detail:{route:S.url}}))},f.appendChild(B)}),d.appendChild(f)}this.messagesEl.appendChild(d),this.messagesEl.scrollTop=this.messagesEl.scrollHeight}showTyping(){if(!this.messagesEl)return null;const t=document.createElement("div");return t.className="dlc-typing",t.innerHTML="<span></span><span></span><span></span>",this.messagesEl.appendChild(t),this.messagesEl.scrollTop=this.messagesEl.scrollHeight,t}hideTyping(t){t==null||t.remove()}buildWorkspaceContext(){try{const t=window.SaaS_User_Role||this.config.role,r=ao({role:t,route:window.location.pathname});return{title:r.page_title,current_page:window.location.pathname,headings:r.headings.slice(0,10),buttons:r.buttons.slice(0,10),sections:r.sections.slice(0,5),forms:r.forms.slice(0,5),workflows:r.workflows.slice(0,5),instructional_text:r.instructional_text.slice(0,5),breadcrumbs:r.breadcrumbs,actions:r.actions.slice(0,10)}}catch{return{title:document.title,current_page:window.location.pathname,headings:Array.from(document.querySelectorAll("h1, h2, h3")).map(t=>{var r;return((r=t.textContent)==null?void 0:r.trim())||""}).filter(Boolean).slice(0,10),buttons:Array.from(document.querySelectorAll("button")).map(t=>{var r;return((r=t.textContent)==null?void 0:r.trim())||""}).filter(Boolean).slice(0,10)}}}async handleSend(){const t=this.inputEl,r=this.sendBtn;if(!t||!r)return;const i=t.value.trim();if(!i)return;t.value="",t.style.height="auto",this.addMessage("user",i),this.history.push({sender:"user",text:i}),r.disabled=!0;const s=this.showTyping();try{const c=this.buildWorkspaceContext(),d=window.SaaS_User_Role||this.config.role,m={message:i,session_id:fn(),current_route:window.location.pathname,history:this.history.slice(-20).map(S=>({sender:S.sender,text:S.text})),role:d,workspace_context:c},f=await ht(this.config.apiKey,this.config.baseUrl,m);this.hideTyping(s),this.addMessage("bot",f.message,f.route,f.route_name,f.navigations),this.history.push({sender:"bot",text:f.message,route:f.route,route_name:f.route_name,navigations:f.navigations})}catch{this.hideTyping(s),this.addMessage("bot","Sorry, something went wrong. Please try again.")}finally{r.disabled=!1}}}function Mt(){const n=V();if(!n){console.error("[Chatbot] Missing window.ChatbotConfig or apiKey");return}new lo(n).mount(),window.addEventListener("dlc:navigate",r=>{var i;if((i=r.detail)!=null&&i.route){const s=r.detail.route;s.startsWith("http")?window.location.href=s:(window.history.pushState({},"",s),window.dispatchEvent(new PopStateEvent("popstate")))}})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Mt):Mt()})();
