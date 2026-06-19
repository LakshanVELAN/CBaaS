var ee=Object.defineProperty;var te=(w,g,y)=>g in w?ee(w,g,{enumerable:!0,configurable:!0,writable:!0,value:y}):w[g]=y;var b=(w,g,y)=>te(w,typeof g!="symbol"?g+"":g,y);(function(){"use strict";const w={botName:"Assistant",primaryColor:"#1a56db",position:"bottom-right",role:"guest",suggestionChips:["What can I do here?"]};function g(){const o=window.ChatbotConfig;return!o||!o.apiKey?null:{...w,...o,baseUrl:o.baseUrl||""}}const y="dlc_session_id";function q(){let o=sessionStorage.getItem(y);return o||(o=crypto.randomUUID(),sessionStorage.setItem(y,o)),o}async function $(o,e,t,n=1){const i=`${e.replace(/\/+$/,"")}/api/v1/chat/message/`;try{const r=await fetch(i,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:JSON.stringify(t)});if(!r.ok){const s=await r.json().catch(()=>({error:"Request failed"}));throw new Error(s.error||`HTTP ${r.status}`)}return await r.json()}catch(r){if(n>0)return $(o,e,t,n-1);throw r}}const B={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"};function I(o){return o.replace(/[&<>"]/g,e=>B[e]||e)}function j(o){let e=I(o);return e=e.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*(.*?)\*/g,"<em>$1</em>"),e=e.replace(/`(.*?)`/g,"<code>$1</code>"),e=e.replace(/^[\-\*] (.+)$/gm,"<li>$1</li>"),e=e.replace(/((?:<li>.*<\/li>\n?)+)/g,"<ul>$1</ul>"),e=e.replace(/\n/g,"<br>"),e}const z=2e3,R=["footer","header","nav-","-nav","privacy","terms","cookie","newsletter","contact","legal","copyright","disclaimer","social-links","sidebar","advert","promo","banner-","utility","supplemental","modal-backdrop","cookie-consent"],W=["footer","header","nav","aside","style","script","noscript","iframe","canvas","svg"],O=["navigation","banner","contentinfo","complementary","alert","presentation"];function P(o){var s,l;const e=((s=o.tagName)==null?void 0:s.toLowerCase())||"",t=(o.className||"").toString().toLowerCase(),n=(o.id||"").toLowerCase(),i=(o.getAttribute("role")||"").toLowerCase();if(W.includes(e)||O.includes(i))return!0;for(const a of R)if(t.includes(a)||n.includes(a))return!0;if(!((l=o.textContent)!=null&&l.trim()))return!0;const r=o.getBoundingClientRect();if(r.width<10&&r.height<10){const a=m(o.textContent||"");if(!u(a))return!0}return!1}function d(o){if(!o||!(o instanceof Element)||P(o))return!1;const e=window.getComputedStyle(o);if(!e||e.display==="none"||e.visibility==="hidden"||e.opacity==="0"||parseFloat(e.opacity)===0)return!1;const t=o.getBoundingClientRect();if(!t)return!1;if(t.width<8&&t.height<8){const n=m(o.textContent||"");if(!u(n))return!1}return t.bottom>0&&t.right>0&&t.top<window.innerHeight&&t.left<window.innerWidth&&(t.width>0||t.height>0)}function m(o){return(o??"").toString().replace(/\u00A0/g," ").replace(/\s+/g," ").trim()}function v(o,e=z){const t=m(o);return t?t.length>e?t.slice(0,e):t:""}function u(o){const e=m(o);if(!e||e.length<2)return!1;const t=e.toLowerCase();return!(["icon","menu","more","more...","settings","filter","search","close","x","⋮","…","open","show","hide","toggle","expand","collapse","submit","cancel","reset","clear","refresh","reload"].includes(t)||/^[\s\W]*$/.test(e))}function x(o,e=200){const t=new Set,n=[];for(const i of o){const r=m(i);if(!u(r))continue;const s=r.toLowerCase();if(!t.has(s)&&(t.add(s),n.push(r),n.length>=e))break}return n}function U(o){if(!o)return"";const e=o.getAttribute("aria-label");if(e&&u(e))return e;const t=o.getAttribute("aria-labelledby");if(t){const r=t.split(/\s+/).filter(Boolean).map(s=>document.getElementById(s)).filter(Boolean).map(s=>m(s.textContent||"")).filter(Boolean).join(" ");if(r&&u(r))return r}if(o.id){const n=document.querySelector(`label[for="${o.id}"]`),i=n?m(n.textContent||""):"";if(i&&u(i))return i}return o.textContent||""}function f(o){if(!o)return"";const e=U(o);if(e)return v(e);const t=o.getAttribute("aria-label");if(t&&u(t))return v(t);const n=o.getAttribute("data-testid");return n&&u(n)?v(n):v(o.textContent||"")}function N(o){return m(o.textContent||"")}function F(o){if(!o)return[];const e=[];return o.querySelectorAll("th").forEach(n=>{if(!d(n))return;const i=f(n);i&&e.push(i)}),x(e,50)}function Y(){const o=["step","first","second","third","next","then","after","click","fill","enter","select","save","submit","upload","create","edit","delete","confirm","complete","generate"],e=[],t=Array.from(document.querySelectorAll("ol li, ul li")).filter(i=>d(i));for(const i of t.slice(0,40)){const r=v(N(i),300);if(!r||r.length<10)continue;const s=r.toLowerCase();(o.some(a=>s.includes(a))||/^\d+\./.test(r))&&e.push(r)}const n=Array.from(document.querySelectorAll('h2, h3, [role="heading"]')).filter(i=>d(i)).map(i=>f(i)).filter(i=>{const r=i.toLowerCase();return/step\s*\d/.test(r)||/phase\s*\d/.test(r)});return e.push(...n.slice(0,10)),x(e,25)}function D(){const o=[],e=Array.from(document.querySelectorAll('section, [role="region"], .card, .panel, .form-section')).filter(t=>d(t));for(const t of e.slice(0,30)){const n=t.querySelector('h1,h2,h3,h4,[role="heading"],legend,.card-title,.section-title');if(!n||!d(n))continue;const i=f(n);if(!i||i.length<3)continue;const r=Array.from(t.querySelectorAll('button, [role="button"], a.btn')).filter(d).map(f).filter(l=>l&&l.length>2),s=Array.from(t.querySelectorAll('form, [role="form"]')).filter(d).map(l=>{const a=l.querySelector("h1,h2,h3,legend,.form-title");return f(a||l)}).filter(l=>l&&l.length>2);o.push({title:i,buttons:x(r,10),forms:x(s,8)})}return o.slice(0,20)}function K(){const o=["click","select","fill","enter","choose","upload","save","submit","required","optional","note:","hint:","first","then","next","after","finally","step"],e=Array.from(document.querySelectorAll(".help-text, .hint, .instruction, .form-text, .alert-info, p, li, .step-description, .tooltip-content, .workflow-desc")).filter(d),t=[];for(const n of e.slice(0,80)){const i=v(N(n),400);if(!i||i.length<15)continue;const r=i.toLowerCase(),s=o.some(a=>r.includes(a)),l=i.length<200;(s||l)&&t.push(i)}return x(t,25)}function V(){const o=['[aria-label="breadcrumb"]','nav[aria-label="breadcrumb"]',".breadcrumb",'[role="navigation"][aria-label*="breadcrumb" i]',"ol.breadcrumb"];let e=null;for(const n of o){const i=document.querySelector(n);if(i&&d(i)){e=i;break}}if(!e)return[];const t=Array.from(e.querySelectorAll("a, span, li")).map(n=>f(n)).filter(n=>u(n));return x(t,10)}function A(o,e){for(const t of e){let n=o.parentElement;for(;n&&n!==document.body;){const i=n.querySelector('h1,h2,h3,h4,[role="heading"]');if(i&&f(i)===t.title)return t.title;n=n.parentElement}}return null}function G(o={}){var M;const e=o.route??window.location.pathname,t=m(document.title)||"Untitled Page",n=o.role??null,i=D(),r=Y(),s=Array.from(document.querySelectorAll('button:not([type="hidden"]):not([type="reset"]), [role="button"]:not(.sr-only), input[type="submit"], a.btn-primary, a.btn-success, button[type="submit"], .btn-primary:not(.footer-btn)')).filter(d),l=[];for(const c of s.slice(0,50)){const p=f(c);!p||p.length<2||!u(p)||l.push({label:p,section:A(c,i),tagName:((M=c.tagName)==null?void 0:M.toLowerCase())||"button"})}const a=Array.from(document.querySelectorAll('form:not([hidden]), [role="form"]')).filter(d),h=[];for(const c of a.slice(0,10)){const p=c.querySelector('h1,h2,h3,legend,[role="heading"],.card-title,.form-title'),_=p&&d(p)?f(p):null,H=A(c,i);_&&h.push({label:v(_,160),section:H});const Z=c.querySelectorAll('input:not([type="hidden"]), textarea, select');for(const C of Array.from(Z).slice(0,15)){if(!d(C))continue;const E=C.getAttribute("aria-label")||C.getAttribute("placeholder")||C.getAttribute("name")||C.getAttribute("title");E&&u(E)&&E.length<100&&h.push({label:E,section:H,fieldType:C.getAttribute("type")||C.tagName.toLowerCase()})}}const k=Array.from(document.querySelectorAll('h1, h2, h3, h4, [role="heading"]')).filter(d),S=[];for(const c of k.slice(0,30)){const p=f(c);p&&u(p)&&S.push({text:p,level:parseInt(c.tagName.substring(1))||2,section:A(c,i)})}const J=Array.from(document.querySelectorAll("table:not([hidden])")).filter(d),T=[];for(const c of J.slice(0,10)){const p=F(c);p.length&&T.push(...p)}const Q=K();return{page_title:t,route:e,role:n,sections:i.map(c=>({title:c.title,buttons:c.buttons.slice(0,10),forms:c.forms.slice(0,8)})),actions:l.map(c=>({label:c.label,section:c.section,type:c.tagName||"button"})),buttons:l.map(c=>c.label).slice(0,50),headings:S.map(c=>c.text).slice(0,30),heading_details:S.slice(0,30),tables:x(T,50),forms:x(h.map(c=>c.label),30),form_details:h.slice(0,30),workflows:r.map(c=>({text:c,type:"sequential"})),workflow_steps:r.slice(0,20),instructional_text:Q.slice(0,25),breadcrumbs:V()}}class X{constructor(e){b(this,"config");b(this,"panel",null);b(this,"messagesEl",null);b(this,"inputEl",null);b(this,"isOpen",!1);b(this,"history",[]);b(this,"sendBtn",null);b(this,"fab",null);this.config=e}mount(){this.injectStyles(),this.createFAB()}injectStyles(){const e=document.createElement("style");e.textContent=`
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
    `,document.head.appendChild(e)}adjustColor(e,t){const n=parseInt(e.replace("#",""),16),i=Math.min(255,Math.max(0,(n>>16&255)+t)),r=Math.min(255,Math.max(0,(n>>8&255)+t)),s=Math.min(255,Math.max(0,(n&255)+t));return`#${(i<<16|r<<8|s).toString(16).padStart(6,"0")}`}chatIconSvg(){return'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'}closeIconSvg(){return'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}arrowUpSvg(){return'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'}externalLinkSvg(){return'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'}robotSvg(){return'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>'}createFAB(){const e=document.createElement("button");e.setAttribute("data-dlc",""),e.className="dlc-fab",e.innerHTML=this.chatIconSvg(),e.onclick=()=>this.toggle(),document.body.appendChild(e),this.fab=e}toggle(){this.isOpen=!this.isOpen,this.isOpen?(this.createPanel(),this.panel.classList.add("open"),this.fab&&this.fab.classList.add("open")):this.panel&&(this.panel.classList.remove("open"),this.fab&&this.fab.classList.remove("open"))}createPanel(){if(this.panel)return;const e=document.createElement("div");e.setAttribute("data-dlc",""),e.className="dlc-panel";const t=document.createElement("div");t.className="dlc-header",t.innerHTML=`
      <div class="dlc-header-avatar">${this.robotSvg()}</div>
      <div class="dlc-header-info">
        <div class="dlc-header-name">${this.escapeHtml(this.config.botName)}</div>
        <div class="dlc-header-status"><span class="dlc-header-status-dot"></span> Online</div>
      </div>
    `;const n=document.createElement("button");n.className="dlc-header-close",n.innerHTML=this.closeIconSvg(),n.onclick=()=>this.toggle(),t.appendChild(n);const i=document.createElement("div");i.className="dlc-messages";const r=document.createElement("div");r.className="dlc-input-area";const s=document.createElement("div");s.className="dlc-input-wrap";const l=document.createElement("textarea");l.className="dlc-input",l.placeholder="Type a message...",l.rows=1,l.addEventListener("keydown",h=>{h.key==="Enter"&&!h.shiftKey&&(h.preventDefault(),this.handleSend())}),l.addEventListener("input",()=>{l.style.height="auto",l.style.height=Math.min(l.scrollHeight,100)+"px"});const a=document.createElement("button");a.className="dlc-send",a.innerHTML=this.arrowUpSvg(),a.title="Send message",a.onclick=()=>this.handleSend(),s.appendChild(l),s.appendChild(a),r.appendChild(s),e.appendChild(t),e.appendChild(i),e.appendChild(r),document.body.appendChild(e),this.panel=e,this.messagesEl=i,this.inputEl=l,this.sendBtn=a,this.showWelcome()}escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}showWelcome(){if(!this.messagesEl)return;const e=this.config.welcomeMessage||`Hi! I'm ${this.config.botName}. How can I help you today?`,t=document.createElement("div");t.className="dlc-welcome",t.innerHTML=`
      <div class="dlc-welcome-icon">${this.robotSvg()}</div>
      <div class="dlc-welcome-title">${this.escapeHtml(e)}</div>
      <div class="dlc-welcome-desc">Ask about features, navigation, or anything on this site.</div>
    `;const n=this.config.suggestionChips||["What can I do here?"];if(n.length>0){const i=document.createElement("div");i.className="dlc-chips",n.forEach(r=>{const s=document.createElement("div");s.className="dlc-chip",s.textContent=r,s.onclick=()=>{this.inputEl.value=r,this.handleSend()},i.appendChild(s)}),t.appendChild(i)}this.messagesEl.appendChild(t)}addMessage(e,t,n,i,r){if(!this.messagesEl)return;const s=document.createElement("div");if(s.className=`dlc-msg ${e}`,e==="user")s.textContent=t;else if(s.innerHTML=j(t),r&&r.length>0&&r.some(a=>a.url&&a.url!=="/"&&a.url!=="#"&&a.title)){const a=document.createElement("div");a.className="dlc-nav-pills",r.forEach(h=>{const k=document.createElement("a");k.className="dlc-nav-pill",k.innerHTML=`${this.externalLinkSvg()} ${this.escapeHtml(h.title)}`,k.href="#",k.onclick=S=>{S.preventDefault(),window.dispatchEvent(new CustomEvent("dlc:navigate",{detail:{route:h.url}}))},a.appendChild(k)}),s.appendChild(a)}this.messagesEl.appendChild(s),this.messagesEl.scrollTop=this.messagesEl.scrollHeight}showTyping(){if(!this.messagesEl)return null;const e=document.createElement("div");return e.className="dlc-typing",e.innerHTML="<span></span><span></span><span></span>",this.messagesEl.appendChild(e),this.messagesEl.scrollTop=this.messagesEl.scrollHeight,e}hideTyping(e){e==null||e.remove()}buildWorkspaceContext(){try{const e=window.SaaS_User_Role||this.config.role,t=G({role:e,route:window.location.pathname});return{title:t.page_title,current_page:window.location.pathname,headings:t.headings.slice(0,10),buttons:t.buttons.slice(0,10),sections:t.sections.slice(0,5),forms:t.forms.slice(0,5),workflows:t.workflows.slice(0,5),instructional_text:t.instructional_text.slice(0,5),breadcrumbs:t.breadcrumbs,actions:t.actions.slice(0,10)}}catch{return{title:document.title,current_page:window.location.pathname,headings:Array.from(document.querySelectorAll("h1, h2, h3")).map(e=>{var t;return((t=e.textContent)==null?void 0:t.trim())||""}).filter(Boolean).slice(0,10),buttons:Array.from(document.querySelectorAll("button")).map(e=>{var t;return((t=e.textContent)==null?void 0:t.trim())||""}).filter(Boolean).slice(0,10)}}}async handleSend(){const e=this.inputEl,t=this.sendBtn;if(!e||!t)return;const n=e.value.trim();if(!n)return;e.value="",e.style.height="auto",this.addMessage("user",n),this.history.push({sender:"user",text:n}),t.disabled=!0;const i=this.showTyping();try{const r=this.buildWorkspaceContext(),s=window.SaaS_User_Role||this.config.role,l={message:n,session_id:q(),current_route:window.location.pathname,history:this.history.slice(-20).map(h=>({sender:h.sender,text:h.text})),role:s,workspace_context:r},a=await $(this.config.apiKey,this.config.baseUrl,l);this.hideTyping(i),this.addMessage("bot",a.message,a.route,a.route_name,a.navigations),this.history.push({sender:"bot",text:a.message,route:a.route,route_name:a.route_name,navigations:a.navigations})}catch{this.hideTyping(i),this.addMessage("bot","Sorry, something went wrong. Please try again.")}finally{t.disabled=!1}}}function L(){const o=g();if(!o){console.error("[Chatbot] Missing window.ChatbotConfig or apiKey");return}new X(o).mount(),window.addEventListener("dlc:navigate",t=>{var n;if((n=t.detail)!=null&&n.route){const i=t.detail.route;i.startsWith("http")?window.location.href=i:(window.history.pushState({},"",i),window.dispatchEvent(new PopStateEvent("popstate")))}})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",L):L()})();
