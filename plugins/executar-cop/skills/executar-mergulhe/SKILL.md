---
name: executar-mergulhe
description: "Organiza conteúdo, projetos, operações e documentação em uma hierarquia navegável da família Executar, combinando árvore visual, mergulho progressivo, Obsidian, relações entre nós, dependências, portas e evidências. Use quando o usuário pedir para estruturar em ramos, pastas, mergulho, nós, fila única, cadeia de dependências, mapa hierárquico, Obsidian ou uma visualização compatível com Executar · Árvore Visual. Acionada também pelo ID verbal CV-VISUAL-001 (/arvore-visual) do plugin executar-cop."
---

# Executar · Mergulhe

Transformar complexidade em navegação progressiva.

A habilidade produz uma estrutura que pode existir simultaneamente como:

- árvore visual;
- diretório de arquivos;
- cofre Obsidian;
- estrutura de projeto;
- mapa de dependências;
- fonte para o componente **Executar · Árvore Visual**.

## Integração executar-cop
- **ID verbal:** CV-VISUAL-001 (`/arvore-visual`). Nó `ARVORE-VISUAL` em `../../references/grafo-dependencias.json`.
- **Pré-voo de dependências:** aplicar `../../references/nucleo-dependencias.md`.
  - No fluxo PEM-PIPELINE-PROPRIETARIO, depende do `estrutura.json` validado de `executar-arvore-roadmap` (DEP-COP-002, bloqueante). Fora dele, parte do material fornecido.
  - A regra "posição na árvore não significa dependência", já presente aqui, é a mesma do núcleo §2.8.
  - `dependeDe` e `desbloqueia` inferidos, sem estarem na fonte, recebem tag `DERIVED` ou `PROPOSED` na entrega.
- **Token visual obrigatório:** `../../assets/design-tokens/calendario-light-mode.md`. O componente de referência `assets/arvore-visual-v1.0/index.html` já usa o token. O vermelho fica só para o nó atual, e os estados levam rótulo além da cor.
- **Saída:** a visualização (JSON, HTML ou vault). Ela desbloqueia `EDITORIAL-OBSIDIAN` (CV-EDITORIAL-001) no fluxo proprietário.
- **Busca web:** obrigatória quando a estrutura depender de fato externo, como datas de plataforma, regras de terceiros ou referências. Cite a fonte.
- Toda resposta sai em português do Brasil.

## Princípio

```text
TODO
└── RAMO
    └── SUBRAMO
        └── NÓ
            └── AÇÃO / EVIDÊNCIA
```

O usuário começa no todo e aprofunda somente quando precisa.

## Como operar

1. Ler integralmente o material fornecido.
2. Identificar o objeto raiz.
3. Identificar ramos naturais por tempo, área, entrega, processo ou função.
4. Separar hierarquia visual de dependência operacional.
5. Dar IDs estáveis aos nós que precisem ser relacionados.
6. Marcar estados quando estiverem suportados pela fonte ou pelo pedido.
7. Marcar portas quando um nó controlar liberação de outros nós.
8. Criar ligações internas somente para arquivos ou nós existentes.
9. Criar uma entrada principal que conduza ao estado atual.
10. Entregar a menor estrutura suficiente para navegar sem perder contexto.

## Estrutura de nó

Um nó pode ter:

```text
ID
Título
Tipo
Estado
Pai
Filhos
Depende de
Desbloqueia
Destino
Evidência
Nota curta
```

Nem todos os campos são obrigatórios.

Não inventar campos ausentes quando não forem necessários.

## Tipos canônicos

- `pasta`: contém outros nós;
- `arquivo`: nó final de conteúdo ou ação;
- `porta`: controla transição;
- `evidencia`: comprova resultado;
- `referencia`: fonte de apoio;
- `destino`: página, rota, produto ou saída.

## Estados canônicos

- `atual`;
- `liberado`;
- `dependencia`;
- `futuro`;
- `bloqueado-interno`;
- `bloqueado-externo`;
- `concluido`.

Só usar estado quando houver base para declará-lo.

## Regra de confiabilidade

**Posição na árvore não significa dependência.**

A árvore responde:

> Onde este objeto está na navegação?

A dependência responde:

> O que precisa acontecer antes deste objeto poder avançar?

Registrar dependências separadamente.

## Modo Obsidian

Quando a saída for Obsidian:

- usar Markdown nativo;
- usar `[[wikilinks]]` somente para notas existentes;
- manter um `# H1` por nota;
- usar YAML apenas para metadados úteis;
- preservar IDs estáveis;
- permitir hierarquia de pastas quando ela melhorar o mergulho;
- permitir propriedades `depende_de` e `desbloqueia` para relações cruzadas;
- criar uma nota de entrada;
- validar ligações antes da entrega;
- gerar ZIP quando houver vários arquivos.

## Modo Árvore Visual

Quando a saída alimentar **Executar · Árvore Visual**:

produzir JSON compatível com:

```json
{
  "id": "NO-001",
  "titulo": "Exemplo",
  "tipo": "pasta",
  "estado": "liberado",
  "filhos": []
}
```

Quando existirem dependências cruzadas, acrescentar:

```json
{
  "dependeDe": ["NO-000"],
  "desbloqueia": ["NO-002"]
}
```

## Modo fila temporal

Quando o projeto precisar ser executado em sequência:

```text
DIA / ESTADO ATUAL
    ↓
ENTREGAS DO DIA
    ↓
PORTA DE FECHAMENTO
    ↓
PRÓXIMO DIA / ESTADO
```

O dia pode conter vários ramos. A navegação principal continua linear.

## Linguagem

Usar português claro, curto e orientado por verbo ou objeto.

Preferir:

- `Reunir rotas`
- `Validar formulário`
- `Publicar e agendar`

Evitar jargão desnecessário.

Manter nomes técnicos apenas quando forem identificadores reais do sistema.

## Preservação

Não inventar:

- fatos;
- fontes;
- conclusões;
- estados;
- datas;
- URLs;
- arquivos;
- evidências;
- dependências.

Quando algo necessário não estiver definido, marcar como lacuna ou deixar de fora.

## Entrega

Para visualização simples:

- árvore em texto;
- JSON;
- HTML interativo.

Para pacote reutilizável:

- diretório;
- `README.md`;
- exemplo;
- modelo;
- documentação técnica;
- ZIP.

Para Obsidian:

- diretório navegável;
- nota inicial;
- notas interligadas;
- ligações validadas;
- ZIP.

## Qualidade mínima

Antes de entregar, verificar:

1. IDs duplicados = zero.
2. Dependências quebradas = zero.
3. Ligações internas quebradas = zero.
4. Portas sem condição = revisar.
5. Nós sem função = remover.
6. Estado atual é encontrável em poucos passos.
7. A árvore continua compreensível quando ramos estão fechados.
8. O usuário consegue chegar ao próximo nível sem voltar ao início.

Consultar também `references/` para regras detalhadas.
