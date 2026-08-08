const body=document.body;
const opening=document.getElementById('opening');
if(opening){
  if(sessionStorage.getItem('pigna-opening-seen')){opening.remove();}
  else{body.classList.add('is-opening');setTimeout(()=>{opening.classList.add('is-hidden');body.classList.remove('is-opening');sessionStorage.setItem('pigna-opening-seen','1');setTimeout(()=>opening.remove(),950)},2200)}
}
const header=document.querySelector('.site-header');
const toggle=document.querySelector('.nav-toggle');
const nav=document.querySelector('.global-nav');
const updateHeader=()=>header?.classList.toggle('scrolled',scrollY>30);updateHeader();addEventListener('scroll',updateHeader,{passive:true});
if(toggle&&nav){toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!open));nav.classList.toggle('open',!open);body.classList.toggle('nav-open',!open)});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{toggle.setAttribute('aria-expanded','false');nav.classList.remove('open');body.classList.remove('nav-open')}))}
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.10,rootMargin:'0px 0px -5%'});document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
const topBtn=document.querySelector('.to-top');if(topBtn){addEventListener('scroll',()=>topBtn.classList.toggle('show',scrollY>700),{passive:true});topBtn.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}))}
const jumpLinks=[...document.querySelectorAll('.menu-jump a')];if(jumpLinks.length){const map=new Map(jumpLinks.map(a=>[a.getAttribute('href').slice(1),a]));const sections=[...map.keys()].map(id=>document.getElementById(id)).filter(Boolean);const spy=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){jumpLinks.forEach(a=>a.classList.remove('active'));map.get(e.target.id)?.classList.add('active')}})},{rootMargin:'-25% 0px -65%',threshold:0});sections.forEach(s=>spy.observe(s))}
