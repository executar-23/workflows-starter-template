---
name: executar-arvore-roadmap
description: Converte planejamentos, roadmaps, sprints e cronogramas longos e desestruturados (planilhas, PDFs, documentos de metodologia, ou até uma simples descrição de projeto) em uma árvore de navegação hierárquica — mês → semana → dia → ciclo → tarefa → dependência → porta → evidência. Use sempre que o usuário pedir para transformar um plano em "árvore", "diretório navegável", "roadmap em texto", "cronograma em árvore", quando mencionar IDs desta skill (ARVORE-TXT-01, ARVORE-ZIP-02, ARVORE-OBSIDIAN-03, ARVORE-CSV-04, ARVOREKIT), quando pedir um vault Obsidian de mergulho progressivo para um plano operacional, ou quando pedir para converter um plano inteiro em CSV estruturado. Também dispare quando o usuário descrever um projeto do zero (sem plano pronto) e pedir para gerar o kit completo de planejamento em formato de árvore. Acionada também pelo ID verbal CV-ARVORE-001 (/arvore) do plugin executar-cop.
---

# Executar Árvore Roadmap

Esta skill converte qualquer plano — por mais longo, bagunçado ou espalhado por múltiplos
formatos que esteja — em uma única lógica de navegação: cada nível da árvore responde a uma
pergunta diferente (mês → "em qual período?", dia → "o que precisa avançar hoje?", ciclo M0–M4 →
"que tipo de energia/processo é esse?", tarefa → "qual objeto concreto?", dependência → "o que
precisa existir antes?", porta → "que condição maior isso ajuda a atravessar?", peso → "quanto do
plano inteiro isso representa?", evidência → "como provo que terminou?").

A regra de ouro: **nenhuma interface derivada tem cronograma ou estado independente**. Árvore
txt, árvore física em zip, vault Obsidian e CSV são todas projeções do mesmo `estrutura.json` —
nunca invente números diferentes em cada uma.

## Integração executar-cop
- **ID verbal:** CV-ARVORE-001 (`/arvore`). Os IDs de modo desta skill (ARVORE-TXT-01…ARVOREKIT) são aliases resolvidos pelo Orquestrador. Nó `ARVORE-ROADMAP` em `../../references/grafo-dependencias.json`.
- **Pré-voo de dependências:** aplicar `../../references/nucleo-dependencias.md` antes de extrair.
  - No fluxo PEM-PIPELINE-PROPRIETARIO, quando a entrada é o Control Plane, esta skill depende da Arquitetura de Preenchimento de `executar-dependency-architect` (DEP-COP-001, bloqueante). Sem ela, a situação é bloqueado-interno: sugira `/dependencias`.
  - Com outra entrada (planilha avulsa, PDF, descrição), prossiga e registre a origem.
  - Cada `depende_de` do `estrutura.json` recebe tag epistêmica no relatório de entrega: `DIRECT` quando vem do documento, `DERIVED` ou `PROPOSED` quando você a inferiu. Uma proposta gerada só a partir de descrição é inteira `PROPOSED`.
- **Saída:** `estrutura.json` validado. Ele desbloqueia `ARVORE-VISUAL` (CV-VISUAL-001).
- **Busca web:** obrigatória quando o plano citar benchmark, prazo regulatório, referência de mercado ou outro dado externo desatualizável. Cite a fonte e nunca a use para inventar tarefas.
- **Saída visual:** os entregáveis são texto, zip, CSV e vault. Se gerar HTML, SVG ou CSS de vault, aplicar `../../assets/design-tokens/calendario-light-mode.md`.
- Toda resposta sai em português do Brasil.

## Fluxo de trabalho (sempre nesta ordem)

### 1. Extraia — você faz isso, não um script

Leia o documento de entrada (planilha, PDF, .txt solto, print, ou o que for) ou, se o usuário só
descreveu o projeto em palavras, use raciocínio (think) para propor uma estrutura razoável.
Consulte `references/schema.md` para o schema completo e as regras de extração (IDs estáveis,
`depende_de` só referenciando IDs existentes, pesos somando ~100%, etc).

Escreva o resultado em `estrutura.json` num diretório de trabalho. Isto é sempre o primeiro
artefato, mesmo que o usuário só peça um dos quatro entregáveis — os scripts de renderização não
funcionam sem ele.

Se a entrada já é rica (planilha com datas, pesos e dependências explícitas), extraia com
fidelidade — não simplifique nem resuma. Se a entrada é curta ou é só a descrição de um projeto,
diga claramente ao usuário que você gerou uma primeira proposta e que ele deve revisar antes de
tratar os pesos e portas como definitivos.

### 2. Valide

```bash
python3 scripts/validate_structure.py estrutura.json
```

Sempre rode isso antes de gerar qualquer entregável, mesmo quando o usuário só pediu um modo
específico. O relatório mostra tarefas totais, dias, portas, links quebrados (dependências ou
portas que apontam para IDs inexistentes) e se a soma dos pesos bate com o total declarado. Erros
bloqueiam a geração — corrija `estrutura.json` e rode de novo. Avisos não bloqueiam, mas devem ser
mostrados ao usuário.

### 3. Gere o(s) entregável(is) pedido(s)

Cada modo tem um ID determinístico. O usuário pode pedir um ou vários pelo ID, por nome, ou pedir
o kit completo.

| ID | O que entrega | Comando |
|---|---|---|
| `ARVORE-TXT-01` | Um único arquivo `.txt` com a árvore completa navegável | `python3 scripts/render_tree_txt.py estrutura.json saida/ARVORE.txt` |
| `ARVORE-ZIP-02` | A mesma árvore, mas como pastas e arquivos `.txt` **reais** em disco, zipada | `python3 scripts/render_tree_zip.py estrutura.json saida/arvore_fisica saida/ARVORE-ZIP.zip` |
| `ARVORE-OBSIDIAN-03` | Vault Obsidian completo — "deep file", mergulho progressivo (Dia → Ciclo → Tarefa → Evidência → Porta → Próximo mergulho → Fechamento), Properties como YAML frontmatter, zipado | `python3 scripts/render_obsidian_vault.py estrutura.json saida/vault saida/OBSIDIAN.zip` |
| `ARVORE-CSV-04` | CSV estruturado, uma linha por tarefa, com todas as colunas (id, data, ciclo, título, peso, status, dependências, porta, evidência) | `python3 scripts/render_csv.py estrutura.json saida/DADOS.csv` |
| `ARVOREKIT` | Todos os quatro acima + relatório de validação, num único zip | `python3 scripts/build_kit.py estrutura.json saida <slug-do-projeto>` |

`ARVOREKIT` já roda a validação internamente e para a execução se houver erro bloqueante — não
precisa rodar `validate_structure.py` separadamente antes dele.

Se o usuário não especificar o modo, pergunte objetivamente (ou infira do contexto: "gera a
árvore" sem mais detalhes normalmente quer dizer `ARVORE-TXT-01`; "quero levar isso pro Obsidian"
quer dizer `ARVORE-OBSIDIAN-03`; "manda tudo" ou "o kit" quer dizer `ARVOREKIT`).

### 4. Entregue

Copie os arquivos finais para o diretório de saída padrão e apresente-os com `present_files`.
Para o modo `ARVOREKIT`, apresente só o `.zip` final — os arquivos individuais já estão dentro
dele, não precisa apresentá-los separadamente também (a menos que o usuário peça para ver algum
isoladamente).

## Sobre o vault Obsidian (`ARVORE-OBSIDIAN-03`)

O vault segue a experiência de mergulho progressivo: cada nota de tarefa é auto-suficiente —
ao chegar no final de uma, o usuário não precisa voltar, pesquisar ou abrir calendário para saber
o que vem depois, porque "PRÓXIMO MERGULHO →" já aponta para o próximo nó. As Properties (YAML
frontmatter) existem para o Obsidian e para qualquer controlador automatizado, mas a leitura
humana acontece no corpo da nota — avise o usuário que ele pode ocultar as Properties em
Configurações → Editor → Propriedades no documento → Ocultas, para cair direto na tarefa ao abrir
uma nota.

## Reprocessamento e correções

Se o usuário pedir para corrigir uma tarefa, redistribuir pesos, ou adicionar/remover itens depois
de já ter gerado entregáveis, edite `estrutura.json` diretamente (não os arquivos renderizados) e
rode a validação + renderização de novo. Os arquivos renderizados são sempre descartáveis e
recriados do zero — nunca edite um `.md`, `.txt` ou `.csv` gerado esperando que a próxima geração
preserve a edição.

## Referências

- `references/schema.md` — schema completo do `estrutura.json`, regras de extração, e como lidar
  com entradas em formatos variados ou com apenas uma descrição de projeto.
