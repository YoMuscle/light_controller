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

export function makeDeck(ballCount, colorKeys, customColors = null){
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
  
  // 生成牌組
  const deck = [];
  
  // 特殊處理：只有3種顏色時使用特定比例
  if (colorCount === 3 && customColors) {
    // 檢查是否包含紅色、藍色、綠色
    const hasRed = colorKeys.some(key => {
      const colorInfo = customColors[key];
      return colorInfo && (colorInfo.name.toLowerCase().includes('red') || colorInfo.name.toLowerCase().includes('紅色'));
    });
    const hasBlue = colorKeys.some(key => {
      const colorInfo = customColors[key];
      return colorInfo && (colorInfo.name.toLowerCase().includes('blue') || colorInfo.name.toLowerCase().includes('藍色'));
    });
    const hasGreen = colorKeys.some(key => {
      const colorInfo = customColors[key];
      return colorInfo && (colorInfo.name.toLowerCase().includes('green') || colorInfo.name.toLowerCase().includes('綠色'));
    });
    
    if (hasRed && hasBlue && hasGreen) {
      // 使用特殊比例：紅色4次，綠色1-2次，其餘藍色
      const redCount = 4;
      const greenCount = Math.floor(Math.random() * 2) + 1; // 1-2次
      const blueCount = ballCount - redCount - greenCount;
      
      // 找到對應的顏色鍵
      const redKey = colorKeys.find(key => {
        const colorInfo = customColors[key];
        return colorInfo && (colorInfo.name.toLowerCase().includes('red') || colorInfo.name.toLowerCase().includes('紅色'));
      });
      const blueKey = colorKeys.find(key => {
        const colorInfo = customColors[key];
        return colorInfo && (colorInfo.name.toLowerCase().includes('blue') || colorInfo.name.toLowerCase().includes('藍色'));
      });
      const greenKey = colorKeys.find(key => {
        const colorInfo = customColors[key];
        return colorInfo && (colorInfo.name.toLowerCase().includes('green') || colorInfo.name.toLowerCase().includes('綠色'));
      });
      
      // 分配顏色
      for(let i = 0; i < redCount; i++) deck.push(redKey);
      for(let i = 0; i < greenCount; i++) deck.push(greenKey);
      for(let i = 0; i < blueCount; i++) deck.push(blueKey);
      
      console.log(`3種顏色特殊比例：紅色${redCount}次，綠色${greenCount}次，藍色${blueCount}次`);
    } else {
      // 不是標準的紅藍綠組合，使用一般規則
      for(let i = 0; i < colorCount; i++) {
        deck.push(colorKeys[i]);
      }
      const remainingBalls = ballCount - colorCount;
      if (remainingBalls > 0) {
        for(let i = 0; i < remainingBalls; i++) {
          const randomColor = colorKeys[Math.floor(Math.random() * colorCount)];
          deck.push(randomColor);
        }
      }
    }
  } else {
    // 其他情況使用一般規則
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
  }
  
  // 洗牌
  shuffleInPlace(deck);
  
  // 只有當顏色數量 >= 4 時才檢查相鄰顏色重複
  if (colorCount >= 4) {
    // 嘗試修復相鄰的相同顏色
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      let hasAdjacent = false;
      
      // 檢查是否有相鄰的相同顏色
      for(let i = 1; i < deck.length; i++) {
        if (deck[i] === deck[i-1]) {
          hasAdjacent = true;
          
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
          
          // 如果還是沒找到合適的交換，重新洗牌
          if (!swapped) {
            shuffleInPlace(deck);
            break;
          }
        }
      }
      
      if (!hasAdjacent) {
        break; // 沒有相鄰的相同顏色，完成
      }
      
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      console.warn('無法完全避免相鄰的相同顏色，但確保每種顏色都至少出現一次');
    }
  } else {
    // 顏色數量 < 4 時，允許相鄰顏色重複，只確保每種顏色都至少出現一次
    console.log(`顏色數量(${colorCount})少於4個，允許相鄰顏色重複`);
  }
  
  return deck;
}


