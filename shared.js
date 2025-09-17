export const COLORS = {
  red: { className: 'color-red', label: 'RED' },
  blue: { className: 'color-blue', label: 'BLUE' },
  green: { className: 'color-green', label: 'GREEN' },
  ready: { className: 'color-ready', label: 'READY?' },
};

export const AVAILABLE_COLORS = ['red', 'blue', 'green'];

export function shuffleInPlace(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
}

export function ensureFeasibleTotal(total, mode){
  if (mode === 2) return Math.max(2, total);
  let n = Math.max(5, total);
  while (Math.ceil(0.2 * n) > Math.floor(0.3 * n)) n++;
  return n;
}

// 驗證牌組是否符合規則
function validateDeck(deck, colorKeys) {
  const colorCount = {};
  let hasAdjacent = false;
  
  // 檢查每種顏色的出現次數
  for (const color of deck) {
    colorCount[color] = (colorCount[color] || 0) + 1;
  }
  
  // 檢查是否每種顏色都至少出現一次
  const allColorsPresent = colorKeys.every(color => colorCount[color] > 0);
  
  // 檢查是否有相鄰的相同顏色
  for (let i = 1; i < deck.length; i++) {
    if (deck[i] === deck[i-1]) {
      hasAdjacent = true;
      break;
    }
  }
  
  return {
    allColorsPresent,
    noAdjacent: !hasAdjacent,
    isValid: allColorsPresent && !hasAdjacent
  };
}

export function makeDeck(ballCount, colorKeys){
  if (!colorKeys || colorKeys.length === 0) return [];
  
  const colorCount = colorKeys.length;
  
  // 如果球數量少於顏色數量，無法滿足所有顏色至少出現一次
  if (ballCount < colorCount) {
    console.warn(`球數量(${ballCount})少於顏色數量(${colorCount})，無法滿足所有顏色至少出現一次的規則`);
    // 返回所有可能的顏色，但可能無法滿足不相鄰的規則
    const deck = [];
    for(let i = 0; i < ballCount; i++) {
      deck.push(colorKeys[i % colorCount]);
    }
    return deck;
  }
  
  if (colorCount === 1) {
    // 只有一種顏色，全部都是該顏色
    const deck = [];
    for(let i = 0; i < ballCount; i++) deck.push(colorKeys[0]);
    return deck;
  }
  
  // 嘗試生成符合規則的牌組
  let bestDeck = null;
  let bestScore = -1;
  
  for (let attempt = 0; attempt < 50; attempt++) {
    const deck = [];
    
    // 首先為每種顏色分配一個球
    for(let i = 0; i < colorCount; i++) {
      deck.push(colorKeys[i]);
    }
    
    // 分配剩餘的球
    const remainingBalls = ballCount - colorCount;
    if (remainingBalls > 0) {
      // 隨機分配剩餘的球
      for(let i = 0; i < remainingBalls; i++) {
        const randomColor = colorKeys[Math.floor(Math.random() * colorCount)];
        deck.push(randomColor);
      }
    }
    
    // 洗牌
    shuffleInPlace(deck);
    
    // 嘗試修復相鄰的相同顏色
    for (let i = 1; i < deck.length; i++) {
      if (deck[i] === deck[i-1]) {
        // 嘗試與後面的不同顏色交換
        let swapped = false;
        for(let j = i + 1; j < deck.length; j++) {
          if (deck[j] !== deck[i]) {
            [deck[i], deck[j]] = [deck[j], deck[i]];
            swapped = true;
            break;
          }
        }
        
        // 如果沒找到，嘗試與前面的不同顏色交換
        if (!swapped) {
          for(let j = 0; j < i - 1; j++) {
            if (deck[j] !== deck[i]) {
              [deck[i], deck[j]] = [deck[j], deck[i]];
              swapped = true;
              break;
            }
          }
        }
      }
    }
    
    // 驗證牌組
    const validation = validateDeck(deck, colorKeys);
    
    if (validation.isValid) {
      return deck; // 找到完美的牌組
    }
    
    // 計算分數（所有顏色都出現 + 沒有相鄰相同顏色）
    const score = (validation.allColorsPresent ? 1 : 0) + (validation.noAdjacent ? 1 : 0);
    if (score > bestScore) {
      bestScore = score;
      bestDeck = [...deck];
    }
  }
  
  // 如果沒找到完美的牌組，返回最好的嘗試
  if (bestDeck) {
    const validation = validateDeck(bestDeck, colorKeys);
    if (!validation.isValid) {
      console.warn('無法生成完全符合規則的牌組，但已盡力優化');
    }
    return bestDeck;
  }
  
  // 最後的備用方案
  const deck = [];
  for(let i = 0; i < ballCount; i++) {
    deck.push(colorKeys[i % colorCount]);
  }
  return deck;
}


