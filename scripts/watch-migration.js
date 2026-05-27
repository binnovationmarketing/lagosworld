/**
 * watch-migration.js — Live progress for migrate-products.js
 * Usage: node scripts/watch-migration.js <output-file>
 */
'use strict';

const fs = require('fs');

const outputFile = process.argv[2];
if (!outputFile || !fs.existsSync(outputFile)) {
  console.error('Usage: node scripts/watch-migration.js <path-to-output-file>');
  process.exit(1);
}

const TOTAL_PRODUCTS = 512;
const IMG_ESTIMATE   = 820; // ~1.6 imgs/product

function bar(done, total, width = 36) {
  const pct    = Math.min(1, done / total);
  const filled = Math.round(pct * width);
  return '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + '] ' + Math.round(pct * 100) + '%';
}

const startTime = Date.now();

function render() {
  const raw = fs.readFileSync(outputFile, 'utf8');

  const dots    = (raw.match(/\./g) || []).length;
  const batchM  = [...raw.matchAll(/total: (\d+)/g)];
  const inserted = batchM.length ? parseInt(batchM[batchM.length - 1][1]) : 0;
  const warnings = (raw.match(/⚠/g) || []).length;
  const failed   = (raw.match(/❌ Batch/g) || []).length;
  const done     = raw.includes('Migration complete');

  const elapsed  = Math.round((Date.now() - startTime) / 1000);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  console.clear();
  console.log('\n  ═══════════════════════════════════════════════════');
  console.log('        Lagos Jewelry · Migração de Imagens');
  console.log('  ═══════════════════════════════════════════════════\n');

  console.log(`  Produtos   ${bar(inserted, TOTAL_PRODUCTS)}  (${inserted}/${TOTAL_PRODUCTS})`);
  console.log(`  Imagens    ${bar(dots, IMG_ESTIMATE)}  (~${dots} baixadas)\n`);

  console.log(`  Avisos: ${warnings}   Falhas: ${failed}   Tempo: ${mm}:${ss}\n`);

  if (done) {
    console.log('  ✅  CONCLUÍDA! Todas as imagens estão no Supabase Storage.\n');
    process.exit(0);
  } else {
    console.log('  ⏳ Rodando... atualiza a cada 2s. Ctrl+C para sair.\n');
  }
}

render();
setInterval(render, 2000);
