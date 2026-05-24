# START NEW PROJECT — Prompt de entrada para novo negócio

> Copie o bloco abaixo, preencha os campos e envie como PRIMEIRA mensagem
> em uma nova sessão do Claude. Não modifique as regras.

---

## COMO USAR

1. Abra nova sessão do Claude
2. Copie o bloco abaixo inteiro
3. Preencha os campos em [COLCHETES]
4. Envie — aguarde o plano de implementação
5. Aprove o plano ANTES de qualquer código

---

## PROMPT DE ENTRADA (copie e preencha)

```
A partir de agora, não quero que você reconstrua tudo do zero.

Use os arquivos de documentação abaixo como fonte principal:

- PROJECT_BLUEPRINT.md        → arquitetura técnica e visual do projeto base
- REPLICATION_GUIDE.md        → como adaptar para cada nicho
- COMPONENT_MAP.md            → mapa de componentes reutilizáveis
- BUSINESS_TEMPLATE.md        → framework comercial e modelo preenchível
- CLAUDE_REBUILD_PROMPT.md    → prompts técnicos por fase
- TEMPLATE_REFACTOR_PLAN.md   → estrutura do plano de implementação

Objetivo:
Criar uma nova versão do site para o seguinte negócio:

Nome do negócio:       [ex: Clean Pro / Studio Maya / PowerWash PA]
Nicho:                 [ex: limpeza residencial / fotografia / power washing]
Tipo de conversão:     [formulário de agendamento / carrinho / WhatsApp / link externo]
Serviços/produtos:     [liste até 6 — nome + breve descrição]
Público-alvo:          [ex: proprietários de imóveis em Philadelphia PA, 35–60 anos]
Localização:           [cidade, estado, país]
Objetivo principal:    [ex: gerar leads via formulário / vender produtos / agendar serviço]
Estilo visual:         [ex: clean/profissional como Lagos Cleaning / dark luxury como Lagos Jewelry / outro]
Cor primária desejada: [ex: #1a9e97 teal / #7C3AED roxo / #D97706 âmbar — ou descreva]
WhatsApp de contato:   [+1XXXXXXXXXX]
Email admin:           [admin@email.com]
Domínio pretendido:    [ex: cleanpro.app / studiomaya.com]

Componentes que quero reutilizar do Lagos World:
  [marque os que se aplicam ao novo negócio]
  [x] NavBar profissional (cleaning pattern)
  [x] Hero split grid (texto + card de prova)
  [ ] Hero dark luxury (jewelry pattern)
  [x] Service cards grid (3 colunas)
  [x] How it works (4 passos)
  [x] Before/after gallery
  [x] Review cards + rating summary
  [x] FAQ accordion
  [x] Booking form (agendamento)
  [ ] Product grid + cart (e-commerce)
  [ ] Product modal + checkout
  [x] Newsletter popup
  [x] WhatsApp float button
  [x] Admin panel (adaptar abas)
  [x] Email queue system (copiar direto)
  [x] Email templates (adaptar paleta)

Regras para esta sessão:
1. Não reinvente a arquitetura.
2. Reutilize o máximo possível dos componentes existentes.
3. Altere apenas o necessário.
4. Antes de codar, gere um TEMPLATE_REFACTOR_PLAN.md com o plano completo.
5. Liste quais arquivos serão criados ou alterados.
6. Explique por que cada alteração é necessária.
7. Aguarde minha aprovação antes de modificar qualquer código.
8. Evite criar componentes duplicados.
9. Evite adicionar bibliotecas novas sem necessidade.
10. Preserve responsividade, SEO, performance e padrão visual.
11. Teste o email ANTES de avançar para o frontend.
12. Commite depois de cada fase funcional.
```

---

## O QUE O CLAUDE FAZ APÓS RECEBER O PROMPT

1. Lê os 6 documentos de referência
2. Analisa o que pode ser reutilizado vs. criado do zero
3. Gera o `TEMPLATE_REFACTOR_PLAN.md` com:
   - Lista de arquivos a criar/modificar
   - Ordem de implementação
   - Estimativa de tokens por fase
   - Componentes reutilizados vs. novos
4. **Para e aguarda sua aprovação**
5. Só então começa a codar, fase por fase

---

## CHECKLIST ANTES DE ENVIAR O PROMPT

```
[ ] BUSINESS_TEMPLATE.md preenchido (todos os 35 campos)
[ ] Textos principais prontos (hero, serviços, reviews, FAQ)
[ ] Imagens disponíveis (foto do fundador + 3–5 do serviço/produto)
[ ] WhatsApp número confirmado
[ ] Gmail para envio criado + App Password gerado
[ ] Supabase projeto criado (gratuito em supabase.com)
[ ] Domínio definido (Vercel fornece .vercel.app grátis se não tiver domínio)
```

---

*Salve este arquivo. Use em todo novo projeto baseado no Lagos World.*
