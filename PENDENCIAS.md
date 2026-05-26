# Pendências — Lagos World

> Atualizado: 2026-05-26

---

## 🔴 Alta Prioridade

### 1. Chave Pix da Dayane Lago
**Responsável:** Henrique → Dayane Lago
**Ação:** Pedir a Dayane a chave Pix oficial da conta da Lagos Jewelry

- A opção Pix já está no checkout (selecionável pelo cliente)
- Atualmente usando `admin.lagosworld@gmail.com` como chave Pix (provisória)
- Confirmar com Dayane: a chave Pix é esse email? Ou CPF? Ou telefone?
- Após confirmação: atualizar em `public/jewelry/index.html` nos 2 lugares:
  - Bloco `<!-- PIX INFO -->` no checkout
  - Bloco de sucesso do pedido (`suc-pay-info`)
- Também atualizar o System Prompt da Milla em `api/services/milla.js` se Milla mencionar Pix

---

## 🟡 Média Prioridade

### 2. Migração dos 512 produtos para Supabase
**Depende de:** ter `.env` local com `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`

**Passo 1 — Rodar a migration SQL no Supabase:**
- Acesse: Supabase → SQL Editor
- Cole e execute o conteúdo de `migrations/007_jewelry_products.sql`

**Passo 2 — Migrar dados (sem imagens, teste rápido ~30s):**
```bash
cd "/Users/rique_energy/Documents/Negocios/Lagos Cleaning"
node scripts/migrate-products.js --skip-images
```

**Passo 3 — Migrar imagens (demora ~15-20 min, baixa 512 imagens):**
```bash
node scripts/migrate-products.js
```

**Por que fazer isso:**
- Atualmente as imagens são hotlink direto de `img1.conectavenda.com.br` (fornecedor)
- Se eles bloquearem hotlink → 512 imagens somem do site sem aviso
- Com imagens no Supabase Storage → controle total, independência do fornecedor

**Após migração:** atualizar o frontend para buscar produtos via API Supabase
em vez do arquivo estático `public/js/products-data.js` (402 KB)

---

### 3. Migration 006 — Tabela `milla_conversations`
**Ação:** Verificar se já foi rodada no Supabase
- Arquivo: `migrations/006_milla_conversations.sql`
- A Milla funciona sem ela (trata o erro), mas conversas não são salvas corretamente
- Rodar no Supabase → SQL Editor

---

### 4. Telnyx 10DLC — SMS para a Milla
**Depende de:** upgrade da conta Telnyx
**Ação:** Ao fazer upgrade:
1. Registrar Brand no Telnyx (nome da empresa, EIN/FEIN)
2. Registrar Campaign (uso: customer care / notifications)
3. Configurar webhook SMS → `POST https://lagosworld.app/api/milla/sms`
- Endpoint já pronto em `api/routes/milla.js`

---

## 🟢 Baixa Prioridade

### 5. Supabase Migration 005 — `product_overrides` nome
**Ação:** Verificar se foi rodada:
```sql
ALTER TABLE product_overrides ADD COLUMN IF NOT EXISTS name TEXT;
```
- Arquivo: `migrations/005_product_overrides_name.sql`

---

## ✅ Concluído (referência)

- Milla v3 — Executive Partner AI (Groq Llama 3.3 70B)
- Fallback automático 70B → 8B-instant em rate limit
- Multilíngue PT/EN/ES com detecção server-side e language lock
- Widget mobile bottom sheet (iOS safe-area)
- INP fix — remoção do event listener do textarea
- Paginação jewelry: 20/página padrão com toggle 20|40
- Pix / TED Brasil como opção de pagamento
- Seção "Quem Somos & Garantias" na página jewelry
- CC `lagosvipcleaning@gmail.com` em todos os emails de limpeza
- Preconnect Google Fonts + fetchpriority nas primeiras imagens (LCP)
