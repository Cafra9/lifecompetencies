## Problema

Ao anexar uma evidência cujo arquivo tem espaços ou acentos no nome (ex.: `K4B_2026_1 CECÍLIA AFONSO FALABELLA corrigido.txt`), o Supabase Storage devolve `Invalid key: …`. O bucket `student-evidences` valida o `path` e não aceita espaços nem vários caracteres Unicode.

A causa está em `src/components/EvidenceUploadDialog.tsx`, linha 68:

```ts
const path = `${user.id}/${studentId}/${Date.now()}_${file.name}`;
```

O `file.name` é usado cru.

## Correção

Sanitizar somente o nome do arquivo antes de compor o `path`, preservando a extensão:

1. Separar `nome` e `extensão`.
2. Normalizar para remover acentos (`normalize("NFD").replace(/[\u0300-\u036f]/g, "")`).
3. Substituir qualquer caractere fora de `[a-zA-Z0-9._-]` por `_`.
4. Colapsar `_` repetidos e cortar para no máximo ~80 caracteres.
5. Fallback `arquivo` se ficar vazio.
6. Recompor: `${user.id}/${studentId}/${Date.now()}_${nomeLimpo}.${ext}`.

O `Date.now()` continua garantindo unicidade; o nome original do arquivo já é guardado no campo `titulo`/metadados da evidência, então não há perda de informação para o professor.

## Escopo

- Editar apenas `src/components/EvidenceUploadDialog.tsx` (adicionar helper local + usar no `path`).
- Sem mudanças no schema, no bucket ou nas funções de servidor.
- Evidências já enviadas anteriormente continuam funcionando — a mudança afeta só novos uploads.

## Verificação

- Reanexar um arquivo com espaços e acentos no nome — upload deve concluir sem `Invalid key`.
- A evidência deve aparecer normalmente na lista do aluno e ser baixável.
- Arquivos com nomes já “limpos” devem continuar funcionando igual.