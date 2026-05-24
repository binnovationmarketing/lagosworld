/**
 * export-products.js
 * Extrai os 512 produtos do jewelry/index.html e insere direto no Supabase.
 * Uso: node scripts/export-products.js
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
  || process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.SUPABASE_SECRET_KEY
  || process.env.SUPABASE_KEY
  || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Faltam SUPABASE_URL e/ou SUPABASE_SERVICE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Extrai PRODUCTS do HTML ──────────────────────────────────────────────────
const htmlPath = path.join(__dirname, '../public/jewelry/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const match = html.match(/const PRODUCTS\s*=\s*(\[[\s\S]*?\]);[\r\n]/);
if (!match) {
  console.error('❌  Array PRODUCTS não encontrado no HTML');
  process.exit(1);
}

let PRODUCTS;
try {
  PRODUCTS = JSON.parse(match[1]);
} catch (e) {
  console.error('❌  Falha ao parsear PRODUCTS:', e.message);
  process.exit(1);
}

console.log(`✓  ${PRODUCTS.length} produtos encontrados`);

// ── Monta registros ──────────────────────────────────────────────────────────
const productRows = PRODUCTS.map(p => ({
  id:          p.id,
  name:        p.name.trim(),
  sku:         p.sku  || null,
  category:    p.cat  || null,
  description: p.descricao || null,
  images:      p.imgs || (p.img ? [p.img] : []),
  video_url:   null,
  status:      'active',
}));

const variantRows = [];
PRODUCTS.forEach(p => {
  (p.variacoes || []).forEach(v => {
    variantRows.push({
      id:             v.id,
      product_id:     p.id,
      description:    v.desc || 'Default',
      price:          Number(v.price),
      original_price: v.original !== v.price ? Number(v.original) : null,
    });
  });
});

console.log(`✓  ${variantRows.length} variantes encontradas`);

// ── Inserção em lotes (Supabase tem limite de ~500 linhas por request) ────────
async function insertInBatches(table, rows, batchSize = 200) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      console.error(`❌  Erro em ${table} (lote ${i}–${i + batchSize}):`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    process.stdout.write(`\r   ${table}: ${inserted}/${rows.length}`);
  }
  console.log(`  ✓`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n📦  Inserindo produtos...');
  await insertInBatches('products', productRows);

  console.log('📦  Inserindo variantes...');
  await insertInBatches('product_variants', variantRows);

  // Verificação final
  const { count: pc } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: vc } = await supabase.from('product_variants').select('*', { count: 'exact', head: true });

  console.log(`\n✅  Migração concluída:`);
  console.log(`   products:         ${pc}`);
  console.log(`   product_variants: ${vc}`);
}

main().catch(err => {
  console.error('❌  Erro inesperado:', err);
  process.exit(1);
});
