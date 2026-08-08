const header=document.querySelector('.site-header');
const toggle=document.querySelector('.nav-toggle');
const nav=document.querySelector('.global-nav');
const setHeader=()=>{if(window.scrollY>20)header?.classList.add('scrolled');else if(!header?.classList.contains('solid'))header?.classList.remove('scrolled')};
setHeader();window.addEventListener('scroll',setHeader,{passive:true});
toggle?.addEventListener('click',()=>{const open=nav?.classList.toggle('open');toggle.setAttribute('aria-expanded',String(!!open))});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle?.setAttribute('aria-expanded','false')}));
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
