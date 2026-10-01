// ==========================================
// admin/aprobaciones.js
// Lógica de solicitudes pendientes en superadmin.html
// ==========================================

const db = window.db;
const auth = window.auth;

import {
    collection, query, where, onSnapshot, doc, updateDoc, setDoc,
    serverTimestamp, getDoc, getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Referencias al DOM (IDs únicos del modal de confirmación)
const seccionSolicitudes = document.getElementById('seccion-solicitudes');
const gridSolicitudes = document.getElementById('grid-solicitudes');
const contadorSolicitudes = document.getElementById('contador-solicitudes');

const modal = document.getElementById('modalConfirmacion');
const modalTitulo = document.getElementById('modalConfirmacionTitulo');
const modalMensaje = document.getElementById('modalConfirmacionMensaje');
const contenedorMotivo = document.getElementById('contenedorMotivoConfirmacion');
const inputMotivo = document.getElementById('inputMotivoConfirmacion');
const btnCancelar = document.getElementById('btnCancelarModalConfirmacion');
const btnConfirmar = document.getElementById('btnConfirmarModalConfirmacion');

let accionPendiente = null;
let solicitudSeleccionada = null;
const organizacionesPorClave = new Map();

// ==========================================
// 1. VERIFICACIÓN DE SEGURIDAD (SUPERADMIN)
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userDocRef = doc(db, 'usuarios', user.uid);
            const userSnap = await getDoc(userDocRef);

            if (userSnap.exists() && userSnap.data().rol === 'superadmin') {
                seccionSolicitudes.classList.remove('hidden');
                await cargarOrganizaciones();
                inicializarSolicitudes();
            }
        } catch (error) {
            console.error('Error verificando el rol del usuario:', error);
        }
    }
});

async function cargarOrganizaciones() {
    try {
        const organizacionesSnap = await getDocs(query(
            collection(db, 'usuarios'),
            where('rol', '==', 'organizacion')
        ));

        organizacionesSnap.forEach(orgSnap => {
            const organizacion = { id: orgSnap.id, ...orgSnap.data() };
            [organizacion.id, organizacion.organizacionId, organizacion.email?.toLowerCase()]
                .filter(Boolean)
                .forEach(clave => organizacionesPorClave.set(clave, organizacion));
        });
    } catch (error) {
        console.error('No se pudieron cargar las organizaciones para agrupar solicitudes:', error);
    }
}

// ==========================================
// 2. ESCUCHAR SOLICITUDES EN TIEMPO REAL
// ==========================================
function inicializarSolicitudes() {
    const q = query(
        collection(db, 'solicitudes_eventos'),
        where('estado', '==', 'pendiente')
    );

    onSnapshot(q, (snapshot) => {
        gridSolicitudes.innerHTML = '';

        const cantidad = snapshot.size;
        contadorSolicitudes.textContent = cantidad;

        if (cantidad === 0) {
            gridSolicitudes.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-12">
                    <div class="w-16 h-16 mb-4 text-gray-300">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <p class="text-gray-500 font-medium text-lg">No hay solicitudes pendientes</p>
                </div>
            `;
            return;
        }

        const grupos = new Map();
        snapshot.forEach(docSnap => {
            const solicitud = { id: docSnap.id, ...docSnap.data() };
            const organizacion = organizacionesPorClave.get(solicitud.organizacionId)
                || organizacionesPorClave.get(solicitud.creadoPor)
                || organizacionesPorClave.get(solicitud.correo?.toLowerCase());
            const clave = organizacion?.id || solicitud.organizacionId || solicitud.creadoPor || solicitud.correo || 'sin-organizacion';
            const nombre = organizacion?.nombre || solicitud.nombreOrganizacion || solicitud.organizacionId || solicitud.correo || 'Organización no identificada';

            if (!grupos.has(clave)) grupos.set(clave, { nombre, solicitudes: [] });
            grupos.get(clave).solicitudes.push(solicitud);
        });

        [...grupos.values()]
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
            .forEach(grupo => {
                const seccionGrupo = document.createElement('section');
                seccionGrupo.className = 'col-span-full';

                const encabezado = document.createElement('h3');
                encabezado.className = 'text-lg font-semibold text-gray-800 mb-3';
                encabezado.textContent = `${grupo.nombre} (${grupo.solicitudes.length} ${grupo.solicitudes.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'})`;

                const gridGrupo = document.createElement('div');
                gridGrupo.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
                seccionGrupo.append(encabezado, gridGrupo);
                gridSolicitudes.appendChild(seccionGrupo);
                grupo.solicitudes.forEach(solicitud => renderizarCard(solicitud, gridGrupo));
            });
    });
}

// ==========================================
// 3. RENDERIZADO DE TARJETAS
// ==========================================
function renderizarCard(solicitud, contenedor = gridSolicitudes) {
    const imagenUrl = solicitud.imagen || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=400&auto=format&fit=crop';
    const lotesCount = solicitud.lotes ? solicitud.lotes.length : 0;

    const cardHTML = `
        <div class="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col border border-gray-100">
            <div class="relative h-48 w-full">
                <img src="${imagenUrl}" alt="Portada" class="w-full h-full object-cover">
                <div class="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-violet-700 shadow">PENDIENTE</div>
            </div>

            <div class="p-5 flex-1 flex flex-col">
                <h3 class="text-xl font-bold text-gray-900 mb-1 truncate" title="${solicitud.nombre}">${solicitud.nombre || 'Sin título'}</h3>

                <div class="space-y-2 mt-3 text-sm text-gray-600 flex-1">
                    <p class="flex items-center truncate" title="${solicitud.correo}">
                        <span class="w-5 text-gray-400">👤</span> <strong class="mr-1">Cliente:</strong> ${solicitud.correo || 'Desconocido'}
                    </p>
                    <p class="flex items-center">
                        <span class="w-5 text-gray-400">📅</span> <strong class="mr-1">Fecha:</strong> ${solicitud.fecha || 'Sin definir'}
                    </p>
                    <p class="flex items-center">
                        <span class="w-5 text-gray-400">📍</span> <strong class="mr-1">Lugar:</strong> ${solicitud.lugar || 'Sin definir'}
                    </p>
                    <p class="flex items-center">
                        <span class="w-5 text-gray-400">🎟️</span> <strong class="mr-1">Lotes:</strong> ${lotesCount} configurados
                    </p>
                </div>

                <div class="flex space-x-3 mt-6 pt-4 border-t border-gray-100">
                    <button type="button" class="btn-rechazar flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition" data-id="${solicitud.id}">
                        Rechazar
                    </button>
                    <button type="button" class="btn-publicar flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 px-4 rounded-lg transition shadow-md" data-id="${solicitud.id}">
                        Publicar
                    </button>
                </div>
            </div>
        </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = cardHTML.trim();
    const cardElement = div.firstChild;

    cardElement.dataset.solicitud = JSON.stringify(solicitud);

    cardElement.querySelector('.btn-publicar').addEventListener('click', () => abrirModal('publicar', cardElement));
    cardElement.querySelector('.btn-rechazar').addEventListener('click', () => abrirModal('rechazar', cardElement));

    contenedor.appendChild(cardElement);
}

// ==========================================
// 4. LÓGICA DEL MODAL DE CONFIRMACIÓN
// ==========================================
function abrirModal(accion, cardElement) {
    solicitudSeleccionada = JSON.parse(cardElement.dataset.solicitud);
    accionPendiente = accion;

    if (accion === 'publicar') {
        modalTitulo.textContent = 'Publicar Evento';
        modalMensaje.innerHTML = `¿Confirmas la publicación de <strong>${solicitudSeleccionada.nombre}</strong>? Pasará a la cartelera pública.`;
        contenedorMotivo.classList.add('hidden');
        btnConfirmar.textContent = 'Sí, Publicar';
        btnConfirmar.className = 'px-5 py-2 text-white font-medium rounded-lg transition shadow-md min-w-[120px] bg-violet-600 hover:bg-violet-700';
    } else {
        modalTitulo.textContent = 'Rechazar Solicitud';
        modalMensaje.innerHTML = `Vas a rechazar el evento <strong>${solicitudSeleccionada.nombre}</strong>.`;
        contenedorMotivo.classList.remove('hidden');
        inputMotivo.value = '';
        btnConfirmar.textContent = 'Rechazar Evento';
        btnConfirmar.className = 'px-5 py-2 text-white font-medium rounded-lg transition shadow-md min-w-[120px] bg-red-500 hover:bg-red-600';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

btnCancelar.addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
});

btnConfirmar.addEventListener('click', async () => {
    if (!solicitudSeleccionada) return;

    const textoOriginal = btnConfirmar.textContent;
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = `<span class="animate-pulse">Procesando...</span>`;
    btnConfirmar.classList.add('opacity-75', 'cursor-not-allowed');

    try {
        if (accionPendiente === 'publicar') {
            await procesarPublicacion(solicitudSeleccionada);
        } else if (accionPendiente === 'rechazar') {
            const motivo = inputMotivo.value.trim();
            await procesarRechazo(solicitudSeleccionada.id, motivo);
        }

        modal.classList.add('hidden');
        modal.classList.remove('flex');
    } catch (error) {
        console.error('Error al procesar solicitud:', error);
        alert('Ocurrió un error: ' + error.message);
    } finally {
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = textoOriginal;
        btnConfirmar.classList.remove('opacity-75', 'cursor-not-allowed');
    }
});

// ==========================================
// 5. OPERACIONES A FIREBASE FIRESTORE
// ==========================================
async function procesarPublicacion(solicitud) {
    const solicitudRef = doc(db, 'solicitudes_eventos', solicitud.id);
    const eventoRef = doc(db, 'eventos', solicitud.id);

    const dataEvento = { ...solicitud };
    delete dataEvento.id;
    dataEvento.estado = 'publicado';
    dataEvento.fechaPublicacion = serverTimestamp();

    await setDoc(eventoRef, dataEvento);
    await updateDoc(solicitudRef, { estado: 'aprobada' });
}

async function procesarRechazo(solicitudId, motivo) {
    const solicitudRef = doc(db, 'solicitudes_eventos', solicitudId);

    await updateDoc(solicitudRef, {
        estado: 'rechazada',
        motivoRechazo: motivo || 'Rechazado por el administrador sin motivo especificado.',
        fechaRechazo: serverTimestamp()
    });
}