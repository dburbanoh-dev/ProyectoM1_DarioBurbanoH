let currentSize = 6;
let currentFormat = 'hex';
let currentPalette = [];


const btnGenerate = document.getElementById('btn-generate');
const paletteGrid = document.getElementById('palette-grid');
const emptyState = document.getElementById('empty-state');
const paletteMeta = document.getElementById('palette-meta');
const paletteCount = document.getElementById('palette-count');
const paletteTs = document.getElementById('palette-timestamp');
const toastContainer = document.getElementById('toast-container');
const sizeBtns = document.querySelectorAll('.size-btn');
const formatBtns = document.querySelectorAll('.format-btn');


function randomHSL() {
    const h = Math.floor(Math.random() * 360);
    const s = Math.floor(30 + Math.random() * 55);
    const l = Math.floor(25 + Math.random() * 50);
    return { h, s, l };
}

function hslToHex({ h, s, l }) {
    const sl = s / 100, ll = l / 100;
    const a = sl * Math.min(ll, 1 - ll);
    const f = n => {
        const k = (n + h / 30) % 12;
        const c = ll - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
        return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function formatHSL({ h, s, l }) {
    return `hsl(${h}, ${s}%, ${l}%)`;
}

function generatePalette(size) {
    return Array.from({ length: size }, () => {
        const hsl = randomHSL();
        return { hsl, hex: hslToHex(hsl) };
    });
}


function hexToLum(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const toLinear = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function textColorFor(hex) {
    const lum = hexToLum(hex);
    return lum > 0.35 ? '#111111' : '#f5f5f5';
}


function renderPalette(palette, format) {
    paletteGrid.innerHTML = '';
    emptyState.hidden = true;
    paletteMeta.hidden = false;

    paletteCount.textContent = `${palette.length} colores generados`;
    paletteTs.textContent = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    palette.forEach((color, i) => {
        const primary = format === 'hex' ? color.hex : formatHSL(color.hsl);
        const secondary = format === 'hex' ? formatHSL(color.hsl) : color.hex;
        const fg = textColorFor(color.hex);

        const card = document.createElement('article');
        card.className = 'color-card';
        card.style.animationDelay = `${i * 45}ms`;
        card.setAttribute('role', 'listitem');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Color ${i + 1}: ${primary}. Presiona Enter o clic para copiar.`);
        card.dataset.hex = color.hex;
        card.dataset.value = primary;

        card.innerHTML = `
          <div class="color-swatch" style="background:${color.hex};" aria-hidden="true">
            <span class="copy-hint" style="color:${fg};">Copiar</span>
          </div>
          <div class="color-info">
            <span class="color-hex">${primary}</span>
            <span class="color-secondary">${secondary}</span>
            <span class="color-copied-badge" aria-hidden="true">Copiado ✓</span>
          </div>
        `;

        card.addEventListener('click', () => copyColor(card, primary));
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                copyColor(card, primary);
            }
        });

        paletteGrid.appendChild(card);
    });
}


async function copyColor(card, value) {
    try {
        await navigator.clipboard.writeText(value);
        const badge = card.querySelector('.color-copied-badge');
        badge.classList.add('show');
        setTimeout(() => badge.classList.remove('show'), 1800);
        showToast(`Copiado: ${value}`, 'copy');
    } catch {
        showToast('No se pudo copiar al portapapeles', 'info');
    }
}


function showToast(message, type = 'info', duration = 2800) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-dot" aria-hidden="true"></span><span class="toast-msg">${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);
}

btnGenerate.addEventListener('click', () => {
    btnGenerate.classList.add('loading');
    btnGenerate.textContent = 'Generando…';

    setTimeout(() => {
        currentPalette = generatePalette(currentSize);
        renderPalette(currentPalette, currentFormat);

        btnGenerate.classList.remove('loading');
        btnGenerate.textContent = 'Generar paleta 🎨';

        showToast(`Paleta de ${currentSize} colores generada en ${currentFormat.toUpperCase()}`, 'success');
    }, 220);
});


sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        sizeBtns.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        currentSize = parseInt(btn.dataset.size);

        if (currentPalette.length > 0) {
            currentPalette = generatePalette(currentSize);
            renderPalette(currentPalette, currentFormat);
            showToast(`Tamaño ajustado a ${currentSize} colores`, 'info');
        }
    });
});


formatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        formatBtns.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        currentFormat = btn.dataset.format;

        if (currentPalette.length > 0) {
            renderPalette(currentPalette, currentFormat);
            showToast(`Formato cambiado a ${currentFormat.toUpperCase()}`, 'info');
        }
    });
});