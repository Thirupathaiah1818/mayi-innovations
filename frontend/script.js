// HERO SLIDER
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
let currentSlide = 0;

function showSlide(index){
    slides.forEach((s,i)=>s.classList.toggle('active', i===index));
    dots.forEach((d,i)=>d.classList.toggle('active', i===index));
    currentSlide = index;
}

dots.forEach(dot=>{
    dot.addEventListener('click', ()=>showSlide(parseInt(dot.dataset.go)));
});

setInterval(()=>showSlide((currentSlide+1)%slides.length), 5000);

// MENU TOGGLE
const menuToggle = document.querySelector('.menu-toggle');
const navUl = document.querySelector('nav ul');
menuToggle.addEventListener('click', ()=>navUl.classList.toggle('show'));

// SCROLL REVEAL
const revealElems = document.querySelectorAll('.reveal');
function revealOnScroll(){
    revealElems.forEach(elem=>{
        const top = elem.getBoundingClientRect().top;
        if(top < window.innerHeight - 80) elem.classList.add('show');
    });
}
window.addEventListener('scroll', revealOnScroll);
revealOnScroll();

// PROJECTS REEL AUTO SCROLL
const reel = document.querySelector('.reel');
let reelScroll = 0;
setInterval(()=>{
    reelScroll += 2;
    if(reelScroll > reel.scrollWidth - reel.clientWidth) reelScroll = 0;
    reel.scrollLeft = reelScroll;
}, 40);
