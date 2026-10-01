# Sistema editorial e visual

## Direção

Aplicar esta direção consolidada:

> Minimalismo editorial-industrial, influência suíça, interface utilitária, quase bidimensional, alta densidade organizada.

Usar linhas finas, tipografia técnica, módulos claros, poucos efeitos, proporções controladas e contraste alto. Evitar brutalismo, excesso de arredondamento, sombras, ornamento, emoji decorativo e cor sem função.

## Cores — token do calendário (paleta suíça)

Fonte única: `../../../assets/design-tokens/calendario-light-mode.md` (plugin `executar-cop`, ADR-0003). A paleta DESK-OS anterior (laranja `#ff5a00`) foi substituída por este token.

| Token | Valor | Uso |
|---|---|---|
| Fundo | `#f2f2ef` | Fundo principal |
| Superfície | `#ffffff` | Cartões e painéis |
| Superfície 2 | `#f7f7f5` | Blocos técnicos, item selecionado |
| Tinta | `#111111` | Texto principal |
| Tinta 2 | `#5a5a5a` | Texto secundário forte |
| Tinta 3 | `#8c8c8c` | Rótulos, metadados, concluído |
| Linha | `#e4e4e1` / `#ddddda` | Divisores de 1px |
| Linha forte | `#cfcfcc` | Divisão estrutural |
| Vermelho | `#e31919` | Hoje, prioridade alta, item atual |
| Vermelho claro | `#fdeaea` | Fundo do item atual |

Restringir o vermelho a hoje, prioridade alta, tarefa atual e ação principal. O bloqueio aparece por ícone e título, não por cor. Não colorir títulos por decoração, e nunca usar verde, azul, amarelo ou laranja.

## Densidade e leitura

- Usar baixa densidade em notas de execução e média densidade em mapas.
- Garantir leitura mobile sem rolagem horizontal sempre que possível.
- Usar espaços em branco, blocos curtos, uma ideia principal por seção e separadores somente entre blocos principais.
- Manter fonte legível e linhas de texto com largura controlada.
- Preservar impressão legível e uso offline em papel.

## YAML

Usar somente propriedades reais. Exemplo mínimo:

```yaml
---
id: DOC-001
tipo: "Documento"
versao: "1.0.0"
data: 2026-07-18
status: "Rascunho"
cssclasses:
  - obsidian-editorial
tags:
  - obsidian
---
```

Omitir campos desconhecidos. Não ultrapassar dez propriedades sem motivo explícito. Manter `id` estável e datas em `YYYY-MM-DD`.

Para uma saída nova, `tipo` derivado do perfil e `status: "Rascunho"` são estados determinísticos. Em novas unidades de trilha ou semana, `status: "nao-iniciada"` e `wip: 1` são defaults do perfil. `modo_preservacao` e `cssclasses` também podem ser derivados dos comandos. Não gerar `id`, responsável, versão, data, projeto ou tags sem valor fornecido ou regra explícita do pedido.

## Hierarquia

- Usar um H1 por nota.
- Não pular níveis sem necessidade.
- Evitar `#`, `|`, `^`, barras e excesso de dois-pontos em títulos usados por wikilinks.
- Criar títulos curtos, específicos e orientados à utilidade.
- Preferir o painel Outline em notas curtas; criar índice adaptativo em documentos longos.

## Callouts oficiais

Usar apenas:

| Tipo | Uso |
|---|---|
| `abstract` | resumo ou conceito central |
| `info` | metadado, navegação ou apoio |
| `todo` | única próxima ação |
| `tip` | orientação prática |
| `success` | decisão ou resultado validado |
| `question` | questão ou lacuna |
| `warning` | restrição ou risco |
| `failure` | critério não atendido |
| `danger` | proibição ou risco crítico |
| `bug` | defeito |
| `example` | exemplo ou evidência apresentada |
| `quote` | citação, JTBD ou história de usuário |
| `note` | observação geral |

Não transformar todos os parágrafos em callouts. Não criar tipos personalizados sem CSS confirmado.

## Linguagem

Escrever em português brasileiro e linguagem simples, exceto quando o usuário pedir outro idioma ou a preservação estrita impedir edição.

Na primeira ocorrência, explicar siglas e preferir equivalentes claros no texto visível. Preservar nomes oficiais, comandos, propriedades, arquivos e código quando a tradução quebrar compatibilidade.

## Rastreabilidade

Usar IDs estáveis quando úteis: `FONTE-001`, `EVID-001`, `REQ-001`, `DEC-001`, `HIP-001`, `CONTRA-001`, `RISCO-001`, `LACUNA-001`, `TAREFA-001`.

Relacionar fonte, requisito, decisão, tarefa e evidência sem inventar bibliografia.
