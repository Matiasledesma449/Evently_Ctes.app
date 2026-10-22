// Prueba de la validacion del pedido de compra (server/validaciones.js), tarea 3.1 y su endurecimiento.
// Funcion pura: no usa red ni base de datos.
const REPO = require('path').join(__dirname, '..');
const { validarPedido } = require(REPO + '/server/validaciones');

const base = { eventoId: 'Evt1', loteIndex: 0, loteNombre: 'General', cantidad: 2, nombre: 'Ana', apellido: 'Prueba', correo: 'ana@example.com' };
const con = (cambios) => ({ ...base, ...cambios });

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};
const campos = (r) => (r.errores || []).map((e) => e.campo).sort().join();

// ---------- Pedidos correctos ----------
for (const [nombre, pedido] of [
  ['pedido correcto', base],
  ['sin nombre de lote (es opcional)', con({ loteNombre: undefined })],
  ['nombre y apellido con tildes y espacios', con({ nombre: 'José María', apellido: 'Núñez de la Cruz' })],
  ['apellido con apostrofe y guion', con({ apellido: "O'Brien-Pérez" })],
  ['correo con subdominios, puntos y +', con({ correo: 'ana.perez+entradas@mail.empresa.com.ar' })],
  ['correo en mayusculas (se pasa a minusculas)', con({ correo: 'ANA@Example.COM' })],
  ['maximo de entradas (10)', con({ cantidad: 10 })],
]) {
  const r = validarPedido(pedido);
  verificar(nombre + ': pasa', r.ok === true, JSON.stringify(r.errores));
}
verificar('el correo queda en minusculas y los datos se limpian', (() => { const r = validarPedido(con({ correo: ' ANA@Example.COM ', nombre: '  Ana   Maria ' })); return r.ok && r.datos.correo === 'ana@example.com' && r.datos.nombre === 'Ana Maria'; })());

// ---------- Correos peligrosos o invalidos ----------
const correosMalos = [
  ['con etiqueta HTML', '<img/src=x/onerror=alert(1)>@a.bc'],
  ['con etiqueta script', '<script>alert(1)</script>@x.com'],
  ['con comillas dobles', 'a"onmouseover="alert(1)@x.com'],
  ['con comilla simple', "a'b@x.com"],
  ['con signo menor y mayor', 'a<b>@x.com'],
  ['con dos puntos (javascript:)', 'javascript:alert(1)@x.com'],
  ['con barra', 'a/b@x.com'],
  ['con parentesis', 'a(b)@x.com'],
  ['con punto y coma', 'a;b@x.com'],
  ['con espacios', 'a b@x.com'],
  ['con salto de linea', 'a@x.com\nbcc@y.com'],
  ['con texto despues del dominio', 'ana@example.com<script>'],
  ['con tilde', 'ñandu@x.com'],
  ['sin arroba', 'ana.example.com'],
  ['dos arrobas', 'a@@x.com'],
  ['sin dominio', 'a@'],
  ['sin nombre', '@x.com'],
  ['dominio sin punto', 'a@localhost'],
  ['extension de una letra', 'a@x.c'],
  ['puntos seguidos en el dominio', 'a@x..com'],
  ['vacio', ''],
  ['solo espacios', '   '],
  ['demasiado largo', 'a'.repeat(250) + '@x.com'],
  ['no es texto', 12345],
  ['nulo', null],
];
for (const [nombre, correo] of correosMalos) {
  const r = validarPedido(con({ correo }));
  verificar('correo ' + nombre + ': se rechaza y dice que se corrija el correo', r.ok === false && campos(r) === 'correo', JSON.stringify(r.errores));
}

// ---------- Nombres ----------
for (const [nombre, n] of [['con HTML', '<b>Ana</b>'], ['con numeros', 'Ana2'], ['con arroba', 'ana@x'], ['vacio', ''], ['demasiado largo', 'A'.repeat(61)], ['no es texto', 42]]) {
  const r = validarPedido(con({ nombre: n }));
  verificar('nombre ' + nombre + ': se rechaza', r.ok === false && campos(r) === 'nombre');
}
verificar('apellido con HTML se rechaza', validarPedido(con({ apellido: '<img src=x>' })).ok === false);

// ---------- Cantidad, evento y lote ----------
for (const [nombre, cantidad] of [['0', 0], ['11', 11], ['2.5', 2.5], ['negativa', -1], ['en texto', '2'], ['NaN', NaN], ['nula', null], ['ausente', undefined]]) {
  const r = validarPedido(con({ cantidad }));
  verificar('cantidad ' + nombre + ': se rechaza y indica que se corrija la cantidad', r.ok === false && campos(r) === 'cantidad', JSON.stringify(r.errores));
}
verificar('evento con barra o simbolos: se rechaza', validarPedido(con({ eventoId: 'a/b' })).ok === false && validarPedido(con({ eventoId: '../x' })).ok === false);
verificar('lote fuera de rango, negativo o decimal: se rechaza', [100, -1, 1.5, '0', null].every((l) => validarPedido(con({ loteIndex: l })).ok === false));

// ---------- Solo pasan los campos permitidos ----------
{
  const r = validarPedido(con({ precio: 1, monto_total: 1, total: 1, estado: 'confirmada', tokenConsulta: 'x', mpPaymentId: '1', requiereReembolso: false }));
  verificar('precio, monto, estado y otros datos del navegador se ignoran (no llegan a la venta)',
    r.ok && Object.keys(r.datos).sort().join() === 'apellido,cantidad,correo,eventoId,loteIndex,loteNombre,nombre', r.ok && Object.keys(r.datos).join());
}
for (const [nombre, cuerpo] of [['nulo', null], ['arreglo', []], ['texto', 'hola'], ['numero', 5]]) {
  verificar('cuerpo ' + nombre + ': se rechaza sin romperse', validarPedido(cuerpo).ok === false);
}

// ---------- Varios errores juntos ----------
{
  const r = validarPedido({ eventoId: 'Evt1', loteIndex: 0, cantidad: 0, nombre: '', apellido: '', correo: 'x' });
  verificar('varios datos mal a la vez: avisa de todos (cantidad, nombre, apellido y correo)', r.ok === false && campos(r) === 'apellido,cantidad,correo,nombre', campos(r));
}

console.log(mal === 0 ? '\nTodos los casos dieron lo esperado.' : '\nFALLARON ' + mal + ' casos.');
process.exit(mal ? 1 : 0);
