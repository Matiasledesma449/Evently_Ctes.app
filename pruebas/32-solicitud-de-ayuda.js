// Prueba de shared/solicitud-de-ayuda.js (cambio comprador-estilo-all-access). Sin red ni base de datos.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

const codigo = fs.readFileSync(path.join(__dirname, '..', 'shared', 'solicitud-de-ayuda.js'), 'utf8').replace(/^export /gm, '');
const S = vm.runInNewContext(codigo + '\n;({ limpiarDni, armarSolicitud, armarArrepentimiento, ENCABEZADO_ARREPENTIMIENTO })');

const completa = { email: 'ana@ejemplo.test', asunto: 'No me llegó la entrada', nombre: 'Ana Pérez', dni: '30.123.456', evento: 'Fiesta', numeroCompra: 'abc123', descripcion: 'Pagué y no veo las entradas.' };

// DNI
verificar('D1 DNI con puntos se acepta limpio', S.limpiarDni('30.123.456') === '30123456');
verificar('D2 DNI vacío es válido (opcional)', S.limpiarDni('') === '' && S.limpiarDni(undefined) === '');
verificar('D3 DNI con letras o muy corto no', S.limpiarDni('30a12345') === null && S.limpiarDni('123') === null && S.limpiarDni('123456789') === null);

// Solicitud
const r = S.armarSolicitud(completa);
verificar('S1 una solicitud completa se arma', r.ok && r.datos.nombre === 'Ana Pérez' && r.datos.email === 'ana@ejemplo.test');
verificar('S2 el mensaje lleva asunto, DNI, evento, número de compra y descripción',
  r.ok && r.datos.mensaje === 'Asunto: No me llegó la entrada\nDNI: 30123456\nEvento: Fiesta\nNúmero de compra: abc123\n\nPagué y no veo las entradas.', r.ok && r.datos.mensaje);
const minima = S.armarSolicitud({ email: 'a@b.co', asunto: 'Hola', nombre: 'Ana', descripcion: 'Texto' });
verificar('S3 sin los opcionales no aparecen sus renglones', minima.ok && minima.datos.mensaje === 'Asunto: Hola\n\nTexto');
verificar('S4 sin correo válido, asunto, nombre o descripción no se arma',
  ['email', 'asunto', 'nombre', 'descripcion'].every((c) => !S.armarSolicitud({ ...completa, [c]: c === 'email' ? 'no-es-correo' : '  ' }).ok));
verificar('S5 un DNI mal escrito avisa', /DNI/.test(S.armarSolicitud({ ...completa, dni: '12a' }).mensaje || ''));
verificar('S6 el texto con etiquetas queda como texto (no se transforma)', S.armarSolicitud({ ...completa, descripcion: '<b>hola</b>' }).datos.mensaje.endsWith('<b>hola</b>'));
verificar('S7 los campos largos se recortan', S.armarSolicitud({ ...completa, asunto: 'x'.repeat(500) }).datos.mensaje.split('\n')[0].length === 'Asunto: '.length + 120);
verificar('S8 sin datos no falla', S.armarSolicitud().ok === false && S.armarSolicitud(null || undefined).ok === false);

// Arrepentimiento
const a = S.armarArrepentimiento({ email: 'ana@ejemplo.test', nombre: 'Ana', numeroCompra: 'abc123', dni: '30123456', motivo: 'Me equivoqué de fecha' });
verificar('A1 el pedido empieza con el encabezado y lleva el número de compra', a.ok && a.datos.mensaje.startsWith(S.ENCABEZADO_ARREPENTIMIENTO + '\nNúmero de compra: abc123'));
verificar('A2 lleva DNI y motivo si se escribieron', a.ok && /DNI: 30123456/.test(a.datos.mensaje) && /Motivo: Me equivoqué de fecha/.test(a.datos.mensaje));
verificar('A3 sin número de compra no se arma', !S.armarArrepentimiento({ email: 'ana@ejemplo.test', nombre: 'Ana' }).ok);
verificar('A4 sin correo válido o nombre no se arma', !S.armarArrepentimiento({ email: 'x', nombre: 'Ana', numeroCompra: '1' }).ok && !S.armarArrepentimiento({ email: 'a@b.co', nombre: ' ', numeroCompra: '1' }).ok);
verificar('A5 el archivo no usa innerHTML ni red', !/innerHTML|fetch\(|addDoc/.test(codigo.replace(/\/\/.*$/gm, '')));

console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
process.exit(mal ? 1 : 0);
