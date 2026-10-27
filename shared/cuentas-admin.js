// Cuentas de admin de las organizaciones (cambios ajustes-tras-vista-previa y -2).
// El superadmin crea la cuenta desde el panel, sin servidor: se usa una SEGUNDA app de Firebase solo para dar de alta
// el usuario, así la sesión del superadmin no cambia. La clave la escribe el superadmin o se genera acá;
// se muestra una sola vez y no se guarda en ningún lado.

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

// El motivo, en palabras simples, de un error de Firebase al crear la cuenta (con su código, para poder ayudar)
export function motivoDeErrorDeAlta(error) {
    const codigo = error && typeof error.code === 'string' ? error.code : '';
    const motivos = {
        'auth/email-already-in-use': 'Ese correo ya tiene acceso a Evently pero no figura como cuenta de organización.',
        'auth/invalid-email': 'Ese correo no es válido.',
        'auth/weak-password': 'Firebase dice que la clave es débil: probá con una más larga, con mayúsculas, números y un símbolo.',
        'auth/password-does-not-meet-requirements': 'La clave no cumple las reglas de contraseña del proyecto: usá al menos una mayúscula, una minúscula, un número y un símbolo.',
        'auth/operation-not-allowed': 'En Firebase está apagado el acceso con correo y contraseña.',
        'auth/admin-restricted-operation': 'En Firebase está apagada la creación de cuentas nuevas desde la página (Authentication → Configuración → Acciones del usuario).',
        'auth/network-request-failed': 'No hay conexión con Firebase. Revisá internet y probá de nuevo.',
        'auth/too-many-requests': 'Firebase frenó los intentos por un rato. Esperá unos minutos y probá de nuevo.',
    };
    const texto = motivos[codigo] || 'No se pudo crear la cuenta.';
    return codigo ? `${texto} (código: ${codigo})` : texto;
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
