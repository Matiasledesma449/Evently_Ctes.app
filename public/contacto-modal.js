import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const modal = document.createElement('div');
modal.id = 'consultaModal';
modal.className = 'fixed inset-0 z-[100] hidden items-center justify-center bg-gray-950/60 p-4';
modal.innerHTML = `
    <section class="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="consultaTitulo">
        <div class="mb-5 flex items-start justify-between gap-4">
            <div>
                <h2 id="consultaTitulo" class="text-xl font-bold text-gray-900">Contactar a Evently</h2>
                <p class="mt-1 text-sm text-gray-500">Dejanos tus datos y te responderemos por correo.</p>
            </div>
            <button id="cerrarConsulta" type="button" class="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Cerrar formulario">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>
        <form id="consultaForm" class="space-y-4">
            <div>
                <label for="consultaNombre" class="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
                <input id="consultaNombre" name="nombre" type="text" maxlength="100" autocomplete="name" required class="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200">
            </div>
            <div>
                <label for="consultaEmail" class="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input id="consultaEmail" name="email" type="email" maxlength="254" autocomplete="email" required class="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200">
            </div>
            <div>
                <label for="consultaMensaje" class="mb-1 block text-sm font-medium text-gray-700">Mensaje</label>
                <textarea id="consultaMensaje" name="mensaje" rows="4" maxlength="5000" required class="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"></textarea>
            </div>
            <button id="enviarConsulta" type="submit" class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60">
                <span class="material-symbols-outlined text-base">send</span> Enviar consulta
            </button>
        </form>
        <p id="consultaFeedback" class="mt-4 hidden rounded-lg p-3 text-sm" role="status" aria-live="polite"></p>
    </section>
`;
document.body.appendChild(modal);

const form = modal.querySelector('#consultaForm');
const feedback = modal.querySelector('#consultaFeedback');
const submitButton = modal.querySelector('#enviarConsulta');
let origenActual = 'public/index.html';
let ultimoDisparador = null;

function cerrarModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
    ultimoDisparador?.focus();
}

function abrirModal(disparador) {
    ultimoDisparador = disparador;
    origenActual = disparador.dataset.origen === 'public/evento.html'
        ? 'public/evento.html'
        : 'public/index.html';
    feedback.className = 'mt-4 hidden rounded-lg p-3 text-sm';
    feedback.textContent = '';
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
    modal.querySelector('#consultaNombre').focus();
}

function mostrarFeedback(texto, exito) {
    feedback.className = `mt-4 rounded-lg border p-3 text-sm ${exito ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`;
    feedback.textContent = texto;
}

document.querySelectorAll('[data-open-consulta]').forEach(disparador => {
    disparador.addEventListener('click', () => abrirModal(disparador));
});

modal.querySelector('#cerrarConsulta').addEventListener('click', cerrarModal);
modal.addEventListener('click', event => {
    if (event.target === modal) cerrarModal();
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) cerrarModal();
});

form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!window.db) {
        mostrarFeedback('No se pudo conectar con el servicio. Intentá nuevamente.', false);
        return;
    }

    const nombre = form.elements.namedItem('nombre').value.trim();
    const email = form.elements.namedItem('email').value.trim();
    const mensaje = form.elements.namedItem('mensaje').value.trim();
    if (!nombre || !email || !mensaje) {
        mostrarFeedback('Completá nombre, email y mensaje.', false);
        return;
    }

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="material-symbols-outlined animate-spin text-base">progress_activity</span> Enviando...';
    try {
        await addDoc(collection(window.db, 'consultas_publicas'), {
            nombre,
            email,
            mensaje,
            estado: 'nueva',
            fecha: serverTimestamp(),
            origen: origenActual
        });

        form.reset();
        mostrarFeedback(`Recibimos tu consulta. Te responderemos a ${email}.`, true);
    } catch (error) {
        console.error('Error al crear consulta pública:', error);
        mostrarFeedback('No se pudo enviar la consulta. Intentá nuevamente.', false);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<span class="material-symbols-outlined text-base">send</span> Enviar consulta';
    }
});
