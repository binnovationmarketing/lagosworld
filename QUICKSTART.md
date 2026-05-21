# 🚀 Lagos Platform - Quick Start

**Tempo estimado: 15 minutos**

## Passo 1: Setup Supabase (Database - 5 min)

1. Vá para https://supabase.com → Sign Up (grátis)
2. Crie novo projeto (escolha região mais próxima)
3. Vá em "SQL Editor" → "New query"
4. Cole todo o conteúdo de `schema.sql` deste repo
5. Execute (clique play ▶)
6. Vá em "Settings" → "API"
   - Copie `Project URL` 
   - Copie `anon public` key

## Passo 2: Setup Gmail (Email - 3 min)

1. Abra https://myaccount.google.com/security
2. Ative "2-Step Verification" se não tiver
3. Vá em "App passwords"
4. Selecione "Mail" e "Windows Computer"
5. Copie a senha gerada (16 caracteres)

## Passo 3: Setup Local (.env - 2 min)

Na raiz do projeto:

```bash
cp .env.example .env
```

Edite `.env`:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=seu-anon-key-aqui
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-app-password-16-chars
ADMIN_EMAIL=binnovationmarketing@gmail.com
PORT=3000
```

## Passo 4: Rodar Local (3 min)

```bash
npm install
npm run dev
```

API estará em `http://localhost:3000`

Teste: Abra http://localhost:3000/api/health (deve aparecer OK)

## Passo 5: Testar Jewelry

1. Abra `index.html` no navegador
2. Adicione um produto ao carrinho
3. Faça checkout com um email
4. Verifique seu email (binnovationmarketing@gmail.com)

---

## Deploy Vercel (Próximo)

Quando pronto:

```bash
npm install -g vercel
vercel
```

Siga as instruções e configure env vars no dashboard.

---

## 📧 Fluxo de Email

Cada submit vai para:
- ✅ `binnovationmarketing@gmail.com` (admin)
- ✅ Email do cliente (confirmação)

---

**Pronto! 🎉 Comece a coletar leads agora.**
