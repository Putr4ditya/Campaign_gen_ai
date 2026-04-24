// ── State ──────────────────────────────────────────────────
let selectedVibe = '';
let selectedLang = 'Bahasa Indonesia';
let currentHashtags = [];

// ── Vibe Chips ─────────────────────────────────────────────
document.querySelectorAll('.vibe-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.vibe-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    selectedVibe = chip.dataset.vibe;
  });
});

// ── Language Toggle ────────────────────────────────────────
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedLang = btn.dataset.lang;
  });
});

// ── Loading steps animation ────────────────────────────────
let stepInterval = null;
function animateSteps() {
  const steps = ['step1','step2','step3','step4'];
  let i = 0;
  steps.forEach(id => {
    document.getElementById(id).classList.remove('active','done');
  });
  document.getElementById(steps[0]).classList.add('active');
  stepInterval = setInterval(() => {
    document.getElementById(steps[i]).classList.remove('active');
    document.getElementById(steps[i]).classList.add('done');
    i++;
    if (i < steps.length) {
      document.getElementById(steps[i]).classList.add('active');
    } else {
      clearInterval(stepInterval);
    }
  }, 1400);
}

// ── Show/hide panels ───────────────────────────────────────
function showEmpty()   { setVisible('emptyState'); }
function showLoading() { setVisible('loadingState'); animateSteps(); }
function showResults() { setVisible('results'); }

function setVisible(id) {
  ['emptyState','loadingState','results'].forEach(p => {
    const el = document.getElementById(p);
    if (p === id) {
      el.style.display = (p === 'results' || p === 'loadingState') ? 'flex' : 'flex';
    } else {
      el.style.display = 'none';
    }
  });
}

// ── Main Generate Function ─────────────────────────────────
async function generateCampaign() {
  const product  = document.getElementById('product_name').value.trim();
  const market   = document.getElementById('target_market').value.trim();
  const errorEl  = document.getElementById('errorState');

  errorEl.style.display = 'none';

  if (!product) { shakeInput('product_name'); showError('Nama produk wajib diisi.'); return; }
  if (!market)  { shakeInput('target_market'); showError('Target market wajib diisi.'); return; }
  if (!selectedVibe) { showError('Pilih vibe kampanye terlebih dahulu.'); return; }

  const btn = document.getElementById('btnGenerate');
  btn.disabled = true;

  showLoading();

  try {
    const res = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_name:  product,
        target_market: market,
        vibe:          selectedVibe,
        language:      selectedLang
      })
    });

    const json = await res.json();

    if (!json.success) throw new Error(json.error || 'Terjadi kesalahan.');

    clearInterval(stepInterval);
    renderResults(json.data);

  } catch (err) {
    clearInterval(stepInterval);
    showEmpty();
    showError(err.message);
  } finally {
    btn.disabled = false;
  }
}

// ── Render Results ─────────────────────────────────────────
function renderResults(data) {
  // Headline & Tagline
  document.getElementById('headlineText').textContent = data.headline  || '';
  document.getElementById('taglineText').textContent  = `"${data.tagline}"` || '';

  // Copywriting
  document.getElementById('copyText').textContent = data.copywriting || '';

  // Caption
  document.getElementById('captionText').textContent = data.instagram_caption || '';

  // Hashtags
  currentHashtags = data.hashtags || [];
  const cloud = document.getElementById('hashtagCloud');
  cloud.innerHTML = '';
  currentHashtags.forEach(tag => {
    const pill = document.createElement('div');
    pill.className = 'hashtag-pill';
    pill.textContent = `#${tag}`;
    pill.onclick = () => {
      navigator.clipboard.writeText(`#${tag}`);
      pill.style.background = 'var(--success)';
      pill.style.borderColor = 'var(--success)';
      pill.style.color = '#fff';
      setTimeout(() => {
        pill.style.background = '';
        pill.style.borderColor = '';
        pill.style.color = '';
      }, 1000);
    };
    cloud.appendChild(pill);
  });

  // Image prompt
  document.getElementById('imgPromptText').textContent = data.image_prompt || '';

  // Image
  const wrapper = document.getElementById('imageWrapper');
  wrapper.innerHTML = `
    <div class="image-loading" id="imageLoading">
      <div class="loader-ring" style="width:36px;height:36px;border-top-color:var(--success)"></div>
      <span>Rendering visual...</span>
    </div>
  `;

  const img = new Image();
  img.onload = () => {
    wrapper.innerHTML = '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;border-radius:8px;';
    wrapper.appendChild(img);

    const dlBtn = document.createElement('button');
    dlBtn.style.cssText = `
      position:absolute;bottom:12px;right:12px;
      background:rgba(0,0,0,0.7);color:#fff;
      border:1px solid rgba(255,255,255,0.2);
      border-radius:6px;padding:6px 12px;
      font-family:var(--font-mono);font-size:10px;
      cursor:pointer;letter-spacing:0.08em;
      backdrop-filter:blur(8px);
    `;
    dlBtn.textContent = '↓ SAVE';
    dlBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = img.src;
      a.target = '_blank';
      a.click();
    };
    wrapper.style.position = 'relative';
    wrapper.appendChild(dlBtn);
  };
  img.onerror = () => {
    wrapper.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-size:13px;font-family:var(--font-mono);">⚠ Gagal memuat visual</div>';
  };
  img.src = data.image_url;

  showResults();

  if (window.innerWidth < 900) {
    document.querySelector('.output-panel').scrollIntoView({ behavior: 'smooth' });
  }
}

// ── Copy Helpers ───────────────────────────────────────────
function copyCard(contentId, btn) {
  const el = document.getElementById(contentId);
  navigator.clipboard.writeText(el.innerText).then(() => {
    btn.textContent = '✓ COPIED';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'COPY';
      btn.classList.remove('copied');
    }, 1800);
  });
}

function copyHashtags(btn) {
  const text = currentHashtags.map(t => `#${t}`).join(' ');
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✓ COPIED';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'COPY ALL';
      btn.classList.remove('copied');
    }, 1800);
  });
}

// ── Error ──────────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById('errorState');
  el.textContent = '⚠ ' + msg;
  el.style.display = 'block';
}

function shakeInput(id) {
  const el = document.getElementById(id);
  el.style.borderColor = 'var(--accent)';
  el.style.animation = 'shake 0.4s';
  el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
}

// Enter key support
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generateCampaign();
});