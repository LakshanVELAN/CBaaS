var ae=Object.defineProperty;var le=(k,w,A)=>w in k?ae(k,w,{enumerable:!0,configurable:!0,writable:!0,value:A}):k[w]=A;var E=(k,w,A)=>le(k,typeof w!="symbol"?w+"":w,A);(function(){"use strict";const k={botName:"Assistant",primaryColor:"#1a56db",position:"bottom-right",role:"guest",enablePageTraining:!1,suggestionChips:["What can I do here?"]};function w(){const n=window.ChatbotConfig;return!n||!n.apiKey?null:{...k,...n,baseUrl:n.baseUrl||""}}const A="dlc_session_id";function R(){let n=sessionStorage.getItem(A);return n||(n=crypto.randomUUID(),sessionStorage.setItem(A,n)),n}async function H(n,e,t,o=1){const i=`${e.replace(/\/+$/,"")}/api/v1/chat/message/`;try{const r=await fetch(i,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${n}`},body:JSON.stringify(t)});if(!r.ok){const s=await r.json().catch(()=>({error:"Request failed"}));throw new Error(s.error||`HTTP ${r.status}`)}return await r.json()}catch(r){if(o>0)return H(n,e,t,o-1);throw r}}const z={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"};function W(n){return n.replace(/[&<>"]/g,e=>z[e]||e)}function U(n){let e=W(n);return e=e.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*(.*?)\*/g,"<em>$1</em>"),e=e.replace(/`(.*?)`/g,"<code>$1</code>"),e=e.replace(/^[\-\*] (.+)$/gm,"<li>$1</li>"),e=e.replace(/((?:<li>.*<\/li>\n?)+)/g,"<ul>$1</ul>"),e=e.replace(/\n/g,"<br>"),e}const j=2e3,K=["footer","header","nav-","-nav","privacy","terms","cookie","newsletter","contact","legal","copyright","disclaimer","social-links","sidebar","advert","promo","banner-","utility","supplemental","modal-backdrop","cookie-consent"],F=["footer","header","nav","aside","style","script","noscript","iframe","canvas","svg"],D=["navigation","banner","contentinfo","complementary","alert","presentation"];function J(n){var s,c;const e=((s=n.tagName)==null?void 0:s.toLowerCase())||"",t=(n.className||"").toString().toLowerCase(),o=(n.id||"").toLowerCase(),i=(n.getAttribute("role")||"").toLowerCase();if(F.includes(e)||D.includes(i))return!0;for(const a of K)if(t.includes(a)||o.includes(a))return!0;if(!((c=n.textContent)!=null&&c.trim()))return!0;const r=n.getBoundingClientRect();if(r.width<10&&r.height<10){const a=y(n.textContent||"");if(!p(a))return!0}return!1}function u(n){if(!n||!(n instanceof Element)||J(n))return!1;const e=window.getComputedStyle(n);if(!e||e.display==="none"||e.visibility==="hidden"||e.opacity==="0"||parseFloat(e.opacity)===0)return!1;const t=n.getBoundingClientRect();if(!t)return!1;if(t.width<8&&t.height<8){const o=y(n.textContent||"");if(!p(o))return!1}return t.bottom>0&&t.right>0&&t.top<window.innerHeight&&t.left<window.innerWidth&&(t.width>0||t.height>0)}function y(n){return(n??"").toString().replace(/\u00A0/g," ").replace(/\s+/g," ").trim()}function v(n,e=j){const t=y(n);return t?t.length>e?t.slice(0,e):t:""}function p(n){const e=y(n);if(!e||e.length<2)return!1;const t=e.toLowerCase();return!(["icon","menu","more","more...","settings","filter","search","close","x","⋮","…","open","show","hide","toggle","expand","collapse","submit","cancel","reset","clear","refresh","reload"].includes(t)||/^[\s\W]*$/.test(e))}function x(n,e=200){const t=new Set,o=[];for(const i of n){const r=y(i);if(!p(r))continue;const s=r.toLowerCase();if(!t.has(s)&&(t.add(s),o.push(r),o.length>=e))break}return o}function G(n){if(!n)return"";const e=n.getAttribute("aria-label");if(e&&p(e))return e;const t=n.getAttribute("aria-labelledby");if(t){const r=t.split(/\s+/).filter(Boolean).map(s=>document.getElementById(s)).filter(Boolean).map(s=>y(s.textContent||"")).filter(Boolean).join(" ");if(r&&p(r))return r}if(n.id){const o=document.querySelector(`label[for="${n.id}"]`),i=o?y(o.textContent||""):"";if(i&&p(i))return i}return n.textContent||""}function h(n){if(!n)return"";const e=G(n);if(e)return v(e);const t=n.getAttribute("aria-label");if(t&&p(t))return v(t);const o=n.getAttribute("data-testid");return o&&p(o)?v(o):v(n.textContent||"")}function B(n){return y(n.textContent||"")}function V(n){if(!n)return[];const e=[];return n.querySelectorAll("th").forEach(o=>{if(!u(o))return;const i=h(o);i&&e.push(i)}),x(e,50)}function X(){const n=["step","first","second","third","next","then","after","click","fill","enter","select","save","submit","upload","create","edit","delete","confirm","complete","generate"],e=[],t=Array.from(document.querySelectorAll("ol li, ul li")).filter(i=>u(i));for(const i of t.slice(0,40)){const r=v(B(i),300);if(!r||r.length<10)continue;const s=r.toLowerCase();(n.some(a=>s.includes(a))||/^\d+\./.test(r))&&e.push(r)}const o=Array.from(document.querySelectorAll('h2, h3, [role="heading"]')).filter(i=>u(i)).map(i=>h(i)).filter(i=>{const r=i.toLowerCase();return/step\s*\d/.test(r)||/phase\s*\d/.test(r)});return e.push(...o.slice(0,10)),x(e,25)}function Y(){const n=[],e=Array.from(document.querySelectorAll('section, [role="region"], .card, .panel, .form-section')).filter(t=>u(t));for(const t of e.slice(0,30)){const o=t.querySelector('h1,h2,h3,h4,[role="heading"],legend,.card-title,.section-title');if(!o||!u(o))continue;const i=h(o);if(!i||i.length<3)continue;const r=Array.from(t.querySelectorAll('button, [role="button"], a.btn')).filter(u).map(h).filter(c=>c&&c.length>2),s=Array.from(t.querySelectorAll('form, [role="form"]')).filter(u).map(c=>{const a=c.querySelector("h1,h2,h3,legend,.form-title");return h(a||c)}).filter(c=>c&&c.length>2);n.push({title:i,buttons:x(r,10),forms:x(s,8)})}return n.slice(0,20)}function Q(){const n=["click","select","fill","enter","choose","upload","save","submit","required","optional","note:","hint:","first","then","next","after","finally","step"],e=Array.from(document.querySelectorAll(".help-text, .hint, .instruction, .form-text, .alert-info, p, li, .step-description, .tooltip-content, .workflow-desc")).filter(u),t=[];for(const o of e.slice(0,80)){const i=v(B(o),400);if(!i||i.length<15)continue;const r=i.toLowerCase(),s=n.some(a=>r.includes(a)),c=i.length<200;(s||c)&&t.push(i)}return x(t,25)}function Z(){const n=['[aria-label="breadcrumb"]','nav[aria-label="breadcrumb"]',".breadcrumb",'[role="navigation"][aria-label*="breadcrumb" i]',"ol.breadcrumb"];let e=null;for(const o of n){const i=document.querySelector(o);if(i&&u(i)){e=i;break}}if(!e)return[];const t=Array.from(e.querySelectorAll("a, span, li")).map(o=>h(o)).filter(o=>p(o));return x(t,10)}function M(n,e){for(const t of e){let o=n.parentElement;for(;o&&o!==document.body;){const i=o.querySelector('h1,h2,h3,h4,[role="heading"]');if(i&&h(i)===t.title)return t.title;o=o.parentElement}}return null}function P(n={}){var _;const e=n.route??window.location.pathname,t=y(document.title)||"Untitled Page",o=n.role??null,i=Y(),r=X(),s=Array.from(document.querySelectorAll('button:not([type="hidden"]):not([type="reset"]), [role="button"]:not(.sr-only), input[type="submit"], a.btn-primary, a.btn-success, button[type="submit"], .btn-primary:not(.footer-btn)')).filter(u),c=[];for(const l of s.slice(0,50)){const d=h(l);!d||d.length<2||!p(d)||c.push({label:d,section:M(l,i),tagName:((_=l.tagName)==null?void 0:_.toLowerCase())||"button"})}const a=Array.from(document.querySelectorAll('form:not([hidden]), [role="form"]')).filter(u),g=[];for(const l of a.slice(0,10)){const d=l.querySelector('h1,h2,h3,legend,[role="heading"],.card-title,.form-title'),C=d&&u(d)?h(d):null,m=M(l,i);C&&g.push({label:v(C,160),section:m});const L=l.querySelectorAll('input:not([type="hidden"]), textarea, select');for(const b of Array.from(L).slice(0,15)){if(!u(b))continue;const q=b.getAttribute("aria-label")||b.getAttribute("placeholder")||b.getAttribute("name")||b.getAttribute("title");q&&p(q)&&q.length<100&&g.push({label:q,section:m,fieldType:b.getAttribute("type")||b.tagName.toLowerCase()})}}const f=Array.from(document.querySelectorAll('h1, h2, h3, h4, [role="heading"]')).filter(u),S=[];for(const l of f.slice(0,30)){const d=h(l);d&&p(d)&&S.push({text:d,level:parseInt(l.tagName.substring(1))||2,section:M(l,i)})}const N=Array.from(document.querySelectorAll("table:not([hidden])")).filter(u),T=[];for(const l of N.slice(0,10)){const d=V(l);d.length&&T.push(...d)}const $=Q();return{page_title:t,route:e,role:o,sections:i.map(l=>({title:l.title,buttons:l.buttons.slice(0,10),forms:l.forms.slice(0,8)})),actions:c.map(l=>({label:l.label,section:l.section,type:l.tagName||"button"})),buttons:c.map(l=>l.label).slice(0,50),headings:S.map(l=>l.text).slice(0,30),heading_details:S.slice(0,30),tables:x(T,50),forms:x(g.map(l=>l.label),30),form_details:g.slice(0,30),workflows:r.map(l=>({text:l,type:"sequential"})),workflow_steps:r.slice(0,20),instructional_text:$.slice(0,25),breadcrumbs:Z()}}class ee{constructor(e){E(this,"config");E(this,"panel",null);E(this,"messagesEl",null);E(this,"inputEl",null);E(this,"isOpen",!1);E(this,"history",[]);E(this,"sendBtn",null);this.config=e}mount(){this.injectStyles(),this.createFAB()}injectStyles(){const e=document.createElement("style");e.textContent=`
      [data-dlc] { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      [data-dlc] * { box-sizing: border-box; }
      .dlc-fab {
        position: fixed;
        ${this.config.position==="bottom-left"?"left: 20px":"right: 20px"};
        bottom: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: ${this.config.primaryColor};
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .dlc-fab:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
      .dlc-panel {
        position: fixed;
        ${this.config.position==="bottom-left"?"left: 20px":"right: 20px"};
        bottom: 84px;
        width: 380px;
        height: 580px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 2147483646;
        font-size: 14px;
        color: #333;
      }
      .dlc-panel.open { display: flex; }
      .dlc-header {
        background: ${this.config.primaryColor};
        color: white;
        padding: 16px;
        font-weight: 600;
        font-size: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .dlc-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .dlc-msg {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        line-height: 1.5;
        word-wrap: break-word;
      }
      .dlc-msg.user {
        align-self: flex-end;
        background: ${this.config.primaryColor};
        color: white;
        border-bottom-right-radius: 4px;
      }
      .dlc-msg.bot {
        align-self: flex-start;
        background: #f3f4f6;
        color: #333;
        border-bottom-left-radius: 4px;
      }
      .dlc-msg.bot strong { font-weight: 600; }
      .dlc-msg.bot code {
        background: #e5e7eb;
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 13px;
      }
      .dlc-msg.bot ul, .dlc-msg.bot ol {
        margin: 8px 0;
        padding-left: 20px;
      }
      .dlc-msg.bot li { margin-bottom: 4px; }
      .dlc-input-area {
        padding: 12px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
        align-items: flex-end;
      }
      .dlc-input {
        flex: 1;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 14px;
        resize: none;
        outline: none;
        font-family: inherit;
        min-height: 40px;
        max-height: 120px;
      }
      .dlc-input:focus { border-color: ${this.config.primaryColor}; }
      .dlc-send {
        background: ${this.config.primaryColor};
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 16px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
      }
      .dlc-send:disabled { opacity: 0.5; cursor: not-allowed; }
      .dlc-typing {
        display: flex;
        gap: 4px;
        padding: 10px 14px;
        align-self: flex-start;
      }
      .dlc-typing span {
        width: 8px; height: 8px;
        background: #9ca3af;
        border-radius: 50%;
        animation: dlc-bounce 1.4s infinite ease-in-out both;
      }
      .dlc-typing span:nth-child(1) { animation-delay: -0.32s; }
      .dlc-typing span:nth-child(2) { animation-delay: -0.16s; }
      @keyframes dlc-bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
      .dlc-route-pill {
        display: inline-block;
        margin-top: 8px;
        padding: 6px 14px;
        background: white;
        color: ${this.config.primaryColor};
        border: 1px solid ${this.config.primaryColor};
        border-radius: 99px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        transition: background 0.15s, color 0.15s;
      }
      .dlc-route-pill:hover {
        background: ${this.config.primaryColor};
        color: white;
      }
      .dlc-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 10px;
      }
      .dlc-chip {
        padding: 8px 14px;
        background: white;
        color: #333;
        border: 1px solid #dadce0;
        border-radius: 8px;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
      }
      .dlc-chip:hover { background: #f1f3f4; border-color: #dadce0; }
      .dlc-welcome-title {
        font-size: 20px;
        font-weight: 400;
        color: #1f1f1f;
        margin-bottom: 8px;
      }
      .dlc-welcome-desc {
        font-size: 14px;
        color: #5f6368;
        margin-bottom: 16px;
        line-height: 1.4;
      }
      @media (max-width: 600px) {
        .dlc-panel {
          width: 100vw;
          height: 100vh;
          bottom: 0;
          left: 0;
          right: 0;
          border-radius: 0;
        }
      }
    `,document.head.appendChild(e)}createFAB(){const e=document.createElement("button");e.setAttribute("data-dlc",""),e.className="dlc-fab",e.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',e.onclick=()=>this.toggle(),document.body.appendChild(e)}toggle(){this.isOpen=!this.isOpen,this.isOpen?(this.createPanel(),this.panel.classList.add("open")):this.panel&&this.panel.classList.remove("open")}createPanel(){if(this.panel)return;const e=document.createElement("div");e.setAttribute("data-dlc",""),e.className="dlc-panel";const t=document.createElement("div");t.className="dlc-header",t.textContent=this.config.botName;const o=document.createElement("div");o.className="dlc-messages";const i=document.createElement("div");i.className="dlc-input-area";const r=document.createElement("textarea");r.className="dlc-input",r.placeholder="Type a message...",r.rows=1,r.addEventListener("keydown",c=>{c.key==="Enter"&&!c.shiftKey&&(c.preventDefault(),this.handleSend())}),r.addEventListener("input",()=>{r.style.height="auto",r.style.height=Math.min(r.scrollHeight,120)+"px"});const s=document.createElement("button");s.className="dlc-send",s.textContent="Send",s.onclick=()=>this.handleSend(),i.appendChild(r),i.appendChild(s),e.appendChild(t),e.appendChild(o),e.appendChild(i),document.body.appendChild(e),this.panel=e,this.messagesEl=o,this.inputEl=r,this.sendBtn=s,this.showWelcome()}showWelcome(){if(!this.messagesEl)return;const e=this.config.welcomeMessage||`Hi! I'm ${this.config.botName}. How can I help you today?`,t=document.createElement("div");t.style.cssText="display: flex; flex-direction: column; justify-content: center; gap: 12px; padding: 20px 0;";const o=document.createElement("div");o.className="dlc-welcome-title",o.innerHTML=`<span style="background: linear-gradient(90deg, #4285F4, #9b51e0, #ea4335); -webkit-background-clip: text; -webkit-text-fill: transparent; font-weight: 500;">Hello!</span><br/>${e}`;const i=document.createElement("div");i.className="dlc-welcome-desc",i.textContent="Ask about features, navigation, or anything on this site.",t.appendChild(o),t.appendChild(i);const r=this.config.suggestionChips||["What can I do here?"];if(r.length>0){const s=document.createElement("div");s.className="dlc-chips",r.forEach(c=>{const a=document.createElement("div");a.className="dlc-chip",a.textContent=c,a.onclick=()=>{this.inputEl.value=c,this.handleSend()},s.appendChild(a)}),t.appendChild(s)}this.messagesEl.appendChild(t)}addMessage(e,t,o,i,r){if(!this.messagesEl)return;const s=document.createElement("div");if(s.className=`dlc-msg ${e}`,s.innerHTML=U(t),e==="bot"){const c=r&&r.length>0?r:o?[{url:o,title:i||"Open Page"}]:[];if(c.length>0){const a=document.createElement("div");a.style.cssText="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;",c.forEach(g=>{const f=document.createElement("a");f.className="dlc-route-pill",f.textContent=`→ ${g.title}`,f.href="#",f.onclick=S=>{S.preventDefault(),window.dispatchEvent(new CustomEvent("dlc:navigate",{detail:{route:g.url}}))},a.appendChild(f)}),s.appendChild(a)}}this.messagesEl.appendChild(s),this.messagesEl.scrollTop=this.messagesEl.scrollHeight}showTyping(){if(!this.messagesEl)return;const e=document.createElement("div");return e.className="dlc-typing",e.innerHTML="<span></span><span></span><span></span>",this.messagesEl.appendChild(e),this.messagesEl.scrollTop=this.messagesEl.scrollHeight,e}hideTyping(e){e==null||e.remove()}buildWorkspaceContext(){try{const e=window.SaaS_User_Role||this.config.role,t=P({role:e,route:window.location.pathname});return{title:t.page_title,current_page:window.location.pathname,headings:t.headings.slice(0,10),buttons:t.buttons.slice(0,10),sections:t.sections.slice(0,5),forms:t.forms.slice(0,5),workflows:t.workflows.slice(0,5),instructional_text:t.instructional_text.slice(0,5),breadcrumbs:t.breadcrumbs,actions:t.actions.slice(0,10)}}catch{return{title:document.title,current_page:window.location.pathname,headings:Array.from(document.querySelectorAll("h1, h2, h3")).map(e=>{var t;return((t=e.textContent)==null?void 0:t.trim())||""}).filter(Boolean).slice(0,10),buttons:Array.from(document.querySelectorAll("button")).map(e=>{var t;return((t=e.textContent)==null?void 0:t.trim())||""}).filter(Boolean).slice(0,10)}}}async handleSend(){const e=this.inputEl,t=this.sendBtn;if(!e||!t)return;const o=e.value.trim();if(!o)return;e.value="",e.style.height="auto",this.addMessage("user",o),this.history.push({sender:"user",text:o}),t.disabled=!0;const i=this.showTyping();try{const r=this.buildWorkspaceContext(),s=window.SaaS_User_Role||this.config.role,c={message:o,session_id:R(),current_route:window.location.pathname,history:this.history.slice(-20).map(g=>({sender:g.sender,text:g.text})),role:s,workspace_context:r},a=await H(this.config.apiKey,this.config.baseUrl,c);this.hideTyping(i),this.addMessage("bot",a.message,a.route,a.route_name,a.navigations),this.history.push({sender:"bot",text:a.message,route:a.route,route_name:a.route_name,navigations:a.navigations})}catch{this.hideTyping(i),this.addMessage("bot","Sorry, something went wrong. Please try again.")}finally{t.disabled=!1}}}function te(n){const e=new WeakSet;return JSON.stringify(n,(t,o)=>{if(o&&typeof o=="object"){if(e.has(o))return;if(e.add(o),!Array.isArray(o))return Object.keys(o).sort().reduce((i,r)=>(i[r]=o[r],i),{})}return o})}function ne(n,e=500){let t=null;return(...o)=>{t&&clearTimeout(t),t=setTimeout(()=>n(...o),e)}}async function oe(n){const e=new TextEncoder().encode(n),t=await crypto.subtle.digest("SHA-256",e);return Array.from(new Uint8Array(t)).map(o=>o.toString(16).padStart(2,"0")).join("")}async function re(n){const{role:e,route:t,apiKey:o,baseUrl:i}=n,r=P({role:e,route:t}),s={page_title:r.page_title,route:r.route,breadcrumbs:r.breadcrumbs,sections:r.sections,actions:r.actions,buttons:r.buttons,tables:r.tables,forms:r.forms,workflow_steps:r.workflow_steps,instructional_text:r.instructional_text},c={route:r.route,role:e??"guest",page_knowledge:s};try{const a=`${i.replace(/\/+$/,"")}/api/v1/chat/train-page-widget/`;await fetch(a,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:JSON.stringify(c)})}catch(a){console.error("[Chatbot] Page training failed:",a)}}async function ie(n){const{role:e,route:t}=n,o=P({role:e,route:t}),i={route:o.route,role:e,page_title:o.page_title,actions:o.actions,buttons:o.buttons,forms:o.forms,instructional_text:o.instructional_text,breadcrumbs:o.breadcrumbs,tables:o.tables},r=te(i);return oe(r)}function se(n){const{role:e,apiKey:t,baseUrl:o,debounceMs:i=700,minTrainingIntervalMs:r=2500}=n;let s={fingerprint:"",at:0},c=!1,a=window.location.pathname;const f=ne(async l=>{if(!c&&l){c=!0;try{const d=Date.now();if(d-(s.at||0)<r)return;const C=window.SaaS_User_Role||e,m=await ie({role:C,route:l}),L=`dl_page_train_fp:${C}:${l}`,b=sessionStorage.getItem(L);if(b&&b===m){s={fingerprint:m,at:d};return}await re({role:C,route:l,apiKey:t,baseUrl:o}),sessionStorage.setItem(L,m),s={fingerprint:m,at:d}}catch(d){console.error("[Chatbot] Training error:",d)}finally{c=!1}}},i),S=window.location.pathname;a=S,f(S);const N=new MutationObserver(()=>{const l=window.location.pathname;l!==a&&(a=l),f(a)});N.observe(document.body,{childList:!0,subtree:!0});const T=()=>{const l=window.location.pathname;a=l,f(l)};window.addEventListener("popstate",T);const $=history.pushState,I=history.replaceState,_=l=>function(...d){const C=l.apply(this,d),m=window.location.pathname;return a=m,f(m),C};return history.pushState=_($),history.replaceState=_(I),()=>{N.disconnect(),window.removeEventListener("popstate",T),history.pushState=$,history.replaceState=I}}function O(){const n=w();if(!n){console.error("[Chatbot] Missing window.ChatbotConfig or apiKey");return}new ee(n).mount(),n.enablePageTraining!==!1&&se({role:n.role,apiKey:n.apiKey,baseUrl:n.baseUrl}),window.addEventListener("dlc:navigate",t=>{var o;if((o=t.detail)!=null&&o.route){const i=t.detail.route;i.startsWith("http")?window.location.href=i:(window.history.pushState({},"",i),window.dispatchEvent(new PopStateEvent("popstate")))}})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",O):O()})();
