/*! @ryanmorr/voodoo v0.1.1 | https://github.com/ryanmorr/voodoo */
function t(t){t="string"==typeof t?t:function(t){const n=t.toString();return n.substring(n.indexOf("{")+1,n.lastIndexOf("}"))}(t);const n=new Function(`\n        with (this) {\n            ${t}\n        }\n    `);return(t,e)=>{const r={deleteProperty:(t,n)=>{const r=t[n];return t[n]=void 0,e&&e.delete&&e.delete(n,r),!0}};e&&(e.get&&(r.get=(t,n)=>{const r=t[n];return n!==Symbol.unscopables&&e.get(n,r),r}),e.set&&(r.set=(t,n,r)=>{const o=t[n];return t[n]=r,e.set(n,r,o),!0}));const o=new Proxy(t,r);return n.call(o),o}}export{t as default};