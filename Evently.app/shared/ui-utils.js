// shared/ui-utils.js
// Helpers de UI reutilizables para Evently.
// Sin dependencias externas. Vanilla JS.

/* ============================
   TOAST
   ============================ */
export function mostrarToast(mensaje, tipo = 'info', duracion = 3000) {
  let cont = document.getElementById('eventy-toast-container');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'eventy-toast-container';
    cont.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(cont);
  }

  const colores = {
    info:    { bg: '#1e293b', borde: '#334155', icono: 'ℹ️' },
    exito:   { bg: '#065f46', borde: '#10b981', icono: '✅' },
    error:   { bg: '#7f1d1d', borde: '#ef4444', icono: '⛔' },
    warning: { bg: '#78350f', borde: '#f59e0b', icono: '⚠️' }
  };
  const c = colores[tipo] || colores.info;

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${c.bg};
    border-left: 4px solid ${c.borde};
    color: #f1f5f9;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,.3);
    min-width: 240px;
    max-width: 360px;
    pointer-events: auto;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity .2s ease, transform .2s ease;
  `;
  toast.textContent = `${c.icono}  ${mensaje}`;

  cont.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 200);
  }, duracion);
}

/* ============================
   MODALES
   ============================ */
export function abrirModal(id) {
  const m = document.getElementById(id);
  if (!m) return console.warn(`[ui-utils] Modal no encontrado: ${id}`);
  m.classList.remove('hidden');
  m.style.display = 'flex';
}

export function cerrarModal(id) {
  const m = document.getElementById(id);
  if (!m) return console.warn(`[ui-utils] Modal no encontrado: ${id}`);
  m.classList.add('hidden');
  m.style.display = 'none';
}

/* ============================
   CONFIRMACIÓN (reemplaza confirm() nativo)
   ============================ */
export function confirmar(mensaje, opciones = {}) {
  return new Promise((resolve) => {
    const titulo = opciones.titulo || 'Confirmar acción';
    const textoOk = opciones.textoOk || 'Confirmar';
    const textoCancel = opciones.textoCancel || 'Cancelar';

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0,0,0,.6);
      display: flex; align-items: center; justify-content: center;
      z-index: 100000; padding: 16px;
    `;

    overlay.innerHTML = `
      <div style="
        background:#0f172a; color:#f1f5f9; border-radius:12px;
        max-width:420px; width:100%; padding:24px;
        font-family: system-ui, sans-serif;
        box-shadow:0 10px 30px rgba(0,0,0,.5);
      ">
        <h3 style="margin:0 0 12px; font-size:18px;">${titulo}</h3>
        <p style="margin:0 0 20px; color:#cbd5e1; font-size:14px; line-height:1.5;">${mensaje}</p>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button id="ev-confirm-cancel" style="
            background:transparent; color:#cbd5e1; border:1px solid #334155;
            padding:8px 16px; border-radius:8px; cursor:pointer; font-size:14px;
          ">${textoCancel}</button>
          <button id="ev-confirm-ok" style="
            background:#ef4444; color:#fff; border:none;
            padding:8px 16px; border-radius:8px; cursor:pointer; font-size:14px; font-weight:600;
          ">${textoOk}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#ev-confirm-ok').onclick = () => {
      overlay.remove();
      resolve(true);
    };
    overlay.querySelector('#ev-confirm-cancel').onclick = () => {
      overlay.remove();
      resolve(false);
    };
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.remove(); resolve(false); }
    });
  });
}

/* ============================
   FECHAS
   ============================ */
export function formatearFecha(fecha) {
  if (!fecha) return '';
  const d = fecha.toDate ? fecha.toDate() : new Date(fecha);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ============================
   DESCARGA DE ARCHIVOS
   ============================ */
export function descargarBlob(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ============================
   DEBOUNCE (útil para buscadores)
   ============================ */
export function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}