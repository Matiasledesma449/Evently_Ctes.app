// Cuentas de admin de las organizaciones (cambios ajustes-tras-vista-previa, -2 y -3).
// El superadmin escribe correo y clave (o la genera acá); la cuenta la crea el servidor (/api/crear-admin), porque el
// proyecto de Firebase no deja crear cuentas desde la página. La clave se muestra una sola vez y no se guarda.

// Sin letras que se confunden (l, I, O, 0, 1) para que se pueda dictar o copiar a mano sin errores
const LETRAS = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// Algunos proyectos de Firebase piden un símbolo en la contraseña: la clave generada siempre lleva uno
const SIMBOLOS = '!#$%*?';
export const LARGO_MINIMO_DE_CLAVE = 8;

// Genera una clave de `largo` caracteres con minúscula, mayúscula, número y símbolo.
// `aleatorio(arreglo)` llena un Uint32Array (por defecto, crypto.getRandomValues).
export function generarClave(largo = 12, aleatorio = (a) => crypto.getRandomValues(a)) {
    for (let intento = 0; intento < 50; intento++) {
        const numeros = aleatorio(new Uint32Array(largo));
        let clave = '';
        for (let i = 0; i < largo - 1; i++) clave += LETRAS[numeros[i] % LETRAS.length];
        // El símbolo va en un lugar al azar
        const simbolo = SIMBOLOS[numeros[largo - 1] % SIMBOLOS.length];
        const lugar = numeros[0] % largo;
        clave = clave.slice(0, lugar) + simbolo + clave.slice(lugar);
        if (/[a-z]/.test(clave) && /[A-Z]/.test(clave) && /[2-9]/.test(clave)) return clave;
    }
    throw new Error('No se pudo generar la clave.');
}

// Valida la clave que escribe el superadmin. Devuelve el problema o ''.
export function validarClave(clave) {
    if (typeof clave !== 'string' || clave.length < LARGO_MINIMO_DE_CLAVE) return `La clave tiene que tener al menos ${LARGO_MINIMO_DE_CLAVE} caracteres.`;
    if (/\s/.test(clave)) return 'La clave no puede tener espacios.';
    if (!/[a-z]/.test(clave) || !/[A-Z]/.test(clave) || !/[0-9]/.test(clave)) return 'La clave tiene que tener al menos una minúscula, una mayúscula y un número.';
    if (!/[^a-zA-Z0-9]/.test(clave)) return 'La clave tiene que tener al menos un símbolo (por ejemplo ! # $ % * ?).';
    return '';
}

// Qué hacer con un correo al agregar un admin a una organización. Función pura: decide, no escribe.
// `cuenta` es el documento de usuarios con ese correo (o null), `organizacionId` la organización de la tarjeta.
// Devuelve { accion: 'crear' | 'vincular' | 'ya-esta' | 'en-otra' | 'no-se-puede', motivo? }.
// Un correo es admin de UNA sola organización: si ya está en otra, no se mueve (primero hay que quitarlo de allá).
export function decidirAlta(cuenta, organizacionId) {
    if (!cuenta) return { accion: 'crear' };
    if (cuenta.rol === 'superadmin') return { accion: 'no-se-puede', motivo: 'Ese correo es de un superadmin: no puede ser admin de una organización.' };
    if (cuenta.rol !== 'organizacion') return { accion: 'no-se-puede', motivo: 'Ese correo es de una cuenta de comprador, no de una organización.' };
    const actual = typeof cuenta.organizacionId === 'string' ? cuenta.organizacionId.trim() : '';
    if (actual === organizacionId) return { accion: 'ya-esta' };
    if (actual) return { accion: 'en-otra' };
    return { accion: 'vincular' };
}

// Correo comparable: sin espacios y en minúsculas
export function normalizarCorreo(correo) {
    return typeof correo === 'string' ? correo.trim().toLowerCase() : '';
}

export function correoValido(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizarCorreo(correo));
}
