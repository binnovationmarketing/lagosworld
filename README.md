# Lagos Platform

Plataforma integrada para 3 negócios: Jewelry, Cleaning, Courses.

## Stack

- **Backend**: Express.js + Node.js
- **Database**: Supabase (PostgreSQL)
- **Email**: Nodemailer (Gmail free)
- **Hosting**: Vercel (free)

## Setup Rápido

### 1. Supabase (Database)

1. Vá para [supabase.com](https://supabase.com) e crie conta grátis
2. Crie novo projeto (free tier = 500MB)
3. Vá em "SQL Editor" e execute o conteúdo de `schema.sql`
4. Vá em "Settings" > "API" e copie:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_KEY`

### 2. Gmail (Email)

1. Ative "App Passwords" em sua conta Google
2. Copie a senha e:
   - `EMAIL_USER` = seu email Gmail
   - `EMAIL_PASS` = app password gerada

### 3. Configurar .env

```bash
cp .env.example .env
# Edite .env com suas credenciais
```

### 4. Instalar dependências

```bash
npm install
```

### 5. Rodar local

```bash
npm run dev
```

API estará em `http://localhost:3000`

## Endpoints

### Jewelry
- `POST /api/jewelry/orders` - Nova ordem
- `GET /api/jewelry/orders` - Listar ordens

### Cleaning
- `POST /api/cleaning/requests` - Solicitação de cliente
- `POST /api/cleaning/professionals` - Cadastro profissional
- `GET /api/cleaning/professionals` - Listar profissionais

### Courses
- `POST /api/courses/enroll` - Inscrever aluno
- `GET /api/courses` - Listar cursos
- `POST /api/courses` - Criar curso (admin)

## Frontend Integration

Cada negócio tem seu próprio frontend. Todos chamam a mesma API:

```javascript
// Exemplo: Criar pedido jewelry
fetch('https://seu-dominio.com/api/jewelry/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer_name: 'João',
    customer_email: 'joao@email.com',
    customer_phone: '555-1234',
    delivery_method: 'Delivery',
    address: '123 Main St',
    items: [...],
    total: 299.90
  })
})
```

## Deploy Vercel

```bash
npm install -g vercel
vercel
```

Adicione env vars no Vercel dashboard.

## Estrutura

```
/api
  /routes      # Rotas por negócio
  /services    # Email, etc
  index.js     # App principal
schema.sql     # Database
```

---

Todos os dados vão para `binnovationmarketing@gmail.com` automaticamente.
