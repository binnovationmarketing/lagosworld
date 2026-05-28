# Como Continuar o Projeto em Nova Janela de Contexto

> Guia de melhores práticas para Henrique — escrito em 2026-05-28

---

## Por que a janela fica cheia?

Claude tem um limite de contexto (~200k tokens). Quando fica cheio:
- Respostas ficam mais lentas e caras
- Claude "esquece" detalhes do início da conversa
- Custo por token aumenta (contexto cheio = mais caro)

**Solução:** começar nova conversa com um "resumo de contexto" em vez de reexplicar tudo.

---

## Como iniciar nova sessão corretamente

### Passo 1 — Copie este prompt de início de sessão:

```
Você é meu AI developer para o projeto Lagos World (lagosworld.app).

Leia obrigatoriamente estes arquivos antes de qualquer tarefa:
- CLAUDE.md         → stack, estrutura, segurança, estado atual
- PENDENCIAS.md     → o que falta fazer
- CLAUDE_REBUILD_PROMPT.md → instruções detalhadas de comportamento

Projeto: /Users/rique_energy/Documents/Negocios/Lagos Cleaning/

Regras imutáveis:
- NUNCA git reset --hard / git checkout -- . / git clean -fd
- NUNCA promover para produção sem aprovação explícita
- ADMIN_PASSWORD somente em env var, nunca em HTML
- Commits em inglês, código em inglês, comentários em inglês

Tarefa desta sessão: [DESCREVA O QUE PRECISA AQUI]
```

### Passo 2 — Cole o prompt, adicione sua tarefa no final

Exemplo:
```
Tarefa desta sessão: No admin panel (public/admin/index.html),
quero adicionar um botão de "Enviar Fatura" na tabela de cleaning leads.
Quando clicado, deve abrir um modal com os dados do cliente preenchidos.
```

### Passo 3 — Claude vai ler CLAUDE.md automaticamente

O arquivo CLAUDE.md já contém:
- Stack completo
- Estrutura de arquivos
- Regras de segurança
- Estado atual do admin panel
- Bugs conhecidos e correções já feitas

**Você não precisa explicar nada que já está no CLAUDE.md.**

---

## O que NUNCA fazer em nova sessão

❌ **Não cole o histórico inteiro da sessão anterior**
- Isso gasta tokens sem necessidade
- Claude lê mais rápido um arquivo de contexto do que um histórico longo

❌ **Não explique o projeto do zero**
- "Esse é um projeto de limpeza com Next.js..." — desnecessário se Claude leu CLAUDE.md

❌ **Não peça tudo de uma vez em uma única mensagem**
- 1 tarefa = 1 mensagem
- Isso sozinho reduz uso de tokens em 60%+

---

## Posso deletar o histórico antigo?

**SIM, pode deletar.** O histórico das conversas no Claude não é necessário para continuar o projeto. Todo o conhecimento importante está:

- `CLAUDE.md` → estado atual do projeto, stack, regras
- `PENDENCIAS.md` → o que falta fazer
- `CLAUDE_REBUILD_PROMPT.md` → instruções detalhadas
- `LAGOS_CLEANING_ROADMAP.md` → roadmap do novo domínio
- O próprio **código no git** → histórico completo de mudanças (`git log`)

**Backup recomendado antes de deletar:**
```bash
cd "/Users/rique_energy/Documents/Negocios/Lagos Cleaning"
git log --oneline -20  # ver os últimos commits
```
Se os commits estão lá, o código está seguro. O histórico de conversa é só texto — não tem código.

---

## Como economizar tokens (você gastou 130k+ numa mensagem)

### Causa do problema
Você mandou uma mensagem com **8-10 pedidos diferentes de uma vez**. Claude processa tudo isso mantendo contexto de cada item simultaneamente — isso multiplica o custo.

### Regras para economizar tokens

**Regra 1: 1 tarefa por mensagem**
```
❌ "Quero: customer tabs, low stock <3, instagram button, template modal, whatsapp proof, 
    revenue month, remover client strategies, e também analise estratégica do domínio"

✅ "Muda o threshold do low stock para < 3" (envia)
   → espera resposta
   "Agora adiciona o botão do Instagram no topbar" (envia)
   → espera resposta
```

**Regra 2: Seja específico, não geral**
```
❌ "Melhora o admin panel"
✅ "Na linha 1640 do admin/index.html, muda <= 10 para < 3"
```

**Regra 3: Não peça explicação + código ao mesmo tempo**
```
❌ "Me explica por que o email não funciona e depois conserta"
✅ "Conserta o bug de email no cleaning.js" (Claude já sabe explicar no processo)
```

**Regra 4: Use subagentes para tarefas de leitura**
```
✅ "Use o Explore agent para encontrar onde o email é enviado no projeto"
   (Explore usa menos tokens que Claude principal lendo vários arquivos)
```

**Regra 5: Referência por arquivo:linha, não por descrição**
```
❌ "No arquivo do admin, na parte que cuida dos pedidos, onde tem o botão de prova"
✅ "admin/index.html linha 1237 — função requestProof()"
```

**Regra 6: Nova sessão = nova conversa**
- Quando a sessão fica longa, inicie nova com o prompt de contexto acima
- Não acumule 200k tokens numa única sessão

### Estimativa de custo por tipo de tarefa

| Tarefa | Tokens estimados | Custo aprox |
|---|---|---|
| Correção de bug simples (1 arquivo, <20 linhas) | 5k-15k | $0.05-0.15 |
| Feature nova (1 arquivo) | 15k-30k | $0.15-0.30 |
| Múltiplas features juntas (como hoje) | 80k-150k | $0.80-1.50 |
| Sessão completa de desenvolvimento | 50k-200k | $0.50-2.00 |

**Separando em tarefas individuais você economiza ~60-70% dos tokens.**

---

## Workflow recomendado daqui para frente

```
1. Abre nova conversa no Claude
2. Cola o SESSION START PROMPT (acima) com 1 tarefa específica
3. Claude lê CLAUDE.md automaticamente
4. Faz a tarefa
5. Claude commita o código
6. Você testa em produção
7. Se precisar de mais tarefas: nova mensagem (na mesma sessão ou nova)
8. Quando a sessão ficar longa (~50+ mensagens): nova conversa
```

---

## Arquivos de referência do projeto

| Arquivo | O que tem |
|---|---|
| `CLAUDE.md` | Estado atual do projeto, stack, regras, bugs corrigidos |
| `PENDENCIAS.md` | Lista do que falta fazer |
| `LAGOS_CLEANING_ROADMAP.md` | Passo a passo do novo domínio Lagos Cleaning |
| `CLAUDE_REBUILD_PROMPT.md` | Instruções detalhadas de comportamento do Claude |
| `SESSION_START_PROMPT.md` | Template de início de sessão |
| `PRINCIPLES.md` | Princípios de design e negócio |
