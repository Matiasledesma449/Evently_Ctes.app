// public/assets/js/data.js
// Datos de ejemplo para eventos y lotes
// En el futuro, estos datos vendrán de Firebase

const eventosData = [
    {
        id: 1,
        nombre: 'Bali Group Summer Fest 2024',
        fecha: '15 Agosto 2024',
        lugar: 'Complejo Municipal, Saladas',
        descripcion: 'El evento más esperado del verano. Música, baile y diversión para toda la familia.',
        imagen: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop',
        lotes: [
            { nombre: 'Lote 1 (Early Bird)', precio: 15000, disponibles: 300, vendidas: 0, vigencia: '01/09 — 07/09' },
            { nombre: 'Lote 2', precio: 25000, disponibles: 300, vendidas: 0, vigencia: '08/09 — 14/09' },
            { nombre: 'Lote 3', precio: 35000, disponibles: 400, vendidas: 0, vigencia: '15/09 — 21/09' }
        ],
        metodosPago: ['Efectivo', 'Transferencia', 'Débito', 'Crédito', 'Mixto']
    },
    {
        id: 2,
        nombre: 'Noche de Comedia: Stand Up',
        fecha: '22 Septiembre 2024',
        lugar: 'Teatro Municipal, Saladas',
        descripcion: 'Una noche de risas con los mejores comediantes de la región.',
        imagen: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&h=400&fit=crop',
        lotes: [
            { nombre: 'Lote 1', precio: 10000, disponibles: 200, vendidas: 0, vigencia: '01/09 — 10/09' },
            { nombre: 'Lote 2', precio: 15000, disponibles: 200, vendidas: 0, vigencia: '11/09 — 20/09' }
        ],
        metodosPago: ['Efectivo', 'Transferencia', 'Débito', 'Crédito', 'Mixto']
    },
    {
        id: 3,
        nombre: 'Gala Anual Corporativa 2024',
        fecha: '02 Octubre 2024',
        lugar: 'Salón de Eventos, Saladas',
        descripcion: 'Celebración anual de la empresa con cena, música y premios.',
        imagen: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop',
        lotes: [
            { nombre: 'Lote 1', precio: 20000, disponibles: 150, vendidas: 0, vigencia: '01/09 — 15/09' },
            { nombre: 'Lote 2', precio: 25000, disponibles: 150, vendidas: 0, vigencia: '16/09 — 30/09' }
        ],
        metodosPago: ['Efectivo', 'Transferencia', 'Débito', 'Crédito', 'Mixto']
    }
];

// Función para obtener un evento por su ID
function getEventoById(id) {
    return eventosData.find(e => e.id === parseInt(id));
}

// Función para obtener todos los eventos
function getEventos() {
    return eventosData;
}