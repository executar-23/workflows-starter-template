# Schema canônico — estrutura.json

Todo modo desta skill parte do MESMO objeto JSON intermediário. Você (Claude) é quem produz esse
JSON a partir do documento de entrada (ou da descrição do projeto, via raciocínio). Os scripts
apenas validam e renderizam — eles nunca inventam conteúdo, então a qualidade da extração é sua
responsabilidade antes de rodar qualquer script.

```json
{
  "meta": {
    "titulo": "EXECUTAR_LANCAMENTO_31-08-2026",
    "objetivo": "lançar o ecossistema em 31-08-2026",
    "inicio": "2026-08-07",
    "fim": "2026-08-31",
    "total_peso": 100.0,
    "unidades_executaveis": 128,
    "dias_operacionais": 21
  },
  "fluxos_de_valor": [
    {"id": "VS-00", "nome": "CONTROLE", "peso": 10.0}
  ],
  "portas": [
    {
      "id": "G-CONTROLE",
      "itens": ["formulario_M0-M4_instalado_e_testado", "..."],
      "libera": "G-DECISOES"
    }
  ],
  "calendario": [
    {
      "data": "2026-08-07",
      "label": "07_SEXTA",
      "objetos": 3,
      "peso_dia": 1.152,
      "ciclos": {
        "M0": {"tarefas": []},
        "M1": {"tarefas": []},
        "M2": {"tarefas": []},
        "M3": {
          "tarefas": [
            {
              "id": "PLN-001",
              "titulo": "Instalar e validar formulário diário M0–M4",
              "peso": 0.384,
              "depende_de": [],
              "porta": "G-CONTROLE",
              "status": "aberta",
              "evidencia": null
            }
          ]
        },
        "M4": {"tarefas": []},
        "18H": {"tarefas": []}
      }
    }
  ]
}
```

## Regras de extração

- **IDs de tarefa são estáveis e únicos** — nunca reutilize um ID para duas tarefas diferentes.
  Se o documento de origem já usa um esquema de prefixos (PLN-, EXE-, DER-, ou outro), preserve-o.
  Se não usa nenhum, invente um prefixo curto e sequencial (ex.: TSK-001, TSK-002).
- **`depende_de`** é uma lista de IDs de outras tarefas. Todo ID citado aqui deve existir em
  alguma tarefa do calendário — senão o validador reporta como link quebrado.
- **`porta`** referencia o `id` de um item em `portas`. Se a tarefa não contribui para nenhuma
  porta, deixe `null` em vez de inventar uma porta genérica.
- **`status`**: use um destes quatro valores — `aberta` (○), `concluida` (✓), `bloqueada` (!),
  `marco` (◆). Isso controla o símbolo usado na renderização em árvore.
- **`peso`** é sempre um número (não string), na mesma unidade usada por `meta.total_peso`
  (tipicamente pontos percentuais). A soma de todos os pesos de tarefa deve bater com
  `meta.total_peso` dentro de uma tolerância pequena — o validador avisa se não bater, mas isso
  não bloqueia a geração; alguns planos têm itens de peso zero (marcos, portas administrativas).
- **`ciclos`** sempre usa as chaves M0, M1, M2, M3, M4, 18H — mesmo que vazias (`{"tarefas": []}`).
  Isso mantém os cinco tipos de energia/processo (abertura, autoral, operação/produto,
  administração, fechamento) consistentes em todo dia, mesmo quando um dia não usa todos.
- Dias sem execução (domingos "livres", por exemplo) ainda entram no `calendario` com
  `objetos: 0` e todos os ciclos vazios — isso preserva a navegação contínua dia a dia.

## Quando o documento de entrada é uma planilha ou está em outro formato

Leia o arquivo (xlsx/csv/docx/pdf/texto solto) e mapeie colunas/campos para o schema acima antes
de gerar `estrutura.json`. Datas, pesos e dependências quase sempre existem em algum formato no
documento de origem — procure por eles antes de perguntar ao usuário. Só pergunte se um campo
essencial (datas de início/fim, ou a lista de tarefas) estiver genuinamente ausente.

## Quando a entrada é só uma descrição do projeto (sem plano pronto)

Gere você mesmo uma proposta razoável de `estrutura.json`: distribua o objetivo em fluxos de
valor, quebre os fluxos em tarefas com pesos que somem 100%, distribua as tarefas nos dias úteis
entre início e fim, e defina de 3 a 8 portas sequenciais que façam sentido para o tipo de projeto.
Deixe claro para o usuário que essa é uma primeira proposta gerada por você, não extraída de um
documento — e convide-o a corrigir antes de gerar os entregáveis finais.
