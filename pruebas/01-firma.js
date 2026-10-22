// Prueba de la tarea 4.1: verificacion de la firma de los avisos de Mercado Pago.
// Funcion pura: no usa red ni base de datos. La clave es de ejemplo, no es real.
const crypto = require('crypto');
const REPO = require('path').join(__dirname, '..');
const { verificarFirma } = require(REPO + '/server/firma');

const secreto = 'clave-de-ejemplo-no-real';
const id = '123456789', req = 'req-abc-123', ts = '1700000000';
const v1 = crypto.createHmac('sha256', secreto).update('id:' + id + ';request-id:' + req + ';ts:' + ts + ';').digest('hex');
const buena = 'ts=' + ts + ',v1=' + v1;
const cambiaUnChar = v1.slice(0, -1) + (v1.slice(-1) === 'a' ? 'b' : 'a');

const casos = [
  ['firma correcta',                  { xSignature: buena, xRequestId: req, dataId: id, secreto }, true],
  ['v1 en mayusculas (igual valida)', { xSignature: 'ts=' + ts + ',v1=' + v1.toUpperCase(), xRequestId: req, dataId: id, secreto }, true],
  ['dataId como numero',              { xSignature: buena, xRequestId: req, dataId: 123456789, secreto }, true],
  ['un caracter cambiado en v1',      { xSignature: 'ts=' + ts + ',v1=' + cambiaUnChar, xRequestId: req, dataId: id, secreto }, false],
  ['v1 mas corto',                    { xSignature: 'ts=' + ts + ',v1=' + v1.slice(0, 10), xRequestId: req, dataId: id, secreto }, false],
  ['sin ts',                          { xSignature: 'v1=' + v1, xRequestId: req, dataId: id, secreto }, false],
  ['sin v1',                          { xSignature: 'ts=' + ts, xRequestId: req, dataId: id, secreto }, false],
  ['ts distinto al firmado',          { xSignature: 'ts=1700000001,v1=' + v1, xRequestId: req, dataId: id, secreto }, false],
  ['data.id distinto',                { xSignature: buena, xRequestId: req, dataId: '999', secreto }, false],
  ['request-id distinto',             { xSignature: buena, xRequestId: 'otro', dataId: id, secreto }, false],
  ['sin request-id',                  { xSignature: buena, dataId: id, secreto }, false],
  ['sin data.id',                     { xSignature: buena, xRequestId: req, secreto }, false],
  ['clave equivocada',                { xSignature: buena, xRequestId: req, dataId: id, secreto: 'otra-clave' }, false],
  ['sin clave configurada',           { xSignature: buena, xRequestId: req, dataId: id, secreto: '' }, false],
  ['encabezado ausente',              { xRequestId: req, dataId: id, secreto }, false],
  ['encabezado basura',               { xSignature: 'hola', xRequestId: req, dataId: id, secreto }, false],
  ['sin argumentos',                  undefined, false],
];

let mal = 0;
for (const [nombre, args, espera] of casos) {
  const r = verificarFirma(args);
  const bien = r.ok === espera;
  if (!bien) mal++;
  console.log((bien ? 'OK  ' : 'MAL ') + nombre + ' -> ' + JSON.stringify(r));
}
console.log(mal === 0 ? '\nTodos los casos dieron lo esperado (' + casos.length + ').' : '\nFALLARON ' + mal + ' casos.');
process.exit(mal ? 1 : 0);
