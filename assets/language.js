(() => {
 'use strict';
 const es = document.documentElement.lang.startsWith('es');
 document.querySelectorAll('.language-switch a').forEach(a => {
   const url = new URL(a.href), query = new URLSearchParams(location.search);
   query.delete('lang'); url.search=query.toString(); url.hash=location.hash; a.href=url.href;
   a.addEventListener('click',()=>{try{localStorage.setItem('sc-language',a.lang.startsWith('es')?'es':'en')}catch{}});
 });
 try {
   if(!es && /\/(?:index.html)?$/.test(location.pathname) && localStorage.getItem('sc-language')==='es') {
     const u=new URL('es.html',location.href);u.search=location.search;u.hash=location.hash;location.replace(u.href);
   }
 } catch {}
})();