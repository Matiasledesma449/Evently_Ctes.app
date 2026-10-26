// shared/categorias-comision.js
// Categorías de costo de servicio que edita el superadmin (documento configuracion/comisiones).
// Funciones puras: no tocan la página ni Firestore, así se prueban con node (prueba 26).

import { PORCENTAJE_MAXIMO_COMISION } from './comision.js';

export const LARGO_MAXIMO_NOMBRE_CATEGORIA = 40;

const MENSAJE_PORCENTAJE = `El porcentaje debe ser un número entre 0 y ${PORCENTAJE_MAXIMO_COMISION}, con hasta 2 decimales (por ejemplo 7,5).`;

// Valida lo que escribió el superadmin. `porcentaje` puede ser número o texto (acepta coma o punto).
// Devuelve { ok: true, datos: { nombre, porcentaje } } o { ok: false, campo, mensaje }.
export function validarCategoria(entrada) {
    const { nombre, porcentaje } = entrada && typeof entrada === 'object' ? entrada : {};
    const limpio = typeof nombre === 'string' ? nombre.replace(/\s+/g, ' ').trim() : '';
    if (limpio === '' || limpio.length > LARGO_MAXIMO_NOMBRE_CATEGORIA) {
        return { ok: false, campo: 'nombre', mensaje: `El nombre debe tener entre 1 y ${LARGO_MAXIMO_NOMBRE_CATEGORIA} caracteres.` };
    }

    let numero = NaN;
    if (typeof porcentaje === 'number') {
        numero = porcentaje;
    } else if (typeof porcentaje === 'string') {
        const texto = porcentaje.trim().replace(',', '.');
        // Solo dígitos con hasta 2 decimales: "8", "7.5", "12.25" (nada de "1e1", "0x10" ni signos)
        if (/^\d{1,3}(\.\d{1,2})?$/.test(texto)) numero = Number(texto);
    }
    const dosDecimales = Number.isFinite(numero) && Math.round(numero * 100) / 100 === numero;
    if (!dosDecimales || numero < 0 || numero > PORCENTAJE_MAXIMO_COMISION) {
        return { ok: false, campo: 'porcentaje', mensaje: MENSAJE_PORCENTAJE };
    }
    return { ok: true, datos: { nombre: limpio, porcentaje: numero } };
}

// Las categorías del documento de configuración, como lista (vacía si no hay), ordenadas por nombre
export function categoriasOrdenadas(config) {
    const lista = config && Array.isArray(config.categorias) ? config.categorias : [];
    return lista
        .filter((c) => c && typeof c === 'object' && typeof c.id === 'string' && c.id !== '')
        .map((c) => ({ id: c.id, nombre: typeof c.nombre === 'string' ? c.nombre : '', porcentaje: c.porcentaje }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

// Id nuevo para una categoría: "cat-" + el siguiente número libre. Nunca repite uno que ya exista.
export function nuevoIdDeCategoria(categorias) {
    const usados = new Set((Array.isArray(categorias) ? categorias : []).map((c) => c && c.id));
    let n = 1;
    for (const id of usados) {
        const m = /^cat-(\d+)$/.exec(String(id));
        if (m) n = Math.max(n, Number(m[1]) + 1);
    }
    while (usados.has(`cat-${n}`)) n++;
    return `cat-${n}`;
}

// Texto para mostrar el porcentaje: 8 -> "8%", 7.5 -> "7,5%"
export function textoDePorcentaje(porcentaje) {
    const n = Number(porcentaje);
    return `${Number.isFinite(n) ? String(n).replace('.', ',') : '0'}%`;
}
