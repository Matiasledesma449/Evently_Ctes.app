// Cuentas de admin de las organizaciones (cambio ajustes-tras-vista-previa).
// El superadmin crea la cuenta desde el panel, sin servidor: se usa una SEGUNDA app de Firebase solo para dar de alta
// el usuario, así la sesión del superadmin no cambia. La clave se genera acá, se muestra una sola vez y no se guarda.

// Sin letras que se confunden (l, I, O, 0, 1) para que se pueda dictar o copiar a mano sin errores
const CARACTERES = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Genera una clave de `largo` caracteres. `aleatorio(arreglo)` llena un Uint32Array (por defecto, crypto.getRandomValues).
export function generarClave(largo = 12, aleatorio = (a) => crypto.getRandomValues(a)) {
    // Se repite hasta que tenga al menos una minúscula, una mayúscula y un número (casi siempre sale a la primera)
    for (let intento = 0; intento < 50; intento++) {
        const numeros = aleatorio(new Uint32Array(largo));
        let clave = '';
        for (let i = 0; i < largo; i++) clave += CARACTERES[numeros[i] % CARACTERES.length];
        if (/[a-z]/.test(clave) && /[A-Z]/.test(clave) && /[2-9]/.test(clave)) return clave;
    }
    throw new Error('No se pudo generar la clave.');
}

// Qué hacer con un correo al agregar un admin a una organización. Funciones puras: decide, no escribe.
// `cuenta` es el documento de usuarios con ese correo (o null), `organizacionId` la organización de la tarjeta.
// Devuelve { accion: 'crear' | 'vincular' | 'ya-esta' | 'mover' | 'no-se-puede', motivo? }
export function decidirAlta(cuenta, organizacionId) {
    if (!cuenta) return { accion: 'crear' };
    if (cuenta.rol === 'superadmin') return { accion: 'no-se-puede', motivo: 'Ese correo es de un superadmin: no puede ser admin de una organización.' };
    if (cuenta.rol !== 'organizacion') return { accion: 'no-se-puede', motivo: 'Ese correo es de una cuenta de comprador, no de una organización.' };
    const actual = typeof cuenta.organizacionId === 'string' ? cuenta.organizacionId.trim() : '';
    if (actual === organizacionId) return { accion: 'ya-esta' };
    if (actual) return { accion: 'mover' };
    return { accion: 'vincular' };
}

// Correo comparable: sin espacios y en minúsculas
export function normalizarCorreo(correo) {
    return typeof correo === 'string' ? correo.trim().toLowerCase() : '';
}

export function correoValido(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizarCorreo(correo));
}

// Crea el usuario de Firebase Auth con la segunda app y devuelve su uid. No cambia la sesión del superadmin.
// `firebase` trae las funciones de la SDK: { initializeApp, getApps, getAuth, createUserWithEmailAndPassword, signOut }.
export async function crearUsuarioDeAuth(firebase, opcionesDeLaApp, correo, clave) {
    const existente = firebase.getApps().find((a) => a.name === 'altas-de-admins');
    const app = existente || firebase.initializeApp(opcionesDeLaApp, 'altas-de-admins');
    const auth = firebase.getAuth(app);
    try {
        const credencial = await firebase.createUserWithEmailAndPassword(auth, normalizarCorreo(correo), clave);
        return credencial.user.uid;
    } finally {
        try { await firebase.signOut(auth); } catch (e) { /* ya estaba cerrada */ }
    }
}
