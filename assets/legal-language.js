(() => {
 'use strict';
 let lang=new URLSearchParams(location.search).get('lang');
 if(!lang&&location.hash==='#espanol')lang='es';
 if(!lang&&location.hash==='#english')lang='en';
 if(!['en','es'].includes(lang)) {try{lang=localStorage.getItem('sc-language')}catch{}}
 lang=lang==='es'?'es':'en'; document.documentElement.lang=lang==='es'?'es-MX':'en';
 const terms=location.pathname.endsWith('terms.html');
 document.querySelectorAll('main section[lang]').forEach(el=>el.classList.toggle('legal-language-hidden',!el.lang.startsWith(lang)));
 document.querySelectorAll('.legal-language-switch a').forEach(a=>{if(a.lang===lang)a.setAttribute('aria-current','page');a.addEventListener('click',()=>{try{localStorage.setItem('sc-language',a.lang)}catch{}})});
 document.querySelector('h1').textContent=terms?(lang==='es'?'Contrato de arrendamiento':'Rental agreement'):(lang==='es'?'Aviso de privacidad':'Privacy notice');
 document.title=document.querySelector('h1').textContent+' | Sable’s Carts';
 if(lang==='es'){
   const labels={'Website':'Sitio web','Rental agreement':'Contrato de renta','Privacy notice':'Aviso de privacidad','Back to website / Volver al sitio':'Volver al sitio','Rental agreement / Contrato':'Contrato de renta','Download your copy / Descargar su copia':'Descargar tu copia','Privacy notice / Aviso de privacidad':'Aviso de privacidad'};
   document.querySelectorAll('.toolbar a,.foot a,.back span').forEach(a=>{const s=a.textContent.trim();if(labels[s])a.textContent=labels[s];else if(s==='Back to website')a.textContent='Volver al sitio'});
   document.querySelectorAll('.back').forEach(a=>a.setAttribute('aria-label','Volver al sitio'));
   const eyebrow=document.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent=eyebrow.textContent.replace('Rental agreement','Contrato de renta').replace('Privacy notice','Aviso de privacidad');
 }
 const intro=document.querySelector('.intro');if(intro&&intro.textContent.includes(' / '))intro.textContent=intro.textContent.split(' / ')[lang==='es'?1:0];
 document.querySelectorAll('a[href]').forEach(a=>{
   const u=new URL(a.href); if(u.origin!==location.origin)return;
   if(/\/(terms|privacy)\.html$/.test(u.pathname)&&!a.closest('.legal-language-switch')&&!['#english','#espanol'].includes(u.hash)){u.searchParams.set('lang',lang);a.href=u.href}
   if(/\/index\.html$/.test(u.pathname)&&lang==='es'){u.pathname=u.pathname.replace('index.html','es.html');a.href=u.href}
 });
})();