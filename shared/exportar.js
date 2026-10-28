// shared/exportar.js
// Descargas del panel (pedido 17): CSV (se abre con Excel o Google Sheets) y PDF con un formato profesional y ordenado,
// igual en Reportes, Ventas y Finanzas.
// La primera parte son funciones puras (se prueban con node); la segunda arma el PDF en el navegador con html2pdf
// (la misma librería que ya usaba Reportes, cdnjs 0.10.1), siempre con createElement y textContent.

// ---------- CSV ----------

// Una celda: los números van tal cual; los textos entre comillas y, si empiezan con = + - @ (o tabulación), con un
// apóstrofo adelante, para que Excel no los tome como fórmula.
export function celdaCsv(valor) {
    if (typeof valor === 'number') return Number.isFinite(valor) ? String(valor).replace('.', ',') : '';
    let texto = valor === null || valor === undefined ? '' : String(valor);
    if (/^[=+\-@\t\r]/.test(texto)) texto = "'" + texto;
    return '"' + texto.replace(/"/g, '""') + '"';
}

// Todo el archivo: filas separadas por punto y coma (lo que espera Excel en español) y con BOM para que se vean los acentos
export function textoCsv(filas) {
    return '﻿' + (Array.isArray(filas) ? filas : []).map((fila) => (Array.isArray(fila) ? fila : []).map(celdaCsv).join(';')).join('\r\n');
}

// Fecha y hora de una venta (Timestamp de Firestore, {seconds}, Date, número o texto) como "dd/mm/aaaa hh:mm"
export function fechaHora(valor) {
    let ms = null;
    if (valor && typeof valor.toDate === 'function') ms = valor.toDate().getTime();
    else if (valor && typeof valor.seconds === 'number') ms = valor.seconds * 1000;
    else if (valor instanceof Date) ms = valor.getTime();
    else if (typeof valor === 'number') ms = valor;
    else if (typeof valor === 'string' && valor.trim()) {
        const intento = Date.parse(valor);
        if (!Number.isFinite(intento)) return valor.trim();
        ms = intento;
    }
    if (ms === null || !Number.isFinite(ms)) return '';
    return new Date(ms).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

// Nombre de archivo sin acentos ni símbolos: "ventas-fiesta-del-rio-2026-10-28.csv"
export function nombreDeArchivo(partes, extension, ahora = new Date()) {
    const dia = ahora.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
    const limpio = (Array.isArray(partes) ? partes : [partes]).filter(Boolean).join('-')
        .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
    return `${limpio || 'evently'}-${dia}.${extension}`;
}

// Plata en pesos, sin decimales: $ 12.500
export const pesos = (n) => '$ ' + Math.round(Number(n) || 0).toLocaleString('es-AR');

// ---------- Descargas (navegador) ----------

function bajarArchivo(blob, nombre) {
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
}

export function descargarCsv(nombre, filas) {
    bajarArchivo(new Blob([textoCsv(filas)], { type: 'text/csv;charset=utf-8' }), nombre);
}

// html2pdf se carga solo cuando hace falta (Reportes ya lo trae en su <head>)
const URL_HTML2PDF = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
function cargarHtml2pdf() {
    if (window.html2pdf) return Promise.resolve(window.html2pdf);
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = URL_HTML2PDF;
        s.onload = () => (window.html2pdf ? resolve(window.html2pdf) : reject(new Error('No se pudo cargar el generador de PDF.')));
        s.onerror = () => reject(new Error('No se pudo cargar el generador de PDF. Revisá tu conexión.'));
        document.head.appendChild(s);
    });
}

const VIOLETA = '#6d28d9';
function el(tag, estilo, texto) {
    const e = document.createElement(tag);
    if (estilo) e.style.cssText = estilo;
    if (texto !== undefined) e.textContent = texto;
    return e;
}

// Arma la hoja del PDF. doc = { titulo, subtitulo, filtros, bloques: [{ titulo, tarjetas?: [{ titulo, valor }],
// tabla?: { columnas, filas, derecha?: [índices], total?: [celdas] }, nota? }] }
export function hojaDelPdf(doc) {
    const hoja = el('div', 'font-family: Helvetica, Arial, sans-serif; color: #1f2937; padding: 28px 32px; width: 740px; background: #fff;');
    const cabecera = el('div', `display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid ${VIOLETA}; padding-bottom: 12px;`);
    const izquierda = el('div');
    izquierda.append(el('div', `font-size: 22px; font-weight: 800; color: ${VIOLETA}; letter-spacing: -0.5px;`, 'Evently'),
        el('div', 'font-size: 17px; font-weight: 700; margin-top: 6px;', doc.titulo || 'Reporte'));
    if (doc.subtitulo) izquierda.append(el('div', 'font-size: 11px; color: #6b7280; margin-top: 2px;', doc.subtitulo));
    const derecha = el('div', 'text-align: right; font-size: 10px; color: #6b7280;');
    derecha.append(el('div', '', 'Generado el'), el('div', 'font-weight: 700; color: #374151;', fechaHora(new Date())));
    cabecera.append(izquierda, derecha);
    hoja.append(cabecera);
    if (doc.filtros) hoja.append(el('div', 'margin-top: 10px; font-size: 10px; color: #4b5563; background: #f5f3ff; padding: 6px 10px; border-radius: 6px;', doc.filtros));

    (doc.bloques || []).forEach((bloque, n) => {
        const seccion = el('div', 'margin-top: 20px; page-break-inside: avoid;');
        seccion.append(el('div', `font-size: 13px; font-weight: 700; color: ${VIOLETA}; margin-bottom: 8px;`, `${n + 1}. ${bloque.titulo}`));
        if (Array.isArray(bloque.tarjetas) && bloque.tarjetas.length) {
            const grilla = el('div', 'display: flex; flex-wrap: wrap; gap: 8px;');
            bloque.tarjetas.forEach((t) => {
                const caja = el('div', 'flex: 1 1 150px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 10px;');
                caja.append(el('div', 'font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;', t.titulo),
                    el('div', 'font-size: 15px; font-weight: 700; margin-top: 2px;', String(t.valor)));
                grilla.append(caja);
            });
            seccion.append(grilla);
        }
        if (bloque.tabla) {
            const { columnas = [], filas = [], derecha = [], total = null } = bloque.tabla;
            const tabla = el('table', 'width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 4px;');
            const alinear = (i) => (derecha.includes(i) ? 'right' : 'left');
            const cab = el('tr');
            columnas.forEach((c, i) => cab.append(el('th', `background: ${VIOLETA}; color: #fff; padding: 6px 8px; text-align: ${alinear(i)}; font-weight: 600;`, c)));
            tabla.append(cab);
            if (filas.length === 0) {
                const vacia = el('tr');
                const celda = el('td', 'padding: 8px; color: #9ca3af; text-align: center;', 'Sin datos para lo elegido.');
                celda.colSpan = Math.max(columnas.length, 1);
                vacia.append(celda);
                tabla.append(vacia);
            }
            filas.forEach((fila, k) => {
                const tr = el('tr', k % 2 ? 'background: #faf9ff;' : '');
                fila.forEach((valor, i) => tr.append(el('td', `padding: 5px 8px; border-bottom: 1px solid #eee; text-align: ${alinear(i)};`, valor === null || valor === undefined ? '' : String(valor))));
                tabla.append(tr);
            });
            if (total) {
                const tr = el('tr', 'background: #ede9fe; font-weight: 700;');
                total.forEach((valor, i) => tr.append(el('td', `padding: 6px 8px; text-align: ${alinear(i)};`, valor === null || valor === undefined ? '' : String(valor))));
                tabla.append(tr);
            }
            seccion.append(tabla);
        }
        if (bloque.nota) seccion.append(el('div', 'font-size: 9px; color: #6b7280; margin-top: 4px;', bloque.nota));
        hoja.append(seccion);
    });

    hoja.append(el('div', 'margin-top: 28px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; text-align: center;',
        '© 2026 Evently by Bali Group · Documento generado desde el panel de Evently con los filtros indicados arriba.'));
    return hoja;
}

export async function descargarPdf(nombre, doc) {
    const html2pdf = await cargarHtml2pdf();
    const hoja = hojaDelPdf(doc);
    await html2pdf().set({
        margin: [10, 8, 12, 8], filename: nombre, image: { type: 'jpeg', quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
    }).from(hoja).save();
}
