// Prueba de la seccion 5: /api/venta (consulta con token, datos que se devuelven, vencimiento al consultar).
const REPO = require('path').join(__dirname, '..');
const { crearDbFalsa, simularFirebaseAdmin } = require('./_ayuda-db-falsa');
simularFirebaseAdmin();
const { consultarVenta } = require(REPO + '/server/venta');
const { aplicarPago } = require(REPO + '/server/confirmacion');
const handler = require(REPO + '/api/venta');

const TOKEN = 'a'.repeat(48);
const OTRO_TOKEN = 'b'.repeat(48);
const AHORA = new Date('2026-10-21T15:00:00Z');
const enMin = (m) => new Date(AHORA.getTime() + m * 60000);

const evento = () => ({ nombre: 'Fiesta del Rio', fecha: '15 Dic 2026 21:00', lugar: 'Costanera Corrientes', lotes: [{ nombre: 'General', precio: 5000, disponibles: 50, vendidas: 0 }] });
const venta = (extra = {}) => ({
  estado: 'pendiente', motivo: null, eventoId: 'Evt1', eventoNombre: 'Fiesta del Rio', loteIndex: 0, loteNombre: 'General',
  cantidad: 3, precio_unitario: 5000, monto_total: 15000, moneda: 'ARS',
  nombre: 'Ana', apellido: 'Prueba', correo: 'ana.prueba@example.com',
  tokenConsulta: TOKEN, venceEn: enMin(20), entradas: [], mpPreferenceId: 'PREF-123', ...extra,
});
const confirmada = (extra = {}) => venta({
  estado: 'confirmada', metodo_pago: 'Crédito', mpPaymentId: '999888', requiereReembolso: false, pagosDuplicados: ['111'], motivoDetalle: 'accredited',
  entradas: [{ codigo: 'ENT-aaaaaaaaaaaaaaaaaaaaaaaa', usado: false }, { codigo: 'ENT-bbbbbbbbbbbbbbbbbbbbbbbb', usado: true }, { codigo: 'ENT-cccccccccccccccccccccccc', usado: false }], ...extra,
});
const silencio = () => {};

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};
const consulta = (db, id, token, extra = {}) => consultarVenta({ id, token }, { db, ahora: AHORA, registrar: silencio, ...extra });

(async () => {
  // ================= 5.1 Consulta con id y token =================
  {
    const { db } = crearDbFalsa({ eventos: { Evt1: evento() }, ventas: { Venta0001: venta(), Venta0002: venta({ tokenConsulta: OTRO_TOKEN }) } });
    const tokenMalo = await consulta(db, 'Venta0001', OTRO_TOKEN);
    const idInventado = await consulta(db, 'NoExiste99', TOKEN);
    verificar('5.1a token equivocado: 404 "no encontrada"', tokenMalo.status === 404 && tokenMalo.cuerpo.error.codigo === 'NO_ENCONTRADA');
    verificar('5.1b id inventado: respuesta IDENTICA a la del token equivocado (no revela si la venta existe)',
      JSON.stringify(tokenMalo) === JSON.stringify(idInventado), JSON.stringify([tokenMalo, idInventado]));

    // Formatos raros: misma respuesta y sin tocar la base de datos
    let lecturas = 0;
    const dbEspia = { ...db, collection: (...a) => { lecturas++; return db.collection(...a); } };
    const raros = [
      ['id con barra', 'ventas/Venta0001', TOKEN], ['id con puntos', '../x', TOKEN], ['id vacio', '', TOKEN],
      ['token corto', 'Venta0001', 'abc'], ['token con mayusculas', 'Venta0001', 'A'.repeat(48)], ['token con simbolos', 'Venta0001', 'z'.repeat(48)],
      ['sin id', undefined, TOKEN], ['sin token', 'Venta0001', undefined], ['id numerico', 123, TOKEN], ['token como objeto', 'Venta0001', { $ne: '' }],
      ['id como arreglo', ['Venta0001'], TOKEN], ['todo nulo', null, null],
    ];
    const iguales = [];
    for (const [nombre, id, t] of raros) {
      const r = await consultarVenta({ id, token: t }, { db: dbEspia, ahora: AHORA, registrar: silencio });
      iguales.push(JSON.stringify(r) === JSON.stringify(tokenMalo));
      if (!iguales[iguales.length - 1]) console.log('     distinto en:', nombre, JSON.stringify(r));
    }
    verificar('5.1c ' + raros.length + ' entradas con formato raro: todas dan la misma respuesta "no encontrada"', iguales.every(Boolean));
    verificar('5.1d esas entradas no llegan a leer la base de datos', lecturas === 0, 'lecturas=' + lecturas);

    const otraVenta = await consulta(db, 'Venta0001', OTRO_TOKEN); // el token de Venta0002 no abre Venta0001
    verificar('5.1e el token de OTRA venta no abre esta', otraVenta.status === 404);

    const buena = await consulta(db, 'Venta0001', TOKEN);
    verificar('5.1f id y token correctos: 200 con los datos de la venta', buena.status === 200 && buena.cuerpo.ok === true && buena.cuerpo.venta.id === 'Venta0001' && buena.cuerpo.venta.estado === 'pendiente', JSON.stringify(buena.cuerpo));
    verificar('5.1g el cuerpo de "no encontrada" no contiene datos de ninguna venta', !JSON.stringify(tokenMalo).includes('Fiesta') && !JSON.stringify(tokenMalo).includes('Venta000'));
  }

  // ================= 5.2 Que datos se devuelven =================
  {
    const { db } = crearDbFalsa({
      eventos: { Evt1: evento() },
      ventas: {
        VPend: venta(), VConf: confirmada(),
        VRech: venta({ estado: 'rechazada', motivo: 'pago_rechazado', motivoDetalle: 'cc_rejected_other_reason', entradas: [] }),
        VSinStock: venta({ estado: 'rechazada', motivo: 'sin_stock', requiereReembolso: true, mpPaymentId: '555' }),
      },
    });
    const prohibidos = [TOKEN, '999888', 'PREF-123', 'ana.prueba@example.com', 'Ana', 'Prueba', 'accredited', 'cc_rejected', 'pagosDuplicados', 'tokenConsulta', 'mpPaymentId', 'mpPreferenceId', 'correo', 'precio_unitario', '555'];
    const sinProhibidos = (r) => { const s = JSON.stringify(r); return prohibidos.filter((p) => s.includes(p)); };

    const p = (await consulta(db, 'VPend', TOKEN)).cuerpo.venta;
    verificar('5.2a pendiente: estado, evento (nombre, fecha, lugar), lote, cantidad y monto',
      p.estado === 'pendiente' && p.evento.nombre === 'Fiesta del Rio' && p.evento.fecha === '15 Dic 2026 21:00' && p.evento.lugar === 'Costanera Corrientes' && p.lote === 'General' && p.cantidad === 3 && p.monto === 15000 && p.moneda === 'ARS', JSON.stringify(p));
    verificar('5.2b pendiente: NO trae entradas ni codigos', !('entradas' in p) && !JSON.stringify(p).includes('ENT-'));

    const r = (await consulta(db, 'VRech', TOKEN)).cuerpo.venta;
    verificar('5.2c rechazada: trae el motivo y NO trae entradas ni codigos', r.estado === 'rechazada' && r.motivo === 'pago_rechazado' && !('entradas' in r) && !JSON.stringify(r).includes('ENT-'));

    const s = (await consulta(db, 'VSinStock', TOKEN)).cuerpo.venta;
    verificar('5.2d sin_stock: motivo y aviso de reembolso pendiente', s.motivo === 'sin_stock' && s.reembolsoPendiente === true);

    const c = (await consulta(db, 'VConf', TOKEN)).cuerpo.venta;
    verificar('5.2e confirmada: una entrada por unidad, cada una con su codigo', c.estado === 'confirmada' && c.entradas.length === 3 && c.entradas.every((e) => /^ENT-/.test(e.codigo)), JSON.stringify(c.entradas));
    verificar('5.2f confirmada: codigos distintos y se informa cual ya se uso', new Set(c.entradas.map((e) => e.codigo)).size === 3 && c.entradas[1].usado === true && c.entradas[0].usado === false);
    verificar('5.2g confirmada: trae el metodo de pago', c.metodoPago === 'Crédito');

    const fugas = [...['VPend', 'VConf', 'VRech', 'VSinStock'].flatMap((id) => [id])].map(async (id) => sinProhibidos((await consulta(db, id, TOKEN)).cuerpo));
    const todas = (await Promise.all(fugas)).flat();
    verificar('5.2h ninguna respuesta incluye token, ids de pago o preferencia, datos del comprador ni campos internos', todas.length === 0, todas.join(','));
    verificar('5.2i la respuesta tiene solo los campos previstos', Object.keys(c).sort().join() === 'cantidad,entradas,estado,evento,eventoId,id,lote,metodoPago,moneda,monto,motivo,reembolsoPendiente' && c.eventoId === 'Evt1', Object.keys(c).sort().join());
  }
  {
    // Evento borrado: igual se puede ver la compra
    const { db } = crearDbFalsa({ eventos: {}, ventas: { V1: confirmada() } });
    const r = await consulta(db, 'V1', TOKEN);
    verificar('5.2j si el evento ya no existe, se devuelve igual con fecha y lugar vacios', r.status === 200 && r.cuerpo.venta.evento.fecha === null && r.cuerpo.venta.evento.lugar === null && r.cuerpo.venta.evento.nombre === 'Fiesta del Rio');
  }

  // ================= 5.3 Vencimiento al consultar =================
  {
    const { db, datos, estado } = crearDbFalsa({ eventos: { Evt1: evento() }, ventas: { VVieja: venta({ venceEn: enMin(-1) }), VVigente: venta({ venceEn: enMin(1) }) } });
    const r = await consulta(db, 'VVieja', TOKEN);
    verificar('5.3a pendiente vencida: la consulta devuelve rechazada con motivo "vencida"', r.cuerpo.venta.estado === 'rechazada' && r.cuerpo.venta.motivo === 'vencida', JSON.stringify(r.cuerpo));
    verificar('5.3b el documento queda actualizado en la base', datos.ventas.VVieja.estado === 'rechazada' && datos.ventas.VVieja.motivo === 'vencida' && datos.ventas.VVieja.entradas.length === 0);
    const antes = estado.escrituras;
    const r2 = await consulta(db, 'VVieja', TOKEN);
    verificar('5.3c consultar de nuevo no vuelve a escribir', estado.escrituras === antes && r2.cuerpo.venta.motivo === 'vencida');
    const v = await consulta(db, 'VVigente', TOKEN);
    verificar('5.3d pendiente todavia vigente: sigue pendiente y no se escribe nada', v.cuerpo.venta.estado === 'pendiente' && datos.ventas.VVigente.estado === 'pendiente' && estado.escrituras === antes);
  }
  {
    const { db, datos, estado } = crearDbFalsa({
      eventos: { Evt1: evento() },
      ventas: { VConf: confirmada({ venceEn: enMin(-120) }), VRech: venta({ estado: 'rechazada', motivo: 'pago_rechazado', venceEn: enMin(-120) }), VSinFecha: venta({ venceEn: undefined }) },
    });
    delete datos.ventas.VSinFecha.venceEn;
    const c = await consulta(db, 'VConf', TOKEN);
    const r = await consulta(db, 'VRech', TOKEN);
    const sf = await consulta(db, 'VSinFecha', TOKEN);
    verificar('5.3e confirmada con fecha de vencimiento pasada: sigue confirmada', c.cuerpo.venta.estado === 'confirmada' && datos.ventas.VConf.estado === 'confirmada');
    verificar('5.3f ya rechazada: conserva su motivo original', r.cuerpo.venta.motivo === 'pago_rechazado' && datos.ventas.VRech.motivo === 'pago_rechazado');
    verificar('5.3g pendiente sin fecha de vencimiento: no se toca', sf.cuerpo.venta.estado === 'pendiente' && estado.escrituras === 0);
  }
  {
    // Carrera: el aviso de pago confirma justo mientras se consulta una venta vencida. Nunca debe quedar a medias.
    let fallas = 0;
    for (let i = 0; i < 30; i++) {
      const { db, datos } = crearDbFalsa({ eventos: { Evt1: evento() }, ventas: { V1: venta({ venceEn: enMin(-1) }) } });
      const pago = { id: 777, status: 'approved', payment_type_id: 'credit_card' };
      const [c] = await Promise.all([consulta(db, 'V1', TOKEN), aplicarPago(db, 'V1', pago)]);
      const v = datos.ventas.V1;
      const coherente = v.estado === 'confirmada' && v.entradas.length === 3 && datos.eventos.Evt1.lotes[0].vendidas === 3 && c.status === 200;
      if (!coherente) fallas++;
    }
    verificar('5.3h carrera entre vencer y confirmar (30 veces): siempre termina confirmada, con 3 entradas y el stock descontado una vez', fallas === 0, 'fallas=' + fallas);
  }

  // ================= Errores y handler =================
  {
    const { db, estado } = crearDbFalsa({ eventos: { Evt1: evento() }, ventas: { V1: venta() } });
    estado.fallarAlLeer = new Error('la base se cayo con datos internos');
    const logs = [];
    const r = await consultarVenta({ id: 'V1', token: TOKEN }, { db, ahora: AHORA, registrar: (...a) => logs.push(JSON.stringify(a)) });
    verificar('E1 base caida: 500 con mensaje generico, sin detalles internos', r.status === 500 && r.cuerpo.error.codigo === 'ERROR_INTERNO' && !JSON.stringify(r).includes('base se cayo') && !logs.join('').includes(TOKEN));
    const rc = await consultarVenta({ id: 'V1', token: TOKEN }, { ahora: AHORA, registrar: silencio }); // sin base inyectada y sin variables: error de configuracion
    verificar('E2 sin configuracion del servidor: 500 generico', rc.status === 500 && rc.cuerpo.error.codigo === 'ERROR_INTERNO');
  }
  {
    const res = () => { const x = { cab: {}, setHeader(k, v) { x.cab[k] = v; }, status(s) { x.codigo = s; return x; }, json(j) { x.cuerpo = j; return x; } }; return x; };
    const a = res(); await handler({ method: 'GET', query: { id: 'V1', t: TOKEN }, headers: {} }, a);
    verificar('H1 GET no esta permitido (el token no viaja en la direccion): 405 con Allow: POST', a.codigo === 405 && a.cab.Allow === 'POST');
    const b = res(); await handler({ method: 'POST', headers: {}, get body() { throw new Error('json roto'); } }, b);
    verificar('H2 cuerpo ilegible: 404 "no encontrada"', b.codigo === 404 && b.cuerpo.error.codigo === 'NO_ENCONTRADA');
    const c = res(); await handler({ method: 'POST', headers: {}, body: { id: 'V1', t: 'corto' } }, c);
    verificar('H3 token invalido por el handler: 404 y sin cache', c.codigo === 404 && c.cab['Cache-Control'] === 'no-store');
    const d = res(); await handler({ method: 'POST', headers: {}, body: 'texto suelto' }, d);
    verificar('H4 cuerpo que no es un objeto: 404', d.codigo === 404);
  }

  console.log(mal === 0 ? '\nTodos los casos dieron lo esperado.' : '\nFALLARON ' + mal + ' casos.');
  process.exit(mal ? 1 : 0);
})();
