// Campo de lugar con sugerencias (Nominatim, OpenStreetMap) y mapa (Leaflet). Se usa en admin/eventos.html y en public/evento.html.
// Leaflet se carga por CDN antes que este archivo (queda en window.L). Sin red o sin Leaflet, el campo sigue siendo texto.
// Los textos que vienen del servicio se muestran con textContent, nunca como HTML.
import { armarUbicacion } from './evento-datos.js';

const URL_BUSQUEDA = 'https://nominatim.openstreetmap.org/search';
const ESPERA_ENTRE_TECLAS = 600; // Nominatim pide uso moderado: una búsqueda cada tanto, no una por tecla
const MINIMO_DE_LETRAS = 4;
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATRIBUCION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

// Carga Leaflet (hoja de estilos y script) solo cuando hace falta. Resuelve false si no se pudo cargar.
export function cargarLeaflet() {
    if (window.L) return Promise.resolve(true);
    return new Promise((resolver) => {
        const estilo = document.createElement('link');
        estilo.rel = 'stylesheet';
        estilo.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(estilo);
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolver(Boolean(window.L));
        script.onerror = () => resolver(false);
        document.head.appendChild(script);
    });
}

// Dibuja (o mueve) el mapa con un marcador. Devuelve false si Leaflet no está disponible.
export function dibujarMapa(contenedor, ubicacion, estado = {}) {
    const u = ubicacion && armarUbicacion(ubicacion.lat, ubicacion.lng);
    if (!contenedor || !u || !window.L) return false;
    contenedor.classList.remove('hidden');
    if (!estado.mapa) {
        estado.mapa = window.L.map(contenedor, { scrollWheelZoom: false }).setView([u.lat, u.lng], 16);
        window.L.tileLayer(TILES, { maxZoom: 19, attribution: ATRIBUCION }).addTo(estado.mapa);
        estado.marcador = window.L.marker([u.lat, u.lng]).addTo(estado.mapa);
    } else {
        estado.mapa.setView([u.lat, u.lng], 16);
        estado.marcador.setLatLng([u.lat, u.lng]);
    }
    setTimeout(() => estado.mapa.invalidateSize(), 0); // el contenedor estaba oculto: Leaflet recalcula su tamaño
    return true;
}

// Conecta el campo de lugar con las sugerencias y el mapa.
// { input, lista, mapa, aviso }: el campo de texto, la lista de sugerencias, el contenedor del mapa y el párrafo de avisos.
export function activarLugarConMapa({ input, lista, mapa, aviso }) {
    let ubicacion = null;
    let temporizador = null;
    let version = 0;
    const estadoMapa = {};

    function decir(texto) {
        aviso.textContent = texto;
        aviso.classList.toggle('hidden', !texto);
    }

    function cerrarLista() {
        lista.replaceChildren();
        lista.classList.add('hidden');
    }

    function ocultarMapa() {
        mapa.classList.add('hidden');
    }

    function elegir(sugerencia) {
        const u = armarUbicacion(sugerencia.lat, sugerencia.lon);
        if (!u) return;
        input.value = sugerencia.display_name;
        ubicacion = u;
        cerrarLista();
        decir('');
        if (!dibujarMapa(mapa, u, estadoMapa)) decir('No se pudo mostrar el mapa, pero el lugar queda guardado.');
    }

    function mostrarSugerencias(resultados) {
        lista.replaceChildren();
        for (const r of resultados) {
            if (!r || typeof r.display_name !== 'string' || !armarUbicacion(r.lat, r.lon)) continue;
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-violet-50';
            boton.textContent = r.display_name;
            boton.addEventListener('click', () => elegir(r));
            lista.appendChild(boton);
        }
        lista.classList.toggle('hidden', lista.children.length === 0);
        if (lista.children.length === 0) decir('No encontramos sugerencias. Podés escribir el lugar igual.');
    }

    async function buscar(texto) {
        const miVersion = ++version;
        try {
            const parametros = new URLSearchParams({ q: texto, format: 'json', limit: '5', countrycodes: 'ar', 'accept-language': 'es' });
            const respuesta = await fetch(`${URL_BUSQUEDA}?${parametros}`);
            if (!respuesta.ok) throw new Error('servicio');
            const resultados = await respuesta.json();
            if (miVersion !== version) return; // escribió otra cosa mientras tanto
            decir('');
            mostrarSugerencias(Array.isArray(resultados) ? resultados : []);
        } catch (error) {
            if (miVersion !== version) return;
            cerrarLista();
            decir('No pudimos buscar sugerencias ahora. Podés escribir el lugar igual.');
        }
    }

    input.addEventListener('input', () => {
        // Si vuelve a escribir, la ubicación elegida ya no corresponde al texto: se descarta
        ubicacion = null;
        ocultarMapa();
        clearTimeout(temporizador);
        version++;
        const texto = input.value.trim();
        if (texto.length < MINIMO_DE_LETRAS) {
            cerrarLista();
            decir('');
            return;
        }
        temporizador = setTimeout(() => buscar(texto), ESPERA_ENTRE_TECLAS);
    });

    document.addEventListener('click', (evento) => {
        if (evento.target !== input && !lista.contains(evento.target)) cerrarLista();
    });

    return {
        obtenerUbicacion: () => ubicacion,
        limpiar() {
            clearTimeout(temporizador);
            version++;
            ubicacion = null;
            cerrarLista();
            decir('');
            ocultarMapa();
        }
    };
}
