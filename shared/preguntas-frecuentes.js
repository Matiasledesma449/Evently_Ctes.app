// Preguntas frecuentes del Centro de ayuda (public/soporte.html): los temas, las preguntas y el buscador.
// Es un borrador: solo afirma lo que el sitio hace. Lo que depende de una política de la productora
// (anulaciones, reprogramaciones) manda a escribir una consulta hasta que esa política exista.
// Son solo datos y funciones puras: sin red, sin base de datos y sin tocar la página.
import { textoDeFormasDePago } from './formas-de-pago.js';

// Mayúsculas, minúsculas y acentos no cuentan al buscar: "ENTRADA" encuentra "entrada" y "devolucion" encuentra "devolución"
export function normalizarTexto(texto) {
    if (typeof texto !== 'string') return '';
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// Cada respuesta es una lista de párrafos (texto plano; la página los dibuja con textContent)
export const TEMAS_DE_AYUDA = [
    {
        id: 'como-comprar',
        titulo: 'Cómo comprar',
        preguntas: [
            {
                pregunta: '¿Cómo compro entradas?',
                respuesta: [
                    'Elegí el evento en el inicio y tocá "Ver entradas". Elegí el tipo de entrada y la cantidad, y tocá "Continuar con el pago".',
                    'Completá tu nombre, apellido y correo, revisá el resumen y tocá el botón de pago. Vas a pasar a la página de Mercado Pago para pagar.'
                ]
            },
            {
                pregunta: '¿Cuántas entradas puedo comprar de una vez?',
                respuesta: ['Hasta 10 entradas por compra, siempre que haya lugares disponibles en el tipo de entrada que elegiste.']
            }
        ]
    },
    {
        id: 'pagos',
        titulo: 'Pagos',
        preguntas: [
            {
                pregunta: '¿Qué formas de pago hay?',
                respuesta: ['Podés pagar con ' + textoDeFormasDePago() + ', desde la página de Mercado Pago.']
            },
            {
                pregunta: '¿Dónde pongo los datos de mi tarjeta?',
                respuesta: ['Solo en la página de Mercado Pago. Evently nunca te pide ni guarda los datos de tu tarjeta.']
            },
            {
                pregunta: 'Pagué y mi compra figura pendiente, ¿qué hago?',
                respuesta: [
                    'A veces el pago tarda un poco en confirmarse. Mercado Pago le avisa a Evently y la compra se confirma sola; la pantalla de tu compra se actualiza mientras esperás.',
                    'Si pasó un rato largo y sigue pendiente, escribinos una consulta con el correo que usaste en la compra.'
                ]
            }
        ]
    },
    {
        id: 'mi-entrada',
        titulo: 'Mi entrada',
        preguntas: [
            {
                pregunta: '¿Dónde veo mi entrada?',
                respuesta: [
                    'Al terminar el pago volvés a Evently y ves tu compra en pantalla, con un código QR por cada entrada. Ese código es el que se muestra en la puerta del evento.',
                    'Las entradas no se envían por correo: guardá o copiá el enlace de esa pantalla para volver a verlas.'
                ]
            },
            {
                pregunta: 'Perdí el enlace de mi entrada',
                respuesta: ['Escribinos una consulta con el correo que usaste en la compra y el nombre del evento, así te ayudamos.']
            }
        ]
    },
    {
        id: 'anulaciones',
        titulo: 'Anulaciones y cambios',
        preguntas: [
            {
                pregunta: '¿Puedo anular mi compra o cambiar mi entrada?',
                respuesta: ['Escribinos una consulta contándonos tu caso y la compra de la que se trata; te respondemos al correo que indiques.']
            }
        ]
    },
    {
        id: 'reprogramaciones',
        titulo: 'Reprogramaciones y cancelaciones',
        preguntas: [
            {
                pregunta: '¿Qué pasa si el evento se reprograma o se cancela?',
                respuesta: ['Escribinos una consulta con el nombre del evento y el correo de tu compra; te respondemos con los pasos a seguir.']
            }
        ]
    }
];

// Devuelve los temas que tienen preguntas que coinciden, y de cada uno solo esas preguntas.
// Una pregunta coincide si TODAS las palabras escritas aparecen en la pregunta o en la respuesta.
// Texto vacío devuelve todo. La búsqueda es solo comparar texto: nunca se interpreta como HTML.
export function buscarPreguntas(texto) {
    const palabras = normalizarTexto(texto).split(' ').filter(Boolean);
    if (palabras.length === 0) return TEMAS_DE_AYUDA;
    const resultado = [];
    for (const tema of TEMAS_DE_AYUDA) {
        const preguntas = tema.preguntas.filter((p) => {
            const contenido = normalizarTexto(p.pregunta + ' ' + p.respuesta.join(' '));
            return palabras.every((palabra) => contenido.includes(palabra));
        });
        if (preguntas.length > 0) resultado.push({ id: tema.id, titulo: tema.titulo, preguntas });
    }
    return resultado;
}
