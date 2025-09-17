// 觀眾端：加入房間，接收控制端同步的 deck/idx 並顯示
import { COLORS } from './shared.js';

const form = document.getElementById('join-form');
const inputRoom = document.getElementById('room');
const setup = document.getElementById('setup');
const player = document.getElementById('player');
const progressEl = document.getElementById('progress');
const cardEl = document.getElementById('card');
const toast = document.getElementById('toast');

let socket;
let room='';
let deck=[]; 
let idx=-1;
let isReady = false;
let customColors = {};

function showToast(msg){ toast.textContent=msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'), 1500); }

function render(){
  cardEl.className = 'color-card';
  if (isReady) {
    cardEl.style.backgroundColor = '#000000';
    cardEl.style.color = '#ffffff';
    cardEl.textContent = 'READY?';
    progressEl.textContent = 'READY?';
  } else if (idx>=0 && idx<deck.length){
    const colorKey = deck[idx];
    const colorInfo = customColors[colorKey];
    if (colorInfo) {
      cardEl.style.backgroundColor = colorInfo.bgColor;
      cardEl.style.color = colorInfo.textColor;
      cardEl.textContent = colorInfo.name;
    }
    progressEl.textContent = `${idx+1} / ${deck.length}`;
  } else { 
    cardEl.textContent=''; 
    cardEl.style.backgroundColor = '';
    cardEl.style.color = '';
    progressEl.textContent=`0 / 0`; 
  }
}

form.addEventListener('submit', e => {
  e.preventDefault();
  room = inputRoom.value.trim();
  const base = location.origin.replace(/^http/, 'ws');
  socket = io(base, { path: '/ws/socket.io' });
  socket.emit('join', room);
  socket.on('joined', ()=>{ setup.classList.add('hidden'); player.classList.remove('hidden'); showToast(`已加入 ${room}`); });
  socket.on('state', s => { 
    deck = s.deck || []; 
    idx = s.idx ?? -1; 
    isReady = s.isReady || false;
    customColors = s.customColors || {};
    render(); 
  });
  socket.on('error-msg', msg => showToast(msg));
});


