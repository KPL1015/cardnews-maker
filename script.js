const canvas = document.getElementById('cardCanvas');
const imageInput = document.getElementById('imageInput');
const titleInput = document.getElementById('titleInput');
const bodyInput = document.getElementById('bodyInput');
const fileName = document.getElementById('fileName');
const cardList = document.getElementById('cardList');
const cardCounter = document.getElementById('cardCounter');
const addCardButton = document.getElementById('addCardButton');
const removeCardButton = document.getElementById('removeCardButton');
const downloadCurrentButton = document.getElementById('downloadCurrentButton');
const downloadAllButton = document.getElementById('downloadAllButton');
const positionInputs = ['titlePosition', 'titleHorizontal', 'bodyPosition', 'bodyHorizontal', 'photoHorizontal', 'photoVertical'].map((id) => document.getElementById(id));
const outputs = Object.fromEntries(positionInputs.map((input) => [input.id, document.getElementById(`${input.id}Value`)]));

let nextId = 1;
let activeIndex = 0;
const createCard = () => ({
  id: nextId++, title: '오늘의 특별한 이야기', body: '사진 한 장과 짧은 문장으로\n당신의 이야기를 전해보세요.',
  titlePosition: 400, titleHorizontal: 74, bodyPosition: 805, bodyHorizontal: 74,
  photoHorizontal: 50, photoVertical: 50, image: null, fileName: ''
});
const cards = [createCard()];

function activeCard() { return cards[activeIndex]; }
function positionName(value, min, max) { const ratio = (value - min) / (max - min); return ratio < .34 ? '위' : ratio < .67 ? '중간' : '아래'; }
function horizontalName(value) { return value < 160 ? '왼쪽' : value < 300 ? '가운데' : '오른쪽'; }
function photoPositionName(value, vertical) {
  if (value < 34) return vertical ? '위쪽' : '왼쪽';
  if (value < 67) return '가운데';
  return vertical ? '아래쪽' : '오른쪽';
}

function renderCardList() {
  cardList.innerHTML = '';
  cards.forEach((card, index) => {
    const button = document.createElement('button');
    button.className = `card-item${index === activeIndex ? ' active' : ''}`;
    button.type = 'button';
    const safeTitle = card.title.replace(/</g, '&lt;').split('\n')[0] || '제목 없는 카드';
    button.innerHTML = `<span class="card-number">${index + 1}</span><span class="card-copy"><strong>${safeTitle}</strong><small>${card.fileName || '기본 배경'}</small></span>`;
    button.addEventListener('click', () => { activeIndex = index; syncEditor(); });
    cardList.appendChild(button);
  });
  cardCounter.textContent = `${activeIndex + 1} / ${cards.length} 페이지`;
  removeCardButton.disabled = cards.length === 1;
}

function syncEditor() {
  const card = activeCard();
  titleInput.value = card.title;
  bodyInput.value = card.body;
  fileName.textContent = card.fileName || '아직 선택한 이미지가 없습니다.';
  positionInputs.forEach((input) => { input.value = card[input.id]; syncPositionOutput(input.id, card[input.id]); });
  renderCardList();
  renderCard(card, canvas);
}

function wrapText(ctx, text, maxWidth, font) {
  ctx.font = font;
  const lines = [];
  text.split('\n').forEach((paragraph) => {
    let line = '';
    for (const character of paragraph) {
      const candidate = line + character;
      if (ctx.measureText(candidate).width > maxWidth && line) { lines.push(line); line = character; }
      else line = candidate;
    }
    lines.push(line || ' ');
  });
  return lines;
}

function renderCard(card, target) {
  const ctx = target.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
  gradient.addColorStop(0, '#7379c7');
  gradient.addColorStop(1, '#24233a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1080);
  if (card.image) {
    const scale = Math.max(1080 / card.image.width, 1080 / card.image.height);
    const width = card.image.width * scale;
    const height = card.image.height * scale;
    // 사진이 정사각형을 채우도록 자른 뒤, 슬라이더 값으로 잘리는 영역을 옮깁니다.
    const x = (1080 - width) * (card.photoHorizontal / 100);
    const y = (1080 - height) * (card.photoVertical / 100);
    ctx.drawImage(card.image, x, y, width, height);
  }
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(0, 0, 1080, 1080);
  const shade = ctx.createLinearGradient(0, 400, 0, 1080);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,.52)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 1080, 1080);

  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.font = '600 25px "Noto Sans KR", sans-serif';
  ctx.fillText('SNU Off the Field', 74, 48);
  // 비워 둔 입력칸은 카드에도 표시하지 않습니다.
  if (card.title.trim()) {
    const titleLines = wrapText(ctx, card.title.trim(), 1080 - card.titleHorizontal - 74, '800 76px "Noto Sans KR", sans-serif');
    ctx.fillStyle = '#fff';
    ctx.font = '800 76px "Noto Sans KR", sans-serif';
    titleLines.slice(0, 3).forEach((line, i) => ctx.fillText(line, card.titleHorizontal, card.titlePosition + i * 102));
  }
  if (card.body.trim()) {
    const bodyLines = wrapText(ctx, card.body.trim(), 1080 - card.bodyHorizontal - 74, '500 35px "Noto Sans KR", sans-serif');
    ctx.fillStyle = '#fff';
    ctx.font = '500 35px "Noto Sans KR", sans-serif';
    bodyLines.slice(0, 6).forEach((line, i) => ctx.fillText(line, card.bodyHorizontal, card.bodyPosition + i * 53));
  }
}

function updateCurrent(property, value) {
  activeCard()[property] = value;
  renderCard(activeCard(), canvas);
  renderCardList();
}
function syncPositionOutput(id, value) {
  if (id === 'titlePosition') outputs[id].textContent = positionName(value, 150, 690);
  else if (id === 'bodyPosition') outputs[id].textContent = positionName(value, 500, 900);
  else if (id === 'photoHorizontal') outputs[id].textContent = photoPositionName(value, false);
  else if (id === 'photoVertical') outputs[id].textContent = photoPositionName(value, true);
  else outputs[id].textContent = horizontalName(value);
}

titleInput.addEventListener('input', () => updateCurrent('title', titleInput.value));
bodyInput.addEventListener('input', () => updateCurrent('body', bodyInput.value));
positionInputs.forEach((input) => input.addEventListener('input', () => {
  updateCurrent(input.id, +input.value);
  syncPositionOutput(input.id, +input.value);
}));
imageInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { alert('이미지 파일을 선택해주세요.'); return; }
  const targetCard = activeCard();
  const image = new Image();
  image.onload = () => {
    targetCard.image = image;
    targetCard.fileName = file.name;
    if (targetCard === activeCard()) syncEditor();
  };
  image.src = URL.createObjectURL(file);
  imageInput.value = '';
});
addCardButton.addEventListener('click', () => { cards.push(createCard()); activeIndex = cards.length - 1; syncEditor(); });
removeCardButton.addEventListener('click', () => {
  if (cards.length === 1) return;
  cards.splice(activeIndex, 1);
  activeIndex = Math.max(0, activeIndex - 1);
  syncEditor();
});

function canvasBlob(target) { return new Promise((resolve) => target.toBlob(resolve, 'image/png')); }
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
downloadCurrentButton.addEventListener('click', async () => {
  downloadBlob(await canvasBlob(canvas), `cardnews-${String(activeIndex + 1).padStart(2, '0')}.png`);
});

// PNG를 압축 없이 ZIP으로 묶어 외부 라이브러리 없이도 전체 다운로드를 지원합니다.
const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function zipHeader(length, fill) { const bytes = new Uint8Array(length); fill(new DataView(bytes.buffer)); return bytes; }
function createZip(files) {
  const encoder = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  const now = new Date();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  files.forEach(({ name, bytes }) => {
    const filename = encoder.encode(name);
    const crc = crc32(bytes);
    const local = zipHeader(30 + filename.length, (v) => {
      v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(8, 0, true);
      v.setUint16(10, time, true); v.setUint16(12, date, true); v.setUint32(14, crc, true);
      v.setUint32(18, bytes.length, true); v.setUint32(22, bytes.length, true); v.setUint16(26, filename.length, true);
    });
    local.set(filename, 30);
    parts.push(local, bytes);
    const fileOffset = offset;
    offset += local.length + bytes.length;
    const directory = zipHeader(46 + filename.length, (v) => {
      v.setUint32(0, 0x02014b50, true); v.setUint16(4, 20, true); v.setUint16(6, 20, true);
      v.setUint16(10, 0, true); v.setUint16(12, time, true); v.setUint16(14, date, true); v.setUint32(16, crc, true);
      v.setUint32(20, bytes.length, true); v.setUint32(24, bytes.length, true); v.setUint16(28, filename.length, true); v.setUint32(42, fileOffset, true);
    });
    directory.set(filename, 46);
    central.push(directory);
  });
  const centralSize = central.reduce((total, item) => total + item.length, 0);
  const footer = zipHeader(22, (v) => {
    v.setUint32(0, 0x06054b50, true); v.setUint16(8, files.length, true); v.setUint16(10, files.length, true);
    v.setUint32(12, centralSize, true); v.setUint32(16, offset, true);
  });
  return new Blob([...parts, ...central, footer], { type: 'application/zip' });
}
downloadAllButton.addEventListener('click', async () => {
  downloadAllButton.disabled = true;
  downloadAllButton.textContent = 'PNG 파일 준비 중…';
  const files = [];
  for (let index = 0; index < cards.length; index++) {
    const offscreen = document.createElement('canvas');
    offscreen.width = offscreen.height = 1080;
    renderCard(cards[index], offscreen);
    const blob = await canvasBlob(offscreen);
    files.push({ name: `cardnews-${String(index + 1).padStart(2, '0')}.png`, bytes: new Uint8Array(await blob.arrayBuffer()) });
  }
  downloadBlob(createZip(files), 'cardnews-png.zip');
  downloadAllButton.disabled = false;
  downloadAllButton.innerHTML = '전체 카드 PNG 저장 <span>↓</span>';
});

syncEditor();
