'use strict';
document.querySelectorAll('[data-print]').forEach(button=>button.addEventListener('click',()=>window.print()));
function revealAnchor(){
 const id=decodeURIComponent(location.hash.slice(1));if(!id)return;
 const target=document.getElementById(id);if(!target)return;
 for(let parent=target;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
 requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
}
window.addEventListener('hashchange',revealAnchor);revealAnchor();
