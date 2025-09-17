// 控制端：建立/重抽牌組、切換上一張/下一張，並同步到房間
import { COLORS, makeDeck, ensureFeasibleTotal, AVAILABLE_COLORS } from './shared.js';

const form = document.getElementById('form');
const setup = document.getElementById('setup');
const inputRoom = document.getElementById('room');
const inputBallCount = document.getElementById('ballCount');
const inputColorCount = document.getElementById('colorCount');
const colorInputs = document.getElementById('colorInputs');
const player = document.getElementById('player');
const progressEl = document.getElementById('progress');
const cardEl = document.getElementById('card');
const btnReshuffle = document.getElementById('btn-reshuffle');
const btnConfig = document.getElementById('btn-config');
const btnReshufflePlay = document.getElementById('btn-reshuffle-play');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnReady = document.getElementById('btn-ready');
const toast = document.getElementById('toast');

let socket;
let room = '';
let customColors = {};
let deck = [];
let idx = -1;
let ballCount = 0;
let isReady = false;

function showToast(msg){ toast.textContent=msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'), 1500); }

function generateColorInputs(count) {
  colorInputs.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const div = document.createElement('div');
    div.className = 'color-input-row';
    div.innerHTML = `
      <label for="color${i}">顏色 ${i + 1}</label>
      <input id="color${i}" name="color${i}" type="text" required placeholder="例如: 紅色" />
    `;
    colorInputs.appendChild(div);
  }
}

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
  if (isReady) {
    cardEl.style.backgroundColor = '#000000';
    cardEl.style.color = '#ffffff';
    cardEl.textContent = 'READY?';
    progressEl.textContent = 'READY?';
    btnNext.disabled = false; // READY? 狀態下啟用下一張按鈕
    btnReady.disabled = false; // READY? 狀態下也可以按 READY? 按鈕
  } else if (idx>=0 && idx<deck.length){
    const colorKey = deck[idx];
    const colorInfo = customColors[colorKey];
    if (colorInfo) {
      cardEl.style.backgroundColor = colorInfo.bgColor;
      cardEl.style.color = colorInfo.textColor;
      cardEl.textContent = colorInfo.name;
    }
    progressEl.textContent = `${idx+1} / ${deck.length}`;
    btnNext.disabled = idx >= deck.length - 1; // 最後一個顏色時禁用下一張
    btnReady.disabled = false; // 顯示顏色時可以按 READY?
  } else {
    cardEl.textContent = '';
    cardEl.style.backgroundColor = '';
    cardEl.style.color = '';
    progressEl.textContent = `0 / ${deck.length}`;
    btnNext.disabled = true;
    btnReady.disabled = true;
  }
  btnPrev.disabled = idx <= 0;
}

function emitState(){
  socket.emit('state', { room, deck, idx, isReady, customColors });
}

form.addEventListener('submit', e => {
  e.preventDefault();
  room = inputRoom.value.trim();
  
  // 獲取球數量和顏色數量
  ballCount = parseInt(inputBallCount.value, 10) || 2;
  const colorCount = parseInt(inputColorCount.value, 10) || 1;
  
  if (ballCount < 1) {
    showToast('球數量必須至少為 1');
    return;
  }
  
  if (colorCount < 1 || colorCount > 6) {
    showToast('顏色數量必須在 1-6 之間');
    return;
  }
  
  // 獲取自定義顏色
  customColors = {};
  const colorKeys = [];
  for (let i = 0; i < colorCount; i++) {
    const colorName = document.getElementById(`color${i}`).value.trim();
    if (!colorName) {
      showToast(`請輸入顏色 ${i + 1} 的名稱`);
      return;
    }
    const colorKey = `color${i}`;
    colorKeys.push(colorKey);
    const bgColor = getColorByName(colorName);
    customColors[colorKey] = {
      name: colorName,
      bgColor: bgColor,
      textColor: bgColor === '#ffffff' || bgColor === '#f59e0b' ? '#000000' : '#ffffff'
    };
  }

  connect();
  socket.emit('join', room);

  deck = makeDeck(ballCount, colorKeys);
  idx = -1; // 初始狀態為 READY?
  isReady = true; // 遊戲開始時顯示 READY?
  setup.classList.add('hidden');
  player.classList.remove('hidden');
  btnReshuffle.disabled = false;
  render();
  emitState();
});

// 根據顏色名稱生成對應的顏色
function getColorByName(colorName) {
  const colorMap = {
    '紅色': '#ff4d4f', 'red': '#ff4d4f',
    '藍色': '#3f8cff', 'blue': '#3f8cff',
    '綠色': '#22c55e', 'green': '#22c55e',
    '黃色': '#f59e0b', 'yellow': '#f59e0b',
    '紫色': '#8b5cf6', 'purple': '#8b5cf6',
    '橙色': '#ff6b35', 'orange': '#ff6b35',
    '粉色': '#ec4899', 'pink': '#ec4899',
    '青色': '#06b6d4', 'cyan': '#06b6d4',
    '棕色': '#a3a3a3', 'brown': '#a3a3a3',
    '黑色': '#000000', 'black': '#000000',
    '白色': '#ffffff', 'white': '#ffffff'
  };
  
  // 先嘗試完全匹配
  if (colorMap[colorName.toLowerCase()]) {
    return colorMap[colorName.toLowerCase()];
  }
  
  // 嘗試部分匹配
  const lowerName = colorName.toLowerCase();
  for (const [key, value] of Object.entries(colorMap)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return value;
    }
  }
  
  // 如果沒有匹配，返回隨機顏色
  const randomColors = [
    '#ff4d4f', '#3f8cff', '#22c55e', '#ff6b35', '#8b5cf6', '#f59e0b',
    '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#a855f7', '#eab308'
  ];
  return randomColors[Math.floor(Math.random() * randomColors.length)];
}

// 監聽顏色數量變化
inputColorCount.addEventListener('input', (e) => {
  const count = parseInt(e.target.value, 10) || 0;
  if (count >= 1 && count <= 6) {
    generateColorInputs(count);
  }
});

// 初始化時生成預設的顏色輸入框
generateColorInputs(2);

btnReshuffle.addEventListener('click', ()=>{
  if (!room) return; 
  const colorKeys = Object.keys(customColors);
  deck = makeDeck(ballCount, colorKeys); 
  idx = -1; // 重抽後回到初始 READY? 狀態
  isReady = true;
  render(); 
  emitState();
});

btnPrev.addEventListener('click', ()=>{ 
  if(idx>0){ 
    idx--; 
    render(); 
    emitState(); 
  }
});

btnNext.addEventListener('click', ()=>{ 
  if (isReady) {
    // 從 READY? 狀態進入下一個顏色
    isReady = false;
    if (idx < 0) {
      // 如果還沒有顯示任何顏色，顯示第一個
      idx = 0;
    } else {
      // 如果已經顯示過顏色，顯示下一個
      idx++;
    }
  } else if (idx < deck.length - 1) {
    // 顯示下一個顏色
    idx++;
  }
  render(); 
  emitState(); 
});

// READY? 按鈕
btnReady.addEventListener('click', ()=>{
  if (!room) return;
  if (idx >= 0) {
    // 在顯示顏色時，切換到 READY? 狀態
    isReady = true;
  } else {
    // 在 READY? 狀態時，切換回顏色顯示
    isReady = false;
  }
  render();
  emitState();
});

// 播放狀態下也能重抽
btnReshufflePlay?.addEventListener('click', ()=>{
  if (!room) return; 
  const colorKeys = Object.keys(customColors);
  deck = makeDeck(ballCount, colorKeys); 
  idx = -1; // 重抽後回到初始 READY? 狀態
  isReady = true;
  render(); 
  emitState();
});

// 返回重新設定
btnConfig?.addEventListener('click', ()=>{
  player.classList.add('hidden');
  setup.classList.remove('hidden');
});


