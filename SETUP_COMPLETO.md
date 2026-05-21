# Lagos Platform - Setup Completo

## 📋 O que foi criado

Backend Express + Database Supabase + Email automático para todos 3 negócios.

Todos os dados vão para `binnovationmarketing@gmail.com` automaticamente.

---

## 🚀 Próximos Passos

### 1. Setup Backend (5 min)

#### Supabase (Free DB)
1. Crie conta em https://supabase.com
2. Novo projeto (free tier)
3. Vá em "SQL Editor" → cole conteúdo de `schema.sql`
4. Copie `Project URL` e `anon key` de Settings > API

#### Gmail (Free Email)
1. Ative 2FA na conta Google
2. Gere "App Password" em https://myaccount.google.com/apppasswords
3. Copie senha

#### .env
```bash
cp .env.example .env
```

Edite com suas credenciais:
```
SUPABASE_URL=seu-url
SUPABASE_KEY=sua-key
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=app-password-gerada
```

#### Instalar & rodar
```bash
npm install
npm run dev
```

API estará em `http://localhost:3000`

---

### 2. Landing Pages (cada negócio)

#### **Lagos Jewelry** ✅ Pronto
- Existing: `index.html` (e-commerce)
- API já integrada no checkout
- Dados vão para email automático

#### **Lagos Cleaning** 🔨 Criar
Arquivo: `public/cleaning/index.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>Lagos Cleaning - Professional Cleaning Services (US)</title>
    <meta name="description" content="Professional cleaning for homes and businesses. Part-time & Full-time opportunities available.">
    <link rel="stylesheet" href="styles.css">
    <script>window.API_URL = 'https://seu-dominio.com/api';</script>
</head>
<body>

<!-- HERO SECTION -->
<section class="hero">
    <h1>Professional Cleaning Services & Job Opportunities</h1>
    <p>Connect with trusted cleaners. Earn flexible income.</p>
    <div class="cta-buttons">
        <button onclick="showForm('customer')">I Need Cleaning</button>
        <button onclick="showForm('professional')">I'm a Professional</button>
    </div>
</section>

<!-- CUSTOMER FORM -->
<form id="customer-form" style="display:none;" onsubmit="submitCustomerForm(event)">
    <h2>Request Cleaning Service</h2>
    <input type="text" name="name" placeholder="Your Name" required>
    <input type="email" name="email" placeholder="Email" required>
    <input type="tel" name="phone" placeholder="Phone" required>
    <select name="service_type" required>
        <option>Select Service</option>
        <option value="residential">Residential</option>
        <option value="commercial">Commercial</option>
    </select>
    <select name="employment_type">
        <option>Employment Type</option>
        <option value="part-time">Part-time</option>
        <option value="full-time">Full-time</option>
    </select>
    <input type="text" name="address" placeholder="Address" required>
    <textarea name="description" placeholder="Service Details"></textarea>
    <input type="date" name="preferred_date">
    <input type="number" name="estimated_hours" placeholder="Estimated Hours" step="0.5">
    <button type="submit">Request Service</button>
</form>

<!-- PROFESSIONAL FORM -->
<form id="professional-form" style="display:none;" onsubmit="submitProfessionalForm(event)">
    <h2>Register as Professional</h2>
    <input type="text" name="name" placeholder="Your Name" required>
    <input type="email" name="email" placeholder="Email" required>
    <input type="tel" name="phone" placeholder="Phone" required>
    <label>Specialties:</label>
    <label><input type="checkbox" name="specialties" value="residential"> Residential</label>
    <label><input type="checkbox" name="specialties" value="commercial"> Commercial</label>
    <input type="number" name="hourly_rate" placeholder="Hourly Rate ($)" step="0.01">
    <button type="submit">Register</button>
</form>

<script>
function showForm(type) {
    document.getElementById('customer-form').style.display = type === 'customer' ? 'block' : 'none';
    document.getElementById('professional-form').style.display = type === 'professional' ? 'block' : 'none';
}

async function submitCustomerForm(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = {
        customer_name: form.get('name'),
        customer_email: form.get('email'),
        customer_phone: form.get('phone'),
        service_type: form.get('service_type'),
        employment_type: form.get('employment_type'),
        address: form.get('address'),
        description: form.get('description'),
        preferred_date: form.get('preferred_date'),
        estimated_hours: parseFloat(form.get('estimated_hours')) || null
    };
    
    const res = await fetch(window.API_URL + '/cleaning/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    alert(res.ok ? 'Request sent! We will contact you soon.' : 'Error');
}

async function submitProfessionalForm(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const specialties = Array.from(form.getAll('specialties'));
    const data = {
        name: form.get('name'),
        email: form.get('email'),
        phone: form.get('phone'),
        specialties: specialties,
        hourly_rate: parseFloat(form.get('hourly_rate')) || null
    };
    
    const res = await fetch(window.API_URL + '/cleaning/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    alert(res.ok ? 'Registration received! We will review and contact you.' : 'Error');
}
</script>

</body>
</html>
```

#### **Lagos Courses (Lagos World)** 🔨 Criar
Arquivo: `public/courses/index.html`

Similar pattern. Enroll students com modalidade (online/presencial).

---

### 3. Deploy Backend (Vercel)

```bash
npm install -g vercel
vercel
```

Adicione vars no dashboard Vercel:
- SUPABASE_URL
- SUPABASE_KEY
- EMAIL_USER
- EMAIL_PASS
- ADMIN_EMAIL

Backend ficará em: `https://seu-projeto.vercel.app`

Atualize `window.LAGOS_API_URL` no frontend para URL de produção.

---

### 4. Deploy Frontend (Vercel)

```bash
cd public
vercel
```

---

## 📧 Email Flow

Quando cliente/profissional submete:
1. Dados salvos em Supabase
2. Email automático para `binnovationmarketing@gmail.com`
3. Email de confirmação para cliente/profissional

---

## 🔗 Integração Google Calendar (Cleaning)

Para booking automático:
1. Crie Google Service Account
2. Compartilhe calendário com service account
3. Adicione credenciais ao `.env`
4. Use biblioteca `googleapis` no backend

---

## ✅ Checklist Final

- [ ] Supabase criado e schema importado
- [ ] Gmail app password gerado
- [ ] .env configurado
- [ ] `npm install` rodado
- [ ] Backend testa em localhost:3000
- [ ] Deploy backend Vercel
- [ ] Deploy frontend Vercel
- [ ] Domínio customizado (opcional)

---

## 📊 Admin Dashboard (Próximo)

Criar painel para gerenciar:
- Pedidos Jewelry
- Solicitações Cleaning
- Inscrições Cursos
- Profissionais aprovados

URL: `/admin` (protegida por senha)

---

**Tudo pronto! Cada lead vai direto para seu email. Comece! 🚀**
