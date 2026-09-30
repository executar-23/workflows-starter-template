# Fontes Vivas e Protocolos — Onde Verificar Atualização

Este arquivo existe para uma única razão: normas mudam de edição/emenda com o tempo, e esta skill não deve carregar cegamente o que estava fixo no dia em que foi escrita. Antes de aplicar o conjunto normativo fixo a um novo cliente (ver `SKILL.md` §0), confirme aqui onde checar.

## Como verificar (sem violar direitos autorais)

Os textos completos das normas ISO são pagos e protegidos por direitos autorais — **nunca** tente reproduzir cláusulas inteiras a partir da web. O que é possível e suficiente verificar são os **metadados públicos de catálogo**: número de edição vigente, ano, se há emenda publicada, e a data dessa emenda. Isso normalmente está na própria página de catálogo do organismo de normalização.

## Onde checar cada norma do conjunto fixo

| Norma | O que procurar | Como buscar |
|---|---|---|
| ISO 9001 | Edição vigente e emendas publicadas | `web_search`: "ISO 9001:2015 amendment status site:iso.org" (ou termo equivalente) |
| ISO 10005 | Edição vigente | `web_search`: "ISO 10005 quality management plans current edition" |
| ISO 10006 | Edição vigente | `web_search`: "ISO 10006 project management quality current edition" |
| ISO 21502 | Edição vigente | `web_search`: "ISO 21502 project management guidance current edition" |
| ISO 31000 | Edição vigente | `web_search`: "ISO 31000 risk management current edition" |
| ISO 10075-2 | Edição vigente | `web_search`: "ISO 10075-2 mental workload current edition" |

Depois do `web_search`, use `web_fetch` na página de catálogo oficial (normalmente `iso.org/standard/...`) encontrada nos resultados para confirmar o metadado — não confie só no snippet de busca.

## Protocolo interno da empresa (se aplicável)

Se a metodologia mestre (a que gerou esta skill) for mantida como documento vivo em algum lugar — por exemplo um workspace de Notion, uma pasta de Google Drive, ou outro repositório interno — e houver um conector MCP disponível para essa fonte nesta sessão, busque lá a versão mais recente do protocolo antes de assumir que o texto fixo em `references/normas-fixas-iso.md` e `references/motor-evidencia-fontes.md` ainda é o vigente. Se encontrar divergência:

- registre como CONFLICT (fonte viva vs. texto fixo da skill);
- priorize a fonte viva, seguindo a hierarquia de fontes normal (protocolo/instrução explícita > registros recentes > texto fixo da skill, que é só a última versão capturada);
- avise o usuário, ao final da resposta, que os arquivos de referência desta skill parecem estar desatualizados e deveriam ser regerados (`skill-creator` pode ajudar nisso).

## Frequência de checagem

Uma vez por sessão de trabalho é suficiente (ou quando o usuário mencionar explicitamente uma norma nova ou uma mudança regulatória). Não repetir a cada tarefa pequena dentro do mesmo atendimento — isso desperdiça buscas sem ganho de precisão.

## Quando não há acesso à internet

Prossiga com o conjunto fixo documentado em `references/normas-fixas-iso.md`, e registre essa limitação explicitamente no documento interno (seção 2 — Inventário de Fontes, subseção "Fontes não consultadas"). Isso não bloqueia a entrega do plano.
