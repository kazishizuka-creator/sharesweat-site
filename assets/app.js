/* ============================================================
   SHARESWEAT — shared script (assets/app.js)
   ヘッダーのメニュー開閉 / スクロール出現演出 / 言語切替(JA-EN)
   ============================================================ */
(function(){
  // --- mobile menu ---
  function bindMenu(){
    var btn=document.querySelector('.menu-btn');
    var nav=document.querySelector('.nav');
    if(btn&&nav){btn.addEventListener('click',function(){nav.classList.toggle('open');});}
  }

  // --- reveal on scroll ---
  function bindReveal(){
    var els=document.querySelectorAll('.reveal');
    if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in');});return;}
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}});
    },{threshold:.15});
    els.forEach(function(e){io.observe(e);});
  }

  // --- language: auto-detect on first visit, remember choice ---
  function applyLang(lang){
    if(lang==='en'){document.body.classList.add('lang-en');}
    else{document.body.classList.remove('lang-en');}
    var btns=document.querySelectorAll('.lang');
    btns.forEach(function(btn){btn.textContent=(lang==='en')?'JA / 日本語':'EN / 日本語';});
    try{window.localStorage.setItem('ss_lang',lang);}catch(e){}
  }
  function initLang(){
    var saved=null;
    try{saved=window.localStorage.getItem('ss_lang');}catch(e){}
    var lang=saved;
    if(!lang){
      var nav=(navigator.language||navigator.userLanguage||'en').toLowerCase();
      lang=nav.indexOf('ja')===0?'ja':'en';
    }
    applyLang(lang);
    var btns=document.querySelectorAll('.lang');
    btns.forEach(function(btn){
      btn.addEventListener('click',function(){
        var cur=document.body.classList.contains('lang-en')?'en':'ja';
        applyLang(cur==='en'?'ja':'en');
      });
    });
  }

  document.addEventListener('DOMContentLoaded',function(){
    bindMenu();bindReveal();initLang();
  });
})();
