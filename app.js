'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let eventData;
const photos = [
  {src:'/gallery-1.jpg',alt:'Gullar bilan bezatilgan romantik to‘y marosimi'},
  {src:'/gallery-2.jpg',alt:'Bayramona dasturxon va nafis bezaklar'},
  {src:'/gallery-3.jpg',alt:'Unutilmas to‘y kunining go‘zal lahzalari'},
  {src:'/hero.jpg',alt:'Mehr va baxtga to‘la to‘y muhiti'}
];
let slide = 0, slideTimer;
function toast(message) {$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function safeRead(key) {try{return localStorage.getItem(key);}catch{return null;}}
function safeWrite(key,value) {try{localStorage.setItem(key,value);}catch{/* Private mode may disable storage. */}}
function showSlide(index,manual=false) {
  slide=(index+photos.length)%photos.length;
  const photo=photos[slide];
  $('#gallery-image').src=photo.src;$('#gallery-image').alt=photo.alt;
  $('#gallery-preview').src=photos[(slide+1)%photos.length].src;
  $('#slide-count').textContent=`0${slide+1} / 04`;
  $$('#slider-dots button').forEach((button,i)=>{button.classList.toggle('active',i===slide);button.setAttribute('aria-pressed',String(i===slide));});
  $('#lightbox-image').src=photo.src;$('#lightbox-image').alt=photo.alt;
  $('#lightbox-caption').textContent=`${photo.alt} · ${slide+1} / ${photos.length}`;
  if(manual) resetSlider();
}
function resetSlider() {clearInterval(slideTimer);if(!matchMedia('(prefers-reduced-motion: reduce)').matches) slideTimer=setInterval(()=>{if(!document.hidden&&!$$('dialog').some(d=>d.open))showSlide(slide+1);},6500);}
photos.forEach((photo,i)=>{const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',`${i+1}-surat`);button.addEventListener('click',()=>showSlide(i,true));$('#slider-dots').append(button);});
$('#prev-slide').addEventListener('click',()=>showSlide(slide-1,true));
$('#next-slide').addEventListener('click',()=>showSlide(slide+1,true));
$('#gallery-open').addEventListener('click',()=>{$('#image-dialog').showModal();});
$('.lightbox-prev').addEventListener('click',()=>showSlide(slide-1,true));
$('.lightbox-next').addEventListener('click',()=>showSlide(slide+1,true));
document.addEventListener('keydown',e=>{if($('#image-dialog').open){if(e.key==='ArrowLeft')showSlide(slide-1,true);if(e.key==='ArrowRight')showSlide(slide+1,true);}});
$$('dialog').forEach(dialog=>{dialog.querySelector('.modal-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});});
$('.modal-done').addEventListener('click',()=>$('#success-dialog').close());
$('.menu-btn').addEventListener('click',()=>{const open=$('.site-header nav').classList.toggle('open');$('.menu-btn').setAttribute('aria-expanded',String(open));$('.menu-btn').setAttribute('aria-label',open?'Menyuni yopish':'Menyuni ochish');$('.menu-btn').textContent=open?'×':'☰';});
$$('.site-header nav a').forEach(link=>link.addEventListener('click',()=>{$('.site-header nav').classList.remove('open');$('.menu-btn').setAttribute('aria-expanded','false');$('.menu-btn').textContent='☰';}));
const months=['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
function parts(date) {const values=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tashkent',day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(date);return Object.fromEntries(values.map(p=>[p.type,p.value]));}
function countdown() {
  const start=new Date(eventData.start).getTime(),end=new Date(eventData.end).getTime();
  const difference=Math.max(0,start-Date.now());
  const total=Math.floor(difference/1000);
  $('#days').textContent=String(Math.floor(total/86400)).padStart(2,'0');
  $('#hours').textContent=String(Math.floor(total/3600)%24).padStart(2,'0');
  $('#minutes').textContent=String(Math.floor(total/60)%60).padStart(2,'0');
  $('#seconds').textContent=String(total%60).padStart(2,'0');
  $('#countdown-status').textContent=Date.now()>=end?'Ushbu go‘zal kun xotiralarga aylandi.':Date.now()>=start?'Kutilgan oqshom boshlandi!':'';
}
async function loadEvent() {
  try {
    const response=await fetch('/api/event');if(!response.ok)throw new Error('Event request failed');eventData=await response.json();
    $$('[data-groom]').forEach(el=>el.textContent=eventData.groom);$$('[data-bride]').forEach(el=>el.textContent=eventData.bride);$$('[data-venue]').forEach(el=>el.textContent=eventData.venue);
    document.title=`${eventData.groom} & ${eventData.bride} — Visol oqshomi`;
    const start=new Date(eventData.start),p=parts(start),deadline=parts(new Date(eventData.rsvpDeadline));
    $('#hero-day').textContent=p.day;$('#hero-month').textContent=`${months[Number(p.month)-1].toUpperCase()}, ${p.year}`;
    const weekday=new Intl.DateTimeFormat('uz-UZ',{weekday:'long',timeZone:'Asia/Tashkent'}).format(start);
    $('#hero-weekday').textContent=`${weekday[0].toUpperCase()+weekday.slice(1)} · soat ${p.hour}:${p.minute}`;
    $('#closing-date').textContent=`${p.day} ${months[Number(p.month)-1].toUpperCase()} ${p.year} · TOSHKENT`;
    $('.round-seal span:last-child').textContent=`${p.day} · ${p.month.padStart(2,'0')} · ${p.year.slice(-2)}`;
    $('#rsvp-deadline').textContent=`${deadline.day}-${months[Number(deadline.month)-1]}`;
    $('#venue-address').textContent=eventData.address;$('#modal-address').textContent=eventData.address;$('#venue-note').textContent=eventData.venueNote;
    if(!eventData.demo){$('.demo-tag').hidden=true;$('.map-disclaimer').textContent=eventData.venueNote;}
    for(const item of eventData.schedule){const card=document.createElement('article');card.className='program-item';const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href',`#i-${item.icon}`);icon.append(use);const time=document.createElement('time');time.textContent=item.time;const title=document.createElement('h3');title.textContent=item.title;const description=document.createElement('p');description.textContent=item.description;card.append(icon,time,title,description);$('#schedule').append(card);}
    const guest=new URLSearchParams(location.search).get('guest');if(guest){const name=guest.trim().slice(0,80);$('#welcome').textContent=`Qadrli ${name}, hayotimizning eng go‘zal kuniga sizni taklif qilamiz.`;$('#guest-name').value=name;}
    if(Date.now()>new Date(eventData.rsvpDeadline).getTime()){$('#submit-rsvp').disabled=true;$('#form-status').textContent='Javob yuborish muddati tugadi.';}
    countdown();setInterval(countdown,1000);
  }catch{toast('Tadbir ma’lumotlari yuklanmadi. Sahifani yangilang.');$('#submit-rsvp').disabled=true;$('#form-status').textContent='Ulanish tiklangach, sahifani yangilang.';}
}
function openMap(){if(!eventData)return toast('Manzil yuklanmoqda, biroz kuting.');const query=encodeURIComponent(eventData.mapQuery);$('#map-frame').src=`https://www.google.com/maps?q=${query}&output=embed`;$('#directions').href=`https://www.google.com/maps/dir/?api=1&destination=${query}`;$('#map-dialog').showModal();}
$('#open-map').addEventListener('click',openMap);$('#open-map-card').addEventListener('click',openMap);
$$('input[name=attendance]').forEach(input=>input.addEventListener('change',()=>{$('#guest-count').disabled=input.value==='no';}));
$('#rsvp-form').addEventListener('submit',async e=>{
  e.preventDefault();if(!$('#rsvp-form').reportValidity())return;
  const form=new FormData(e.currentTarget),button=$('#submit-rsvp');
  const payload={name:form.get('name'),attendance:form.get('attendance'),count:Number(form.get('count')||1),note:form.get('note'),website:form.get('website'),token:safeRead('visol-rsvp-token')};
  button.disabled=true;button.textContent='Saqlanmoqda…';$('#form-status').textContent='';
  try{const response=await fetch('/api/rsvp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Javob saqlanmadi.');safeWrite('visol-rsvp-token',result.token);safeWrite('visol-rsvp-saved','1');$('#success-copy').textContent=payload.attendance==='yes'?'Siz bilan uchrashishni intiqlik bilan kutamiz. Javobingiz muvaffaqiyatli saqlandi.':'Samimiy javobingiz uchun rahmat. Ezgu tilaklaringiz biz uchun qadrli.';$('#success-dialog').showModal();$('#form-status').textContent='Javobingiz saqlandi. Xohlasangiz, qayta yuborib yangilashingiz mumkin.';$('#form-status').style.color='';}
  catch(error){$('#form-status').textContent=error.message==='Failed to fetch'?'Internet aloqasini tekshiring va qayta urinib ko‘ring.':error.message;}
  finally{button.disabled=false;button.innerHTML='Javobni yuborish <span>↗</span>';}
});
$('#share-invite').addEventListener('click',async()=>{const url=location.origin+location.pathname;try{if(navigator.share)await navigator.share({title:document.title,text:'Visol oqshomiga taklif qilamiz!',url});else{await navigator.clipboard.writeText(url);toast('Taklifnoma havolasi nusxalandi.');}}catch(error){if(error.name!=='AbortError'){toast('Havolani brauzer manzil satridan nusxalang.');}}});
// Original, synthesized piano-like ambient melody. No autoplay or third-party audio.
let audioContext,musicTimer,musicOn=false,nextNote=0;
const melody=[261.63,329.63,392,523.25,440,392,329.63,293.66,261.63,329.63,440,523.25,493.88,392,329.63,293.66];
function scheduleMusic(){if(!musicOn)return;while(nextNote<audioContext.currentTime+1.5){const step=Math.round(nextNote/0.6)%melody.length;const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.value=melody[step];gain.gain.setValueAtTime(0,nextNote);gain.gain.linearRampToValueAtTime(.07,nextNote+.025);gain.gain.exponentialRampToValueAtTime(.001,nextNote+2.1);osc.connect(gain);gain.connect(audioContext.destination);osc.start(nextNote);osc.stop(nextNote+2.2);nextNote+=.6;}}
$('#music-toggle').addEventListener('click',async()=>{try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();musicOn=!musicOn;if(musicOn){await audioContext.resume();nextNote=audioContext.currentTime+.1;scheduleMusic();musicTimer=setInterval(scheduleMusic,500);}else{clearInterval(musicTimer);await audioContext.suspend();}$('#music-toggle').setAttribute('aria-pressed',String(musicOn));$('#music-toggle').setAttribute('aria-label',musicOn?'Fon musiqasini o‘chirish':'Fon musiqasini yoqish');$('.music-state').textContent=musicOn?'ON':'OFF';}catch{toast('Ushbu brauzerda musiqa qo‘llab-quvvatlanmadi.');}});
document.addEventListener('visibilitychange',()=>{if(audioContext&&musicOn){if(document.hidden)audioContext.suspend();else audioContext.resume();}});
showSlide(0);resetSlider();loadEvent();
