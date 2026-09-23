// Prints the typical-child difficulty table: node tools/difficulty-report.js
import { measureCurve, findSpikes } from '../tests/helpers/curve.js';

const curve = measureCurve(Number(process.argv[2] ?? 40));
console.log('level   pressure  livesLost  failRate  avgTime  misses  difficulty');
for (const m of curve) {
  console.log(
    `${m.id.padEnd(7)} ${m.pressure.toFixed(3).padStart(8)} ${m.livesLost.toFixed(2).padStart(10)} ${m.failRate.toFixed(2).padStart(9)} ${m.time.toFixed(1).padStart(8)} ${m.misses.toFixed(2).padStart(7)} ${m.difficulty.toFixed(3).padStart(11)}`,
  );
}
console.log('spikes:', findSpikes(curve).join(', ') || 'none');
