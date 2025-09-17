export const COLORS = {
  red: { className: 'color-red', label: 'RED' },
  blue: { className: 'color-blue', label: 'BLUE' },
  green: { className: 'color-green', label: 'GREEN' },
};

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

export function makeDeck(total, mode){
  if (mode === 2){
    const minCount = Math.ceil(total*0.2);
    const maxRed = total - minCount;
    const red = Math.floor(Math.random()*(maxRed - minCount + 1)) + minCount;
    const blue = total - red;
    const deck=[]; for(let i=0;i<red;i++) deck.push('red'); for(let i=0;i<blue;i++) deck.push('blue');
    shuffleInPlace(deck); return deck;
  }
  const minCount = Math.ceil(total*0.2);
  const maxGreenByRatio = Math.floor(total*0.3);
  const maxGreenAllowed = Math.min(maxGreenByRatio, total - 2*minCount);
  const greenMin = Math.max(minCount, 0);
  let green = Math.floor(Math.random()*(maxGreenAllowed - greenMin + 1)) + greenMin;
  if (maxGreenAllowed < greenMin) green = Math.min(maxGreenByRatio, Math.max(0, total - 2*minCount));
  const remaining = total - green;
  const redMin = minCount; const redMax = remaining - minCount;
  const red = Math.floor(Math.random()*(redMax - redMin + 1)) + redMin;
  const blue = remaining - red;
  const deck=[]; for(let i=0;i<red;i++) deck.push('red'); for(let i=0;i<blue;i++) deck.push('blue'); for(let i=0;i<green;i++) deck.push('green');
  shuffleInPlace(deck);
  if (deck[0]==='green'){ const j = deck.findIndex(c=>c!=='green'); if (j>0) [deck[0], deck[j]] = [deck[j], deck[0]]; }
  return deck;
}


