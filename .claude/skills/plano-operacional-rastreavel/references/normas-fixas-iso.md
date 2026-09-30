# Limite Normativo — Conjunto ISO Fixo da Empresa

Este conjunto normativo é **fixo para todos os clientes** desta metodologia. Não trocar, não adicionar norma por conta própria — se um cliente pedir outro framework normativo (ex.: LGPD, SOC2, ISO 27001), tratar como pedido separado e perguntar antes de misturar ao pacote padrão.

## Conjunto normativo padrão

| Norma | Papel |
|---|---|
| ISO 9001:2015 / Amd 1:2024 | Requisitos de sistema de gestão da qualidade — única fonte de **requisito** propriamente dito no conjunto |
| ISO 10005 | Orientação sobre planos da qualidade |
| ISO 10006 | Orientação sobre qualidade em gestão de projetos |
| ISO 21502 | Orientação sobre gestão de projetos |
| ISO 31000 | Orientação sobre gestão de riscos |
| ISO 10075-2 | Orientação sobre desenho do trabalho mental / carga cognitiva |

**Distinção crítica:** apenas a ISO 9001 contém requisitos de sistema de gestão. As demais (10005, 10006, 21502, 31000, 10075-2) oferecem **orientações**, não requisitos obrigatórios. Nunca escrever "a norma X exige" para essas cinco — escrever "a norma X orienta" ou "com base na orientação de X".

## O que NÃO é requisito ISO (mas é decisão operacional própria da empresa)

Elementos como: um único indicador mensal obrigatório, ondas de execução (ex. "1 meta / N gates / 1 entrega diária"), distribuição percentual fixa de capacidade (ex. 60/20/20), ocupação máxima de X%, número fixo de entregas semanais, planos "se-então", limite de frentes simultâneas (WIP), uma entrega dominante por dia — **nenhum desses é exigido literalmente por nenhuma das normas do conjunto**. São decisões de desenho operacional da metodologia da empresa, usadas para *implementar* objetivos, capacidade e controle exigidos em termos gerais pela ISO 9001. Sempre rotular como "decisão de desenho operacional próprio" ou "framework operacional próprio, informado por [norma]" — nunca como requisito normativo.

## Estrutura Harmonizada (Annex SL) — regra de uso

A Estrutura Harmonizada organiza evidência sob 7 cabeçalhos:

1. Contexto
2. Liderança
3. Planejamento
4. Suporte
5. Operação
6. Avaliação de Desempenho
7. Melhoria

Ela é **apenas uma estrutura de organização** comum a normas de sistema de gestão. Nunca tratar a Estrutura Harmonizada, isoladamente, como: conjunto autônomo de requisitos aplicáveis; prova de conformidade; método de gestão de projetos; framework operacional; substituto das cláusulas de uma norma específica. Todo requisito colocado sob um cabeçalho da Estrutura Harmonizada precisa continuar rastreável a uma norma específica, cláusula e/ou requisito documentado do projeto.

## Classificação de status normativo

Usar sempre um destes status — nunca inventar outro:

- EVIDENCIADO
- PARCIALMENTE EVIDENCIADO
- NÃO EVIDENCIADO
- NÃO AVALIADO
- NÃO APLICÁVEL
- EVIDÊNCIA CONFLITANTE

Nunca converter "não evidenciado" em "não conforme" a menos que a evidência disponível e a cláusula normativa aplicável sustentem especificamente essa conclusão.

## O documento nunca é

Auditoria, certificação, opinião legal, aprovação regulatória, declaração formal de conformidade normativa, nem assurance engagement. Essa frase (ou equivalente) deve aparecer explicitamente no início do documento interno (#1 do pacote).

## Exemplo de registro correto de lacuna normativa (padrão a seguir)

Quando faltar, por exemplo, um indicador mensal mensurável, **não registre** como "falta de indicador único mensal" (isso soa como se a norma exigisse exatamente um indicador — nenhuma norma do conjunto exige isso). Registre assim:

> **ID:** GAP-6.2-01
> **Estrutura transversal:** 6 — Planejamento
> **Subcláusula primária:** ISO 9001:2015/Amd 1:2024 — 6.2 (Objetivos da qualidade e planejamento para alcançá-los)
> **Subcláusula complementar:** ISO 9001:2015/Amd 1:2024 — 9.1 (Monitoramento, medição, análise e avaliação)
> **Lacuna:** Não foi localizado objetivo mensal mensurável, método de acompanhamento, responsável, frequência de avaliação ou critério de resultado.
> **Evidência localizada:** Intenção mensal declarada, sem indicador e método de avaliação formalizados.
> **Status:** NÃO EVIDENCIADO / NÃO VERIFICÁVEL, conforme evidência disponível.
> **Ação:** Definir objetivo mensurável, forma de medição, responsável, prazo e método de avaliação.

Nota epistemológica: o indicador pode ser quantitativo ou qualitativo, desde que mensurável e verificável — "N gates concluídos" é só uma possibilidade operacional entre várias, nunca uma exigência ISO.

Use esse mesmo padrão (ID de GAP ancorado em cabeçalho + cláusula primária + cláusula complementar + lacuna + evidência localizada + status + ação) para qualquer outra lacuna normativa que aparecer no processamento de um novo cliente.
