// Corre todas las pruebas de esta carpeta, una por una, y muestra un resumen.
// Uso (desde la raiz del proyecto):   node pruebas/ejecutar-todas.js
// No instala nada y no usa red ni la base de datos real: todo es simulado.
// Termina con codigo 0 si todo paso y con 1 si algo fallo.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const archivos = fs.readdirSync(__dirname)
  .filter((nombre) => /^\d\d-.*\.js$/.test(nombre))
  .sort();

let fallaron = 0;
for (const archivo of archivos) {
  const r = spawnSync(process.execPath, [path.join(__dirname, archivo)], { encoding: 'utf8' });
  const salida = (r.stdout || '') + (r.stderr || '');
  const lineas = salida.split('\n');
  const ok = lineas.filter((l) => l.startsWith('OK ')).length;
  const mal = lineas.filter((l) => l.startsWith('MAL ')).length;
  const paso = r.status === 0 && mal === 0;
  if (!paso) fallaron++;
  console.log((paso ? 'PASO  ' : 'FALLO ') + archivo + '  (' + ok + ' casos bien' + (mal ? ', ' + mal + ' mal' : '') + ')');
  if (!paso) {
    // Muestra solo lo que fallo, para no llenar la pantalla
    lineas.filter((l) => l.startsWith('MAL ') || /Error/.test(l)).slice(0, 15).forEach((l) => console.log('        ' + l));
  }
}

console.log('\n' + (fallaron === 0
  ? 'Todas las pruebas pasaron (' + archivos.length + ' archivos).'
  : 'FALLARON ' + fallaron + ' de ' + archivos.length + ' archivos.'));
process.exit(fallaron ? 1 : 0);
