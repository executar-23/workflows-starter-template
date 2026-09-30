---
name: plano-operacional-rastreavel
description: Gera o pacote completo de planejamento operacional mensal rastreável da metodologia proprietária da empresa (motor de evidência com IDs estáveis, hierarquia de fontes, classificação FACT/DECISION/ASSUMPTION/GAP/CONFLICT, e limite normativo ISO 9001/10005/10006/21502/31000/10075-2). Use esta skill sempre que o usuário pedir para gerar, montar, produzir ou reproduzir um "plano operacional", "plano mensal", "plano de julho/agosto/etc para [cliente]", quando mencionar rodar o "formulário mensal" para um cliente, quando pedir para aplicar "a metodologia" ou "o processo da Opus/motor de evidência" a um novo caso, ou quando pedir o pacote de entregáveis (documento interno + roadmap do cliente + schema Linear + calendário one-page). Dispare também quando o usuário mencionar reproduzir o mesmo resultado/schema para outro cliente ou projeto, mesmo sem usar essas palavras exatas.
---

# Plano Operacional Rastreável — Metodologia Padronizada

Esta skill reproduz, para qualquer cliente/projeto, o mesmo motor de planejamento usado para produzir o entregável de referência (documento com Resumo Executivo, Inventário de Fontes, tabelas FACT/DECISION/ASSUMPTION/GAP/CONFLICT, Estrutura Harmonizada, Objetivos, Capacidade, Workstreams, Plano Semanal, Registro de Tarefas, Visão Diária, Stakeholders, Métricas, Riscos, Itens Adiados, Gates de Decisão e Próxima Ação Única).

O resultado final é sempre um **pacote de 4 entregáveis** (ver §5).

## Visão geral do fluxo

1. **Intake** — coletar os dados do cliente via artefato de formulário interativo (§1)
2. **Normalização e classificação de evidência** — aplicar o motor de IDs e a hierarquia de fontes (`references/motor-evidencia-fontes.md`)
3. **Limite normativo** — aplicar o conjunto ISO fixo da empresa, sem inventar requisitos (`references/normas-fixas-iso.md`)
4. **Construção do plano** — 7 fases internas (capacidade, priorização, construção, cross-check)
5. **Geração do pacote de 4 entregáveis** (§5)

Nunca pule a etapa de classificação de evidência para "ir direto" ao documento final — é isso que garante que o mesmo processo produza sempre o mesmo padrão de qualidade, independente do cliente.

---

## 0. Antes de começar — verificar fontes vivas e protocolo atualizado

Assim como um servidor MCP não deve ser implementado só com o que já está na memória de treinamento (o protocolo e os SDKs mudam), **esta metodologia também não deve ser aplicada só de memória** quando o assunto puder ter mudado desde o treinamento. Antes de processar o primeiro cliente de uma sessão (ou se já faz tempo desde a última verificação), faça esta checagem rápida:

1. **Status das normas do conjunto fixo** — use `web_search`/`web_fetch` para confirmar, na página oficial de catálogo de cada norma (iso.org/standard/...), se a edição/emenda ainda é a vigente (hoje: ISO 9001:2015/Amd 1:2024). Normas raramente mudam, mas uma nova emenda ou revisão publicada muda o texto do disclaimer normativo e as citações de cláusula. Não é preciso reproduzir o texto da norma (é protegido por direitos autorais) — só confirmar metadados: edição, status, data de publicação/emenda mais recente.
2. **Registro de qualquer atualização** — se algo mudou desde `references/normas-fixas-iso.md`, registre a fonte como `EXTERNAL CURRENT SOURCE` (título, publicador, data, URL, fato exato verificado) na tabela de fontes do documento interno, e sinalize ao usuário que o arquivo de referência da skill deveria ser atualizado.
3. **Documentos internos vivos da empresa** — se a empresa mantiver a metodologia/protocolo mestre em um repositório vivo (Notion, Google Drive, etc.) em vez de só nesta skill, e houver conector disponível, busque lá a versão mais recente antes de aplicar regras desatualizadas. Priorize a fonte viva sobre o texto fixo desta skill quando houver conflito — e registre isso como CONFLICT com a hierarquia de fontes normal (§2).
4. **Não repita essa verificação a cada tarefa dentro da mesma sessão/cliente** — uma vez por sessão de trabalho (ou quando o usuário mencionar uma norma nova) é suficiente. Não é necessário fazer isso para pedidos simples de ajuste em um documento já gerado.

Se não houver acesso à internet nesta sessão, prossiga com o conjunto fixo documentado em `references/normas-fixas-iso.md` e registre isso como limitação no documento interno (não bloqueia o processamento).

---

## 1. Intake do cliente

Sempre que iniciar um novo cliente/projeto/mês, gere (não apenas descreva) um artefato HTML interativo de formulário, usando como base `assets/formulario-intake.html`. Copie o arquivo, ajuste o título/branding se solicitado, e crie via `create_file` em `/mnt/user-data/outputs/`.

O formulário cobre, na ordem:

1. **Identificação** — titular do plano, nome do projeto/sistema/produto, consultor(a) de validação (se houver), usuários-teste (se houver), período (mês/ano), data de emissão, fuso horário.
2. **Declaração da fonte** — autor, método de coleta, limite epistemológico.
3. **Perfil e propósito** — objetivo do negócio/projeto, linha de produção priorizada (ex.: aprender → aplicar → registrar → publicar → validar — mas deixe o campo livre, não é fixo).
4. **Recursos e restrições** — capacidade semanal em horas, melhor janela de energia, dias de descanso/revisão leve, preferências de processo, restrições declaradas, sistema atual de organização.
5. **Diagnóstico** — problema central declarado pelo cliente.
6. **Padrão transversal de qualidade** — contexto → requisito → responsável → capacidade → risco → critério de aceite → evidência → revisão (fixo, não editável pelo cliente).
7. **Frentes do mês** — lista livre (nome + objetivo de cada frente/workstream).
8. **Estratégia** — meta mensal única, gates semanais, entrega diária, distribuição percentual de capacidade (principal/operação/contingência).
9. **Riscos e respostas** — lista livre (risco + resposta).
10. **Indicação final** — a cadeia de valor priorizada do mês, em uma frase.
11. **TBD obrigatório** — lista de lacunas já conhecidas pelo cliente (indicador, baseline, critérios de concluído, responsáveis, etc.) — **não preencha isso por ele**; é para ficar em aberto se ele não souber.

Ao final do formulário, o botão "Gerar JSON estruturado" deve montar e exibir (em um `<textarea>` ou bloco `<pre>` copiável) o JSON completo, seguindo exatamente o schema descrito em `references/formulario-e-intake.md`. Instrua o cliente/usuário a copiar esse JSON e colar de volta na conversa.

**Se o usuário já colar um JSON preenchido (ou responder as perguntas em texto livre) sem passar pelo artefato**, aceite normalmente — o artefato é uma conveniência de coleta, não um requisito de formato. Extraia os mesmos campos do texto livre.

---

## 2. Classificação de evidência e IDs estáveis

Leia `references/motor-evidencia-fontes.md` antes de processar qualquer JSON de intake. Resumo do que você vai aplicar:

- Todo elemento relevante recebe um **ID estável** com prefixo (`SRC`, `FACT`, `DECISION`/`DEC`, `REQ`, `OBJ`, `KR`, `TSK`, `DEP`, `STK`, `RSK`, `ASM`, `GAP`, `MET`, `GATE`, `CONF`, `NRM`).
- Toda afirmação relevante é classificada como **FACT, DECISION, REQUIREMENT, CONSTRAINT, ASSUMPTION, HYPOTHESIS, RECOMMENDATION, GAP, CONFLICT ou NORMATIVE REQUIREMENT** — nunca deixe uma afirmação sem classificação.
- Hierarquia de fontes fixa (da mais para a menos autoritativa): (1) instruções explícitas desta conversa/prompt do usuário → (2) formulário mensal mais recente preenchido → (3) decisões já registradas em documentos do projeto do cliente → (4) documentos normativos anexados → (5) registros operacionais/planos anteriores → (6) contexto pessoal aprovado (capacidade, restrições cognitivas) → (7) planilhas/arquivos legados (apenas referência histórica, nunca determinam o plano novo) → (8) registros antigos superados → (9) fontes externas (web).
- Conflitos entre fontes **nunca são fundidos silenciosamente**: registre ambas as versões, diga qual prevaleceu e por quê, na tabela de conflitos (CONF-XX).
- Nunca use "deve"/"obrigatório" a menos que derive de: instrução explícita do usuário, decisão aprovada do cliente, requisito de projeto aprovado, ou cláusula normativa aplicável. Use "recomendado"/"deveria" para o resto.

---

## 3. Limite normativo (conjunto ISO fixo da empresa)

Leia `references/normas-fixas-iso.md`. Pontos inegociáveis:

- O conjunto normativo de referência é **sempre**: ISO 9001:2015/Amd 1:2024, ISO 10005, ISO 10006, ISO 21502, ISO 31000, ISO 10075-2. Não adicione nem troque normas por conta própria; se o cliente pedir outro framework, pergunte antes de misturar.
- A Estrutura Harmonizada (Annex SL) só organiza evidência sob 7 cabeçalhos (Contexto, Liderança, Planejamento, Suporte, Operação, Avaliação de Desempenho, Melhoria) — **nunca é, por si só, um requisito**.
- Nenhuma conclusão normativa sem cláusula específica + evidência observável. Status permitidos: EVIDENCIADO, PARCIALMENTE EVIDENCIADO, NÃO EVIDENCIADO, NÃO AVALIADO, NÃO APLICÁVEL, EVIDÊNCIA CONFLITANTE. Nunca vire "não evidenciado" em "não conforme" sem base específica.
- Práticas operacionais próprias da empresa (ex.: distribuição de capacidade em %, WIP máximo de frentes simultâneas, "uma entrega dominante por dia") **nunca são apresentadas como exigência ISO** — são decisão de desenho operacional, rotuladas como tal.
- O documento sempre declara explicitamente que não é auditoria, certificação, opinião legal, aprovação regulatória nem declaração formal de conformidade.

---

## 4. Construção do plano (7 fases internas)

Execute internamente, sem expor cadeia de raciocínio bruta — apenas conclusões, racional de decisão, links de evidência e cálculos:

1. **Inventário de fontes** — liste tudo que está disponível (formulário, documentos de projeto do cliente, contexto pessoal aprovado, planilha legada se houver, normas).
2. **Normalização** — extraia objetivos, responsabilidades, prazos, métricas, restrições, dependências, stakeholders, riscos.
3. **Validação de evidência** — para cada item, localize a fonte, veja se é observável e atual, detecte contradições e lacunas.
4. **Modelo de capacidade do mês** — calcule capacidade realista (nunca 100% do nominal): capacidade nominal, indisponível, de execução planejada, reserva de contingência, com premissas explícitas. **A reserva de contingência é sempre 15% da capacidade de execução planejada** (padrão fixo da metodologia). Outro percentual só com pedido explícito do cliente, registrado como DECISION (DEC-XX). Declare o percentual na linha da tabela de capacidade.
5. **Priorização** — só com critérios evidenciados (prioridade explícita do cliente, prazo obrigatório, criticidade de dependência, risco irreversível, geração de evidência, esforço vs. capacidade). Nunca invente um framework de priorização proprietário além dos já fixos da empresa.
6. **Construção do plano** — converta em objetivos mensais, resultados mensuráveis, plano semanal, tarefas, responsáveis, dependências, métricas, gates, itens adiados.
7. **Cross-check final** — cada tarefa tem fonte; nenhuma restrição documentada foi descartada; sem duplicação; dependências antes de dependentes; carga cabe na capacidade; todo objetivo tem resultado mensurável; toda tarefa P0 tem dono+prazo+fonte+critério de conclusão; linguagem normativa é rastreável a cláusula; recomendação não vira requisito.

---

## 5. Pacote de 4 entregáveis (sempre gerar os 4 juntos)

Depois de concluído o processamento, gere **sempre estes 4 arquivos** em `/mnt/user-data/outputs/` e apresente-os juntos com `present_files`:

| # | Arquivo | Público | Formato | Especificação |
|---|---|---|---|---|
| 1 | `plano-interno-[cliente]-[periodo].md` | Uso interno da empresa | Markdown, schema completo de 17 seções + 2 apêndices | `references/schema-documento-interno.md` |
| 2 | `roadmap-[cliente]-[periodo].md` | Cliente final | Markdown tabular, linguagem prática, sem jargão de método | `references/schema-entregaveis-cliente.md` §A |
| 3 | `linear-import-[cliente]-[periodo].md` | Cliente final (para popular o Linear) | Markdown/CSV tabular, metas SMART, sem termos em inglês, verbos de ação | `references/schema-entregaveis-cliente.md` §B + `references/schema-csv-tarefas.md` (colunas 1-22) |
| 4 | `calendario-[cliente]-[periodo].html` | Cliente final | HTML uma página, paisagem, alta legibilidade, com Gantt/blocos de calendário | `references/schema-entregaveis-cliente.md` §C |

### Juiz validador (obrigatório entre o entregável #1 e os demais)

Depois de gerar o documento interno (#1) e **antes** de gerar #2, #3 e #4, rode o juiz determinístico:

```bash
python3 scripts/validar_plano.py /mnt/user-data/outputs/plano-interno-[cliente]-[periodo].md
```

- **PASS (exit 0)** → prossiga para os entregáveis do cliente.
- **FAIL (exit 1)** → corrija o documento interno conforme os erros listados e rode o juiz de novo. Nunca gere #2–#4 a partir de um documento que falhou no juiz.

O juiz checa estrutura, não conteúdo: 17 seções + 2 apêndices presentes; disclaimer legal; Registro Final de Honestidade; nenhum placeholder esquecido; todo conflito mencionado tem registro CONF-XX; capacidade alocada estritamente menor que a nominal; contingência em 15% (ou percentual alternativo coberto por DECISION registrada). A revisão de mérito do plano continua sendo sua responsabilidade — o juiz não substitui o cross-check da fase 7.

Regras gerais do pacote:

- Os 4 arquivos devem ser **consistentes entre si** — mesmas datas, mesmos nomes de tarefa, mesmos responsáveis. Gere o documento interno (#1) primeiro, pois ele é a fonte de verdade; os outros 3 derivam dele.
- Os entregáveis #2, #3 e #4 são para o **cliente final** — não incluem IDs internos (SRC-XX, CONF-XX etc.), jargão de classificação de evidência, nem disclaimers normativos longos. Linguagem direta, verbos de ação, sem anglicismos de metodologia (nada de "workstream", "sprint", "backlog" nos textos voltados ao cliente — use "frente de trabalho", "ciclo", "lista de tarefas").
- O entregável #1 é o único que carrega todo o aparato de rastreabilidade (fontes, conflitos, gaps, apêndices).
- Sempre use **verbos de ação** no início de cada tarefa e datas em formato DD/MM/AAAA.
- Nunca invente stakeholder, data, baseline, hora ou métrica sem rastro de fonte — se ausente, registre como lacuna (GAP) no documento #1 e reflita isso como "a definir" nos entregáveis do cliente, nunca com um valor inventado.

---

## 6. Idioma e tom

- Toda saída é em **português do Brasil**, mesmo que o intake tenha vindo em inglês ou misto.
- Documento interno (#1): tom técnico, direto, tabelas densas.
- Entregáveis do cliente (#2, #3, #4): tom claro e prático, sem jargão técnico de gestão de projetos, adequado para quem não é da área.

## 7. Documentação viva — carregar conforme a fase

Não carregue tudo de uma vez. Use progressive disclosure: leia cada referência no momento em que a fase correspondente começar.

**Carregar sempre, no início de qualquer novo cliente/mês (Fase 0 e §2-3):**
- `references/motor-evidencia-fontes.md` — classificação de evidência, IDs, hierarquia de fontes, registro de conflitos, 7 fases
- `references/normas-fixas-iso.md` — conjunto normativo fixo, regras da Estrutura Harmonizada, exemplo de registro de lacuna normativa
- `references/fontes-vivas-e-protocolos.md` — links oficiais para checar atualização das normas e do próprio protocolo da empresa (usar durante a §0)

**Carregar durante o intake (§1):**
- `references/formulario-e-intake.md` — schema completo do JSON de intake e detalhes de cada campo
- `assets/formulario-intake.html` — template do artefato de formulário interativo (copiar e adaptar, não reescrever do zero)

**Carregar ao montar o documento interno (§5, entregável #1):**
- `references/schema-documento-interno.md` — estrutura seção a seção (17 seções + 2 apêndices)
- `references/schema-csv-tarefas.md` — schema canônico de 25 colunas do Registro Executável de Tarefas (§10); também rege o CSV do entregável #3 (com subconjunto de colunas)

**Carregar ao montar os entregáveis do cliente (§5, entregáveis #2, #3, #4):**
- `references/schema-entregaveis-cliente.md` — especificação do roadmap, do schema Linear e do calendário one-page
- `references/schema-csv-tarefas.md` — usar a seção "Uso por entregável" para saber quais das 25 colunas expor no CSV do entregável #3 (colunas 1-22 apenas; nunca `fonte_id`)

**Executar (não é preciso ler) entre o entregável #1 e os #2–#4:**
- `scripts/validar_plano.py` — juiz determinístico do documento interno (ver §5). Rode via bash; só leia o código se precisar entender um erro reportado.

Se estiver apenas ajustando um documento já gerado (ex.: "muda o prazo da tarefa X"), não é necessário recarregar todas as referências — releia só a que rege a seção alterada.
