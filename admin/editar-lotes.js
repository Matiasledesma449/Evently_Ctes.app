// admin/editar-lotes.js
// "Editar lotes" de un evento publicado (solo superadmin, en la lista de Eventos): tipo, fechas y "Habilitar ahora".
// Guarda con una transacción y cambia SOLO esos campos de cada lote: el precio, el stock y las vendidas
// (que actualiza el servidor al confirmar ventas) no se tocan aunque cambien mientras el cuadro está abierto.
import { doc, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { validarFechasDeLote, textoDeVigencia, estadoDeLote, hoyEnArgentina } from "../shared/lotes.js";

const CAMPO = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none';

const crear = (etiqueta, clases, texto) => {
    const e = document.createElement(etiqueta);
    if (clases) e.className = clases;
    if (texto !== undefined) e.textContent = texto; // textContent: los nombres de lotes nunca se interpretan como HTML
    return e;
};

const ESTADOS = { disponible: 'A la venta', proximo: 'Todavía no empezó', finalizado: 'Terminó' };

// Abre el cuadro para el evento. `alGuardar(texto)` muestra el aviso de resultado.
export function abrirEditorDeLotes(evento, alGuardar) {
    const fondo = crear('div', 'fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4');
    fondo.setAttribute('role', 'dialog');
    fondo.setAttribute('aria-modal', 'true');
    const caja = crear('div', 'bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6');
    const titulo = crear('h2', 'text-xl font-bold text-gray-800', 'Editar lotes');
    titulo.id = 'tituloEditarLotes';
    fondo.setAttribute('aria-labelledby', titulo.id);
    caja.append(titulo, crear('p', 'text-sm text-gray-500 mt-1', `${evento.nombre || 'Evento'}: cuándo se vende cada lote. El precio y la cantidad no se cambian acá.`));

    const hoy = hoyEnArgentina();
    const filas = (Array.isArray(evento.lotes) ? evento.lotes : []).map((lote, indice) => {
        const fila = crear('fieldset', 'mt-4 border border-gray-200 rounded-xl p-4');
        const cabeza = crear('legend', 'px-1 text-sm font-semibold text-gray-800', lote.nombre || `Lote ${indice + 1}`);
        const estado = crear('p', 'text-xs text-gray-500', `Ahora: ${ESTADOS[estadoDeLote(lote, hoy)]}`);
        const grilla = crear('div', 'grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2');
        const tipo = crear('select', `bg-white ${CAMPO}`);
        tipo.setAttribute('aria-label', `Cuándo se vende ${lote.nombre || ''}`);
        tipo.add(new Option('Por fechas (preventa)', 'fechas'));
        tipo.add(new Option('Siempre disponible (sector)', 'siempre'));
        // Un lote viejo sin tipo ni fechas se vende siempre: se muestra así para no obligar a ponerle fechas
        tipo.value = lote.tipo === 'fechas' || (!lote.tipo && (lote.desde || lote.hasta)) ? 'fechas' : 'siempre';
        const desde = crear('input', CAMPO); desde.type = 'date'; desde.value = lote.desde || ''; desde.setAttribute('aria-label', 'Desde');
        const hasta = crear('input', CAMPO); hasta.type = 'date'; hasta.value = lote.hasta || ''; hasta.setAttribute('aria-label', 'Hasta');
        const mostrarFechas = () => { desde.classList.toggle('hidden', tipo.value === 'siempre'); hasta.classList.toggle('hidden', tipo.value === 'siempre'); };
        tipo.addEventListener('change', mostrarFechas);
        mostrarFechas();
        grilla.append(tipo, desde, hasta);
        const etiqueta = crear('label', 'mt-3 flex items-center gap-2 text-sm text-gray-700');
        const habilitar = crear('input', 'accent-violet-600 w-4 h-4'); habilitar.type = 'checkbox'; habilitar.checked = lote.habilitadoManual === true;
        etiqueta.append(habilitar, crear('span', '', 'Habilitar ahora, aunque todavía no sea la fecha'));
        fila.append(cabeza, estado, grilla, etiqueta);
        caja.appendChild(fila);
        return { indice, nombre: lote.nombre || `Lote ${indice + 1}`, tipo, desde, hasta, habilitar };
    });

    const error = crear('p', 'hidden mt-4 text-sm text-red-600');
    error.setAttribute('role', 'alert');
    const botones = crear('div', 'mt-6 flex justify-end gap-3');
    const cancelar = crear('button', 'px-5 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50', 'Cancelar'); cancelar.type = 'button';
    const guardar = crear('button', 'px-5 py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-semibold', 'Guardar cambios'); guardar.type = 'button';
    botones.append(cancelar, guardar);
    caja.append(error, botones);
    fondo.appendChild(caja);
    document.body.appendChild(fondo);
    const cerrar = () => fondo.remove();
    cancelar.addEventListener('click', cerrar);
    fondo.addEventListener('click', (e) => { if (e.target === fondo) cerrar(); });
    fondo.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
    (filas[0] ? filas[0].tipo : guardar).focus();

    guardar.addEventListener('click', async () => {
        const cambios = filas.map((f) => ({ indice: f.indice, nombre: f.nombre, tipo: f.tipo.value, desde: f.tipo.value === 'fechas' ? f.desde.value : '', hasta: f.tipo.value === 'fechas' ? f.hasta.value : '', habilitadoManual: f.habilitar.checked }));
        const problema = cambios.map((c) => { const p = validarFechasDeLote(c); return p ? `${c.nombre}: ${p}` : ''; }).find(Boolean);
        if (problema) { error.textContent = problema; error.classList.remove('hidden'); return; }
        guardar.disabled = true;
        try {
            await runTransaction(db, async (tx) => {
                const ref = doc(db, 'eventos', evento.id);
                const snap = await tx.get(ref);
                if (!snap.exists()) throw new Error('El evento ya no existe.');
                const actuales = Array.isArray(snap.data().lotes) ? snap.data().lotes : [];
                // Se parte de los lotes guardados AHORA y se cambian solo tipo, fechas, "habilitar" y el texto de vigencia
                const lotes = actuales.map((lote, i) => {
                    const c = cambios.find((x) => x.indice === i);
                    if (!c || (lote.nombre || `Lote ${i + 1}`) !== c.nombre) return lote; // el lote cambió: no se toca
                    const nuevo = { ...lote, tipo: c.tipo, desde: c.desde, hasta: c.hasta, habilitadoManual: c.habilitadoManual };
                    return { ...nuevo, vigencia: textoDeVigencia(nuevo) };
                });
                tx.update(ref, { lotes });
            });
            cerrar();
            alGuardar('Lotes guardados.');
        } catch (e) {
            console.error('No se pudieron guardar los lotes:', e);
            error.textContent = 'No se pudieron guardar los lotes. Probá de nuevo.';
            error.classList.remove('hidden');
            guardar.disabled = false;
        }
    });
}
