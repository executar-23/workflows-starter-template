# Índice CMD-COP — IDs verbais, slash e módulos (fonte única)

**Base normativa:** CMD-COP-001, "Índice de Slash Commands e IDs Verbais". O texto original está preservado na §1, sem remoções nem renomeações.
**Extensão:** HANDOFF-AGENTES-001 §4 (Camadas 2 e 3) e ADR-0003.
**Regra de manutenção:** todo ID novo entra aqui **antes** de virar command, skill ou agente. IDs e slashes existentes nunca são removidos nem renomeados; legados viram aliases.
**Módulos:** desde a emenda b do ADR-0003 (2026-09-27), operations, productivity e product-management são skills internas do `executar-cop` (Apache-2.0, ver `THIRD_PARTY_NOTICES.md`).
**Validação:** `python3 scripts/validar_plugin.py` confere unicidade, correspondência ID ↔ command e referências ao grafo.

Formato canônico das linhas de ID (lidas pelo validador): `CV-XXX-NNN — /comando — ação única`.

---

## 1. CMD-COP-001 (original, íntegro)

REGRA
O usuário pode operar por comando com barra ou por frase equivalente. O Orquestrador resolve o ID verbal e carrega somente o módulo necessário.

### Comandos de rotina
- CV-BOMDIA-001 — /bomdia — abrir o dia, validar continuidade e mostrar trabalho liberado.
- CV-AGORA-001 — /agora — mostrar somente o objeto atual, duração, DoD, evidência e próxima ação.
- CV-ESTADO-001 — /estado — mostrar progresso, Sprint/C72, Gate, bloqueios e estado atual.
- CV-FECHAR-001 — /fechardia — validar resultado, evidência, registrar transição e preparar continuidade.
- CV-REPLAN-001 — /replanejamento — recalcular apenas o trecho afetado por dependências, capacidade ou bloqueio.
- CV-MAPA-001 — /mapa — emitir MAPA-OS visual a partir da fonte canônica.
- CV-EVID-001 — /evidencia — consultar ou registrar evidência do objeto atual.
- CV-BLOQ-001 — /bloqueio — registrar impedimento ou consultar bloqueios ativos.

### Comandos de produtividade
- CV-ATUAL-001 — /atualizar — sincronização mínima de tarefas e contexto.
- CV-ATUAL-002 — /atualizar-abrangente — varredura profunda somente quando necessária.
- CV-CONTEXTO-001 — /contexto — recuperar contexto necessário ao objeto atual.
- CV-MEMORIA-001 — /memoria — consultar ou ajustar memória operacional.

### Comandos de operações
- CV-CAP-001 — /capacidade — planejar ou validar capacidade.
- CV-MUD-001 — /mudanca — estruturar mudança que afete escopo, processo ou sistema.
- CV-PROC-001 — /processo — documentar processo.
- CV-POP-001 — /procedimento — criar ou consultar procedimento operacional.
- CV-SIT-001 — /situacao — emitir situação operacional compacta.
- CV-FORN-001 — /fornecedor — avaliar fornecedor.
- CV-RISCO-001 — /risco — avaliar risco do objeto atual.
- CV-CONF-001 — /conformidade — validar critérios, normas e evidências.
- CV-OTIM-001 — /otimizar — reduzir desperdício, duplicação, espera e fricção do fluxo atual.

### Sinônimos verbais (originais)
- "Bom dia, copiloto" = /bomdia.
- "O que faço agora?" = /agora.
- "Como estamos?" = /estado.
- "Terminei por hoje" = /fechardia.
- "Preciso mudar o plano" = /replanejamento.
- "Me mostra o mapa" = /mapa.
- "Estou bloqueado" = /bloqueio.

### Regras de interação (originais, agora válidas para todo o plugin)
- Um comando deve produzir uma ação principal, não um relatório geral.
- O usuário não precisa informar o módulo.
- O usuário não precisa repetir IDs conhecidos quando o contexto atual for inequívoco.
- Se houver ambiguidade material entre dois objetos, o Orquestrador pede a mínima decisão necessária.
- Comandos antigos do legado podem ser aceitos como aliases, mas a interface preferida usa os comandos curtos deste índice.
- Todas as respostas visíveis em português do Brasil.

### Mapeamento do legado de operações (aliases)
- /planejar-capacidade → /capacidade.
- /solicitar-mudanca → /mudanca.
- /documentar-processo → /processo.
- /procedimento-operacional → /procedimento.
- /relatorio-situacao → /situacao.
- /avaliar-fornecedor → /fornecedor.

### Critério de aceite (original)
O operador deve conseguir conduzir o dia apenas com /bomdia, /agora, /estado, /fechardia e /replanejamento; os demais comandos são disclosure progressivo para situações específicas.

---

## 2. Extensão — Camada 2 (produto)
Termos "roadmap, spec, pesquisa" citados na Camada 2 do HANDOFF-AGENTES-001 §2.

- CV-ROADMAP-001 — /roadmap — atualizar, criar ou repriorizar o roadmap de produto.
- CV-SPEC-001 — /spec — escrever a spec/PRD de uma funcionalidade ou problema.
- CV-PESQ-001 — /pesquisa — sintetizar pesquisa com usuários (entrevistas, questionários, feedback) em insights.

Sinônimos:
- CV-ROADMAP-001: "Atualiza o roadmap"; "Repriorizar o roadmap"; "Como fica o roadmap com essa mudança?".
- CV-SPEC-001: "Escreve a spec disso"; "Transforma essa ideia em PRD"; "Preciso de um documento de requisitos".
- CV-PESQ-001: "Sintetiza essas entrevistas"; "Organiza esse feedback em insights"; "O que a pesquisa com usuários mostra?".

## 3. Extensão — Camada 3 (cadeia de valor proprietária)
- CV-DEPEND-001 — /dependencias — reconstruir a rede de dependências do Control Plane e entregar 16_REG, mapa e arquitetura de preenchimento.
- CV-ARVORE-001 — /arvore — converter um plano em árvore navegável a partir do estrutura.json.
- CV-VISUAL-001 — /arvore-visual — gerar a visualização Executar · Árvore Visual (JSON/HTML) de um plano ou projeto.
- CV-EDITORIAL-001 — /editorial — criar, continuar ou empacotar um ciclo editorial faseado no Obsidian.
- CV-CADEIA-001 — /cadeia-unica — unificar dependências, otimização, árvore roadmap, árvore visual e runbook numa cadeia única e publicar o working process no Worker.

Sinônimos:
- CV-DEPEND-001: "Reconstrói as dependências da planilha"; "Qual a ordem certa de preenchimento?"; "Monta o 16_REG_Dependencias".
- CV-ARVORE-001: "Transforma esse plano em árvore"; "Gera o kit da árvore"; "Quero esse plano em vault Obsidian".
- CV-VISUAL-001: "Mostra isso como árvore visual"; "Gera o HTML da árvore"; "Quero navegar esse projeto por ramos".
- CV-EDITORIAL-001: "Abre um ciclo editorial"; "Continua o job editorial"; "Empacota o handoff editorial".
- CV-CADEIA-001: "Transforma esse process doc em workflow"; "Roda a cadeia única"; "Quero dependências, árvores e runbook desse processo".

Aliases de modo (IDs da própria skill `executar-arvore-roadmap`; resolvem para CV-ARVORE-001 com o modo como argumento):
- ARVORE-TXT-01 → /arvore txt.
- ARVORE-ZIP-02 → /arvore zip.
- ARVORE-OBSIDIAN-03 → /arvore obsidian.
- ARVORE-CSV-04 → /arvore csv.
- ARVOREKIT → /arvore kit.


## 3b. Extensão — cobertura total (2026-09-27, ADR-0003 emenda c)
Nenhum componente do plugin fica sem ID verbal.

- CV-CONCOR-001 — /concorrencia — criar análise competitiva de concorrentes ou área de funcionalidade.
- CV-METRICA-001 — /metricas — revisar métricas de produto com tendência e ações.
- CV-IDEIA-001 — /brainstorm — explorar ideia, problema ou questão de produto como parceiro de pensamento.
- CV-SPRINT-001 — /sprint — planejar sprint: escopo, capacidade, metas e carryover.
- CV-STAKE-001 — /stakeholders — gerar atualização para stakeholders por público e cadência.
- CV-INICIO-001 — /iniciar — preparar TASKS.md, memória e dashboard de produtividade.
- CV-TAREFAS-001 — /tarefas — consultar, adicionar ou concluir tarefas do TASKS.md.
- CV-PLUGIN-001 — /personalizar-plugin — personalizar plugin para as ferramentas e fluxos da organização.
- CV-PLUGIN-002 — /criar-plugin — criar novo plugin do zero com estrutura válida.
- CV-PLANO-001 — /plano — transformar prompt bruto em plano de execução rastreável antes de implementar.
- CV-PRODEV-001 — /produto-codigo — conduzir produto → código: discovery, arquitetura, fatia vertical, testes e deploy.
- CV-TOOLKIT-001 — /execucao — orquestrar workflow multiagente, imagem existente ou redação técnica.

Sinônimos:
- CV-CONCOR-001: "Analisa os concorrentes"; "Como estamos contra o concorrente X?"; "Monta o battle card".
- CV-METRICA-001: "Revisa as métricas do mês"; "Por que essa métrica caiu?"; "Monta o scorecard".
- CV-IDEIA-001: "Vamos pensar juntos nessa ideia"; "Me ajuda a explorar esse problema"; "Desafia essa hipótese".
- CV-SPRINT-001: "Planeja o próximo sprint"; "O que cabe nesse sprint?"; "Monta o plano de sprint".
- CV-STAKE-001: "Escreve o update para a liderança"; "Comunica esse atraso aos stakeholders"; "Versão executiva do status".
- CV-INICIO-001: "Inicializa o copiloto de tarefas"; "Prepara o sistema de produtividade"; "Abre o dashboard".
- CV-TAREFAS-001: "Quais são minhas tarefas?"; "Adiciona essa tarefa"; "Marca como feita".
- CV-PLUGIN-001: "Personaliza esse plugin"; "Ajusta os conectores do plugin"; "Adapta o plugin às nossas ferramentas".
- CV-PLUGIN-002: "Cria um plugin novo"; "Scaffold de plugin"; "Quero montar um plugin".
- CV-PLANO-001: "Planeja antes de executar"; "Transforma isso num plano"; "Modo plano".
- CV-PRODEV-001: "Leva essa feature do produto ao código"; "Planeja a implementação dessa issue"; "Do PRD ao deploy".
- CV-TOOLKIT-001: "Divide isso entre vários agentes"; "Processa essa imagem"; "Escreve o relatório técnico".

---

## 4. Roteamento (ID → módulo → nó do grafo)
Proveniência do mapeamento pelo modelo epistêmico (`nucleo-dependencias.md` §1).

| ID | Slash | Módulo alvo | Nó | Proveniência | Visual | Busca web |
|---|---|---|---|---|---|---|
| CV-BOMDIA-001 | /bomdia | skill `copiloto-executar` | COPILOTO-EXECUTAR | DIRECT — a description da skill lista /bomdia | não | não |
| CV-AGORA-001 | /agora | skill `copiloto-executar` | COPILOTO-EXECUTAR | DIRECT — idem /agora | não | não |
| CV-ESTADO-001 | /estado | skill `copiloto-executar` | COPILOTO-EXECUTAR | DIRECT — idem /estado | não | não |
| CV-FECHAR-001 | /fechardia | skill `copiloto-executar` | COPILOTO-EXECUTAR | DIRECT — idem /fechardia | não | não |
| CV-REPLAN-001 | /replanejamento | skill `copiloto-executar` | COPILOTO-EXECUTAR | DIRECT — idem /replanejamento | não | não |
| CV-MAPA-001 | /mapa | skill `executar-mapa-os` | MAPA-OS | DERIVED — "emitir MAPA-OS" = objeto da skill executar-mapa-os | **sim** | não |
| CV-EVID-001 | /evidencia | skill `copiloto-executar` | COPILOTO-EXECUTAR | DERIVED — a skill cobre "registrar evidência" | não | não |
| CV-BLOQ-001 | /bloqueio | skill `copiloto-executar` | COPILOTO-EXECUTAR | DERIVED — a skill cobre "tratar bloqueio" | não | não |
| CV-ATUAL-001 | /atualizar | `executar-cop:update` | PROD-UPDATE | DERIVED — seção "produtividade" + skill update (sync mínimo) | não | não |
| CV-ATUAL-002 | /atualizar-abrangente | `executar-cop:update --comprehensive` | PROD-UPDATE | DERIVED — argumento `--comprehensive` da skill update | não | não |
| CV-CONTEXTO-001 | /contexto | `executar-cop:memory-management` | PROD-MEMORY | DERIVED — memória de trabalho decodifica o contexto | não | não |
| CV-MEMORIA-001 | /memoria | `executar-cop:memory-management` | PROD-MEMORY | DERIVED — "memória operacional" = skill memory-management | não | não |
| CV-CAP-001 | /capacidade | `executar-cop:capacity-plan` | OPS-CAPACITY-PLAN | DIRECT — legado /planejar-capacidade | **sim** (se gerar gráfico/board) | sim, se houver benchmark |
| CV-MUD-001 | /mudanca | `executar-cop:change-request` | OPS-CHANGE-REQUEST | DIRECT — legado /solicitar-mudanca | não | sim, se houver referência externa |
| CV-PROC-001 | /processo | `executar-cop:process-doc` | OPS-PROCESS-DOC | DIRECT — legado /documentar-processo | **sim** (se gerar gráfico/board) | sim, se houver referência externa |
| CV-POP-001 | /procedimento | `executar-cop:runbook` | OPS-RUNBOOK | DIRECT — legado /procedimento-operacional | não | sim, se houver referência externa |
| CV-SIT-001 | /situacao | `executar-cop:status-report` | OPS-STATUS-REPORT | DIRECT — legado /relatorio-situacao | **sim** (se gerar gráfico/board) | sim, se houver benchmark |
| CV-FORN-001 | /fornecedor | `executar-cop:vendor-review` | OPS-VENDOR-REVIEW | DIRECT — legado /avaliar-fornecedor | não | **sim** (dados de mercado) |
| CV-RISCO-001 | /risco | `executar-cop:risk-assessment` | OPS-RISK-ASSESSMENT | DERIVED — seção "operações" + skill risk-assessment | não | sim, se houver fato externo |
| CV-CONF-001 | /conformidade | `executar-cop:compliance-tracking` | OPS-COMPLIANCE-TRACKING | DERIVED — "normas" = skill compliance-tracking | não | **sim** (normas vigentes) |
| CV-OTIM-001 | /otimizar | `executar-cop:process-optimization` | OPS-PROCESS-OPTIMIZATION | DERIVED — "reduzir desperdício" = process-optimization | não | sim, se houver benchmark |
| CV-ROADMAP-001 | /roadmap | `executar-cop:roadmap-update` | PM-ROADMAP-UPDATE | DIRECT — handoff §2 "roadmap" | **sim** (se gerar gráfico/board) | sim, se houver fato de mercado |
| CV-SPEC-001 | /spec | `executar-cop:write-spec` | PM-WRITE-SPEC | DIRECT — handoff §2 "spec" | não | sim, se houver referência externa |
| CV-PESQ-001 | /pesquisa | `executar-cop:synthesize-research` | PM-SYNTHESIZE-RESEARCH | DIRECT — handoff §2 "pesquisa" | **sim** (se gerar gráfico/board) | sim, se houver dado externo |
| CV-DEPEND-001 | /dependencias | `executar-cop:executar-dependency-architect` | DEPENDENCY-ARCHITECT | DIRECT — handoff §6 | não | sim, se houver referência externa |
| CV-ARVORE-001 | /arvore | `executar-cop:executar-arvore-roadmap` | ARVORE-ROADMAP | DIRECT — handoff §6 | não | sim, se houver fato externo |
| CV-VISUAL-001 | /arvore-visual | `executar-cop:executar-mergulhe` | ARVORE-VISUAL | DIRECT — handoff §6 | **sim** | sim, se houver fato externo |
| CV-EDITORIAL-001 | /editorial | `executar-cop:obsidian-editorial-pipeline` | EDITORIAL-OBSIDIAN | DIRECT — handoff §6 | **sim** | **sim** (evidências e fontes) |
| CV-CADEIA-001 | /cadeia-unica | `executar-cop:cadeia-valor-unica` | CADEIA-VALOR-UNICA | DIRECT — pedido do usuário (2026-10-01): fusão dos nós §6 + otimização + runbook numa cadeia única | **sim** | sim, se houver fato externo |
| CV-CONCOR-001 | /concorrencia | `executar-cop:competitive-brief` | PM-COMPETITIVE-BRIEF | DIRECT — ID atribuído pelo usuário ("nada fica de fora"); módulo = a própria skill | **sim** | sim, obrigatória |
| CV-METRICA-001 | /metricas | `executar-cop:metrics-review` | PM-METRICS-REVIEW | DIRECT — ID atribuído pelo usuário ("nada fica de fora"); módulo = a própria skill | **sim** | sim, obrigatória quando comparar com benchmark externo |
| CV-IDEIA-001 | /brainstorm | `executar-cop:product-brainstorming` | PM-PRODUCT-BRAINSTORMING | DIRECT — ID atribuído pelo usuário ("nada fica de fora"); módulo = a própria skill | não | sim, obrigatória quando a discussão usar dado de mercado |
| CV-SPRINT-001 | /sprint | `executar-cop:sprint-planning` | PM-SPRINT-PLANNING | DIRECT — ID atribuído pelo usuário ("nada fica de fora"); módulo = a própria skill | **sim** | sim, obrigatória só se usar benchmark externo de velocidade |
| CV-STAKE-001 | /stakeholders | `executar-cop:stakeholder-update` | PM-STAKEHOLDER-UPDATE | DIRECT — ID atribuído pelo usuário ("nada fica de fora"); módulo = a própria skill | não | sim, obrigatória quando citar dado externo |
| CV-INICIO-001 | /iniciar | `executar-cop:start` | PROD-START | DIRECT — ID atribuído pelo usuário ("nada fica de fora"); módulo = a própria skill | **sim** | não |
| CV-TAREFAS-001 | /tarefas | `executar-cop:task-management` | PROD-TASK-MANAGEMENT | DIRECT — ID atribuído pelo usuário ("nada fica de fora"); módulo = a própria skill | não | não |
| CV-PLUGIN-001 | /personalizar-plugin | `executar-cop:cowork-plugin-customizer` | SETUP-PLUGIN-CUSTOMIZER | DIRECT — ID atribuído pelo usuário ("nada fica de fora"); módulo = a própria skill | não | não |
| CV-PLUGIN-002 | /criar-plugin | `executar-cop:create-cowork-plugin` | SETUP-CREATE-PLUGIN | DIRECT — ID atribuído pelo usuário ("nada fica de fora"); módulo = a própria skill | não | não |
| CV-PLANO-001 | /plano | `executar-cop:executar-plan-mode` | EXEC-PLAN-MODE | DIRECT — ID atribuído pelo usuário ("nada fica de fora"); módulo = a própria skill | não | não |
| CV-PRODEV-001 | /produto-codigo | `executar-cop:product-code-development` | EXEC-PRODUCT-CODE-DEV | DIRECT — ID atribuído pelo usuário ("nada fica de fora"); módulo = a própria skill | não | sim, obrigatória para documentação técnica e referências externas |
| CV-TOOLKIT-001 | /execucao | `executar-cop:execution-toolkit` | EXEC-TOOLKIT | DIRECT — ID atribuído pelo usuário ("nada fica de fora"); módulo = a própria skill | **sim** | não |

## 5. Desambiguação (o Orquestrador pede a decisão mínima)
- "mapa" sozinho → /mapa (sinônimo original). "Mapa de dependências" → /dependencias (parte 2). "Árvore" ou "ramos" → /arvore-visual se o pedido for visual, /arvore se for texto, zip, CSV ou vault.
- "pesquisa" sobre usuários → /pesquisa. "Pesquisa na web" não é comando: é a busca web obrigatória das skills.
- "status" ou "situação" operacional → /situacao. "Como estamos?" → /estado.

## 6. Fora deste índice (sem fonte que os mapeie)
- Comandos do plugin `copiloto-operacional` (`/hoje`, `/fila`, `/feito`, `/progresso`, `/campanha`, `/status-report`) — outro plugin, em `Sas-Executar/executar-Blog`. Não viram aliases até que exista decisão registrada.
- IDs `OBS-*` pertencem à skill `obsidian-editorial` (formatação), **não** ao `obsidian-editorial-pipeline`; não são aliases de /editorial.
