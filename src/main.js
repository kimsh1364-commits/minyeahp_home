const API = '/api';

let items = [];
let editingId = null;
let form = { url: '', title: '', price: '', image: '', rating: 0, memo: '' };

let backdrop, sheet;

// ── Helpers ────────────────────────────────────────────────────────
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

function fmtPrice(p) {
  const n = parseInt(p);
  return isNaN(n) ? '' : n.toLocaleString('ko-KR') + '원';
}

function starsHtml(rating, interactive = false) {
  return Array.from({ length: 5 }, (_, i) => {
    const filled = i < rating;
    if (interactive) {
      return `<button class="star-btn" data-n="${i + 1}" style="color:${filled ? 'var(--star-fill)' : 'var(--star-empty)'}" aria-label="${i + 1}점">★</button>`;
    }
    return `<span style="color:${filled ? 'var(--star-fill)' : 'var(--star-empty)'}">★</span>`;
  }).join('');
}

// ── API calls ───────────────────────────────────────────────────────
async function apiFetch(url, opts = {}) {
  const res = await fetch(url, opts);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

async function loadItems() {
  items = await apiFetch(`${API}/items`);
}

// ── Render ──────────────────────────────────────────────────────────
function render() {
  const appEl = document.getElementById('app');
  appEl.innerHTML = `
    <div class="header">
      <h1>✦ 찜 목록</h1>
      <button class="btn-add" id="btnAdd" aria-label="아이템 추가">+</button>
    </div>
    <div class="grid" id="grid"></div>
  `;

  $('#btnAdd').addEventListener('click', () => openModal(null));
  renderGrid();
}

function renderGrid() {
  const grid = $('#grid');
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🛍️</div>
        <p>아직 찜한 아이템이 없어요.<br>+ 버튼으로 추가해보세요!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(cardHtml).join('');
  grid.querySelectorAll('.card').forEach((el) => {
    el.addEventListener('click', () => openModal(el.dataset.id));
  });
}

function cardHtml(item) {
  const price = item.price != null ? fmtPrice(item.price) : '';
  const imgPart = item.image
    ? `<img class="card-img" src="${esc(item.image)}" alt="" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
       ><div class="card-img-placeholder" style="display:none">🛍️</div>`
    : `<div class="card-img-placeholder">🛍️</div>`;

  return `
    <div class="card" data-id="${esc(item.id)}">
      ${imgPart}
      <div class="card-body">
        <div class="card-title">${esc(item.title || '제목 없음')}</div>
        ${price ? `<div class="card-price">${esc(price)}</div>` : ''}
        <div class="stars">${starsHtml(item.rating || 0)}</div>
      </div>
    </div>
  `;
}

// ── Modal ───────────────────────────────────────────────────────────
function initModal() {
  backdrop = document.createElement('div');
  backdrop.className = 'backdrop';
  sheet = document.createElement('div');
  sheet.className = 'sheet';
  document.body.append(backdrop, sheet);
  backdrop.addEventListener('click', closeModal);
}

function openModal(id) {
  editingId = id;
  if (id) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    form = {
      url: item.url || '',
      title: item.title || '',
      price: item.price ?? '',
      image: item.image || '',
      rating: item.rating || 0,
      memo: item.memo || '',
    };
  } else {
    form = { url: '', title: '', price: '', image: '', rating: 0, memo: '' };
  }
  renderSheet();
  requestAnimationFrame(() => {
    backdrop.classList.add('visible');
    sheet.classList.add('visible');
  });
}

function closeModal() {
  backdrop.classList.remove('visible');
  sheet.classList.remove('visible');
}

function renderSheet() {
  const isEdit = !!editingId;
  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-title">${isEdit ? '아이템 수정' : '새 아이템 추가'}</div>

    <div class="form-group">
      <label class="form-label">URL</label>
      <div class="url-row">
        <input id="fUrl" class="form-input" type="url" placeholder="https://" value="${esc(form.url)}">
        <button id="btnFetch" class="btn-fetch">가져오기</button>
      </div>
    </div>

    <div id="imgWrap">${form.image ? `<div class="form-group"><img class="img-preview" src="${esc(form.image)}" alt=""></div>` : ''}</div>

    <div class="form-group">
      <label class="form-label">제목</label>
      <input id="fTitle" class="form-input" type="text" placeholder="아이템 이름" value="${esc(form.title)}">
    </div>

    <div class="form-group">
      <label class="form-label">가격</label>
      <input id="fPrice" class="form-input" type="number" placeholder="숫자만 입력" value="${esc(form.price)}">
    </div>

    <div class="form-group">
      <label class="form-label">별점</label>
      <div class="star-input" id="starInput">${starsHtml(form.rating, true)}</div>
    </div>

    <div class="form-group">
      <label class="form-label">메모</label>
      <input id="fMemo" class="form-input" type="text" placeholder="간단한 메모" value="${esc(form.memo)}">
    </div>

    <div class="sheet-actions">
      ${isEdit ? '<button id="btnDelete" class="btn-delete">삭제</button>' : ''}
      <button id="btnSave" class="btn-save">${isEdit ? '저장' : '추가'}</button>
    </div>
  `;

  $('#fUrl', sheet).addEventListener('input', (e) => { form.url = e.target.value; });
  $('#fTitle', sheet).addEventListener('input', (e) => { form.title = e.target.value; });
  $('#fPrice', sheet).addEventListener('input', (e) => { form.price = e.target.value; });
  $('#fMemo', sheet).addEventListener('input', (e) => { form.memo = e.target.value; });

  $('#btnFetch', sheet).addEventListener('click', fetchMeta);
  $('#btnSave', sheet).addEventListener('click', saveItem);
  if (isEdit) $('#btnDelete', sheet).addEventListener('click', deleteItem);

  $('#starInput', sheet).addEventListener('click', (e) => {
    const btn = e.target.closest('.star-btn');
    if (!btn) return;
    form.rating = parseInt(btn.dataset.n);
    $('#starInput', sheet).innerHTML = starsHtml(form.rating, true);
  });
}

function updateImgPreview() {
  const wrap = $('#imgWrap', sheet);
  if (!wrap) return;
  wrap.innerHTML = form.image
    ? `<div class="form-group"><img class="img-preview" src="${esc(form.image)}" alt=""></div>`
    : '';
}

// ── Fetch OG meta ────────────────────────────────────────────────────
async function fetchMeta() {
  const url = $('#fUrl', sheet).value.trim();
  if (!url) return;
  const btn = $('#btnFetch', sheet);
  btn.textContent = '로딩 중…';
  btn.disabled = true;
  try {
    const data = await apiFetch(`${API}/fetch-meta?url=${encodeURIComponent(url)}`);
    form.url = url;
    if (data.title) { form.title = data.title; $('#fTitle', sheet).value = data.title; }
    if (data.price != null) { form.price = data.price; $('#fPrice', sheet).value = data.price; }
    if (data.image) { form.image = data.image; updateImgPreview(); }
  } catch {
    showToast('메타 정보를 가져오지 못했어요');
  } finally {
    btn.textContent = '가져오기';
    btn.disabled = false;
  }
}

// ── Save / Delete ────────────────────────────────────────────────────
async function saveItem() {
  const payload = {
    url: $('#fUrl', sheet).value.trim(),
    title: $('#fTitle', sheet).value.trim(),
    price: $('#fPrice', sheet).value !== '' ? parseInt($('#fPrice', sheet).value) : null,
    image: form.image,
    rating: form.rating,
    memo: $('#fMemo', sheet).value.trim(),
  };

  // 5MB base64 guard
  if (payload.image && payload.image.startsWith('data:') && payload.image.length > 5 * 1024 * 1024) {
    showToast('이미지가 5MB를 초과해요');
    return;
  }

  try {
    if (editingId) {
      await apiFetch(`${API}/items/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch(`${API}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    await loadItems();
    closeModal();
    renderGrid();
    showToast(editingId ? '수정했어요!' : '추가했어요!');
  } catch {
    showToast('저장에 실패했어요');
  }
}

async function deleteItem() {
  if (!editingId) return;
  if (!confirm('정말 삭제할까요?')) return;
  try {
    await apiFetch(`${API}/items/${editingId}`, { method: 'DELETE' });
    await loadItems();
    closeModal();
    renderGrid();
    showToast('삭제했어요');
  } catch {
    showToast('삭제에 실패했어요');
  }
}

// ── Toast ────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  let el = $('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// ── Init ─────────────────────────────────────────────────────────────
async function init() {
  initModal();
  await loadItems();
  render();
}

init();
