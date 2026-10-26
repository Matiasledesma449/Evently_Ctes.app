// Estado nuevo / leído / respondido de las conversaciones de Mensajes y de las Consultas públicas, y la lista de organizaciones de "Nuevo mensaje".
// Son solo cálculos sobre datos ya leídos, sin red ni base de datos. Los textos se devuelven como texto: quien los muestre los escapa.
// Una conversación vieja (sin `ultimoDe`) se ve como "leído".

const ESTADOS = ['nuevo', 'leido', 'respondido'];

const PRESENTACION = {
    nuevo: {
        etiqueta: 'Nuevo',
        clasesInsignia: 'bg-amber-100 text-amber-800',
        clasesPunto: 'bg-amber-500',
        negrita: true
    },
    leido: {
        etiqueta: 'Leído',
        clasesInsignia: 'bg-gray-100 text-gray-700',
        clasesPunto: 'bg-gray-300',
        negrita: false
    },
    respondido: {
        etiqueta: 'Respondido',
        clasesInsignia: 'bg-green-100 text-green-800',
        clasesPunto: 'bg-green-500',
        negrita: false
    }
};

const TEXTOS_VACIOS = {
    'mensajes-sin-conversaciones': {
        titulo: 'Todavía no hay conversaciones',
        ayuda: 'Tocá "Nuevo mensaje" para escribirle a una organización.',
        verTodas: false
    },
    'consultas-sin-consultas': {
        titulo: 'Todavía no llegó ninguna consulta',
        ayuda: 'Acá van a aparecer los mensajes que lleguen desde el sitio público.',
        verTodas: false
    },
    'filtro-sin-resultados': {
        titulo: 'No hay resultados para este filtro',
        ayuda: 'Hay otros mensajes: probá con otro estado o mirá todos.',
        verTodas: true
    },
    'organizaciones-sin-resultados': {
        titulo: 'No hay organizaciones para mostrar',
        ayuda: 'Probá con otro nombre o correo. Si no hay ninguna registrada, todavía no se puede escribir a nadie.',
        verTodas: false
    }
};

// Saca tildes y mayúsculas para comparar nombres y correos.
function normalizar(texto) {
    return String(texto == null ? '' : texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// 'nuevo' | 'leido' | 'respondido' de una conversación vista por `miUid`.
export function estadoDeConversacion(conv, miUid) {
    const ultimoDe = conv && typeof conv.ultimoDe === 'string' ? conv.ultimoDe : '';
    if (!ultimoDe) return 'leido';
    if (ultimoDe === miUid) return 'respondido';
    return conv.ultimoLeido === true ? 'leido' : 'nuevo';
}

// 'nuevo' | 'leido' | 'respondido' de una consulta pública (`nueva`, `leida`, `respondida`). Lo desconocido se ve como leído.
export function estadoDeConsulta(consulta) {
    const estado = consulta ? consulta.estado : '';
    if (estado === 'nueva') return 'nuevo';
    if (estado === 'respondida') return 'respondido';
    return 'leido';
}

// { nuevo, leido, respondido, total } para los contadores del filtro.
export function contarPorEstado(lista, funcionDeEstado) {
    const cuenta = { nuevo: 0, leido: 0, respondido: 0, total: 0 };
    (Array.isArray(lista) ? lista : []).forEach((elemento) => {
        const estado = funcionDeEstado(elemento);
        if (ESTADOS.includes(estado)) cuenta[estado]++;
        cuenta.total++;
    });
    return cuenta;
}

// Texto y clases de cada estado, para que las dos pantallas coincidan. Un estado desconocido se ve como leído.
export function presentacionDeEstado(estado) {
    return { ...(PRESENTACION[estado] || PRESENTACION.leido) };
}

// 'todos' devuelve todo; si no, solo los de ese estado.
export function filtrarPorEstado(lista, filtro, funcionDeEstado) {
    const elementos = Array.isArray(lista) ? lista : [];
    if (!ESTADOS.includes(filtro)) return elementos.slice();
    return elementos.filter((elemento) => funcionDeEstado(elemento) === filtro);
}

// Las organizaciones de la lista de usuarios (sin `miUid`), con `conversacionId` si ya hay conversación, por nombre y filtradas por `textoBuscado`.
export function organizacionesParaChat(usuarios, miUid, conversaciones, textoBuscado) {
    const conversacionPorUid = {};
    (Array.isArray(conversaciones) ? conversaciones : []).forEach((conv) => {
        const participantes = conv && Array.isArray(conv.participantes) ? conv.participantes : [];
        participantes.forEach((uid) => {
            if (uid !== miUid && !conversacionPorUid[uid]) conversacionPorUid[uid] = conv.id;
        });
    });

    const buscado = normalizar(textoBuscado);
    return (Array.isArray(usuarios) ? usuarios : [])
        .filter((u) => u && u.rol === 'organizacion' && u.id && u.id !== miUid)
        .map((u) => ({
            id: u.id,
            nombre: typeof u.nombre === 'string' && u.nombre.trim() ? u.nombre.trim() : 'Organización sin nombre',
            email: typeof u.email === 'string' ? u.email.trim() : '',
            conversacionId: conversacionPorUid[u.id] || ''
        }))
        .filter((o) => !buscado || normalizar(o.nombre).includes(buscado) || normalizar(o.email).includes(buscado))
        .sort((a, b) => normalizar(a.nombre).localeCompare(normalizar(b.nombre), 'es'));
}

// { titulo, ayuda, verTodas } de cada estado vacío; un contexto desconocido usa el del filtro sin resultados.
export function textoVacio(contexto) {
    return { ...(TEXTOS_VACIOS[contexto] || TEXTOS_VACIOS['filtro-sin-resultados']) };
}
