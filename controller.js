// 控制端：建立/重抽牌組、切換上一張/下一張，並同步到房間
import { COLORS, makeDeck, ensureFeasibleTotal } from './shared.js';

const form = document.getElementById('form');
const setup = document.getElementById('setup');
const inputRoom = document.getElementById('room');
const inputTotal = document.getElementById('total');
const player = document.getElementById('player');
const progressEl = document.getElementById('progress');
const cardEl = document.getElementById('card');
const btnReshuffle = document.getElementById('btn-reshuffle');
const btnConfig = document.getElementById('btn-config');
const btnReshufflePlay = document.getElementById('btn-reshuffle-play');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const toast = document.getElementById('toast');

let socket;
let room = '';
let mode = 2;
let deck = [];
let idx = -1;
let total = 0;

function showToast(msg){ toast.textContent=msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'), 1500); }

function connect(){
  if (socket) socket.disconnect();
  const base = location.origin.replace(/^http/, 'ws');
  socket = io(base, { path: '/ws/socket.io' });
  socket.on('connect', ()=> showToast('已連線'));
  socket.on('joined', ()=> showToast(`加入房號 ${room}`));
  socket.on('error-msg', msg => showToast(msg));
}

function render(){
  cardEl.className = 'color-card';
  if (idx>=0 && idx<deck.length){
    const c = deck[idx];
    cardEl.classList.add(COLORS[c].className);
    cardEl.textContent = COLORS[c].label;
    progressEl.textContent = `${idx+1} / ${deck.length}`;
  } else {
    cardEl.textContent = '';
    progressEl.textContent = `0 / ${deck.length}`;
  }
  btnPrev.disabled = idx<=0;
  btnNext.disabled = idx>=deck.length-1 || deck.length===0;
}

function emitState(){
  socket.emit('state', { room, deck, idx });
}

form.addEventListener('submit', e => {
  e.preventDefault();
  room = inputRoom.value.trim();
  mode = parseInt(new FormData(form).get('mode'),10)===3?3:2;
  total = ensureFeasibleTotal(Math.max(1, parseInt(inputTotal.value,10)||0), mode);

  connect();
  socket.emit('join', room);

  deck = makeDeck(total, mode);
  idx = 0;
  setup.classList.add('hidden');
  player.classList.remove('hidden');
  btnReshuffle.disabled = false;
  render();
  emitState();
});

btnReshuffle.addEventListener('click', ()=>{
  if (!room) return; deck = makeDeck(total, mode); idx = 0; render(); emitState();
});
btnPrev.addEventListener('click', ()=>{ if(idx>0){ idx--; render(); emitState(); }});
btnNext.addEventListener('click', ()=>{ if(idx<deck.length-1){ idx++; render(); emitState(); }});

// 播放狀態下也能重抽
btnReshufflePlay?.addEventListener('click', ()=>{
  if (!room) return; deck = makeDeck(total, mode); idx = 0; render(); emitState();
});

// 返回重新設定
btnConfig?.addEventListener('click', ()=>{
  player.classList.add('hidden');
  setup.classList.remove('hidden');
});


