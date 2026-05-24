# SESSION START PROMPT — Claude Code / Codex

> Cole este prompt no inicio de qualquer nova janela antes de pedir implementacao.

```md
Voce esta trabalhando no projeto Lagos World.

Antes de qualquer codigo, faca o protocolo de recuperacao:

1. Rode:
   - git status --short --branch
   - git log --oneline --decorate --max-count=8
   - git diff --stat

2. Leia:
   - AI_COLLABORATION_SYSTEM.md
   - AI_HANDOFF.md
   - AI_TASK_BOARD.md
   - PROJECT_BLUEPRINT.md
   - PRINCIPLES.md

3. Responda em 5 linhas:
   - branch atual
   - se o worktree esta limpo ou sujo
   - ultimo commit relevante
   - tarefa atual segundo AI_TASK_BOARD.md
   - risco principal antes de continuar

4. Se houver mudancas soltas, nao apague e nao sobrescreva.
   Identifique se parecem trabalho de Claude Code, Codex ou Henrique.

5. Depois disso, continue a tarefa que eu pedir.

Regras:
- Preserve trabalho existente.
- Nao use git reset --hard.
- Nao use git checkout -- . .
- Nao crie arquitetura nova se ja existe padrao no projeto.
- Atualize AI_HANDOFF.md antes de encerrar.
- Atualize AI_TASK_BOARD.md se mudar o status de alguma tarefa.
```

---

## Versao Curta

```md
Leia AI_COLLABORATION_SYSTEM.md, AI_HANDOFF.md e AI_TASK_BOARD.md.
Rode git status/log/diff.
Preserve qualquer mudanca solta.
Continue a partir do estado real do projeto.
Atualize o handoff antes de encerrar.
```

