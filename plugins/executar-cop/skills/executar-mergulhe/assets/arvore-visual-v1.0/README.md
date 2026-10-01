# EXECUTAR · Árvore Visual v1.0

Padrão proprietário de visualização hierárquica da família **Executar**.

A Árvore Visual apresenta planos, projetos, rotas, áreas, dependências e entregas como uma estrutura de pastas que pode ser aberta e fechada progressivamente. O usuário vê o todo sem precisar receber toda a complexidade ao mesmo tempo.

## Objetivo

Transformar uma estrutura complexa em uma navegação simples:

**visão geral → ramo → subramo → nó → ação / evidência**

O padrão pode ser usado em:

- aplicativo Executar;
- projetos e cronogramas;
- lançamentos;
- biblioteca editorial;
- serviços do Executar Studio;
- produtos e infoprodutos;
- mapas de dependência;
- Obsidian;
- documentação técnica;
- demonstrações comerciais.

## Comece aqui

Abra `index.html` em um navegador.

O exemplo incluído representa o lançamento de 07/09 como fila temporal e ramos auxiliares.

## Estrutura do pacote

```text
EXECUTAR-ARVORE-VISUAL-v1.0/
├── index.html
├── README.md
├── docs/
│   ├── 01-PADRAO-VISUAL.md
│   ├── 02-HANDOFF-TECNICO.md
│   ├── 03-MODELO-DE-DADOS.md
│   └── 04-INTEGRACAO-OBSIDIAN.md
├── exemplos/
│   └── arvore-lancamento-0709.json
├── modelos/
│   ├── modelo-arvore.json
│   └── modelo-nota-obsidian.md
└── skill/
    └── executar-mergulhe/
        ├── SKILL.md
        ├── README.md
        ├── references/
        │   ├── padrao-arvore.md
        │   ├── integracao-obsidian.md
        │   └── portas-e-dependencias.md
        └── assets/templates/
            └── nota-mergulhe.md
```

## Nome do padrão

**Executar · Árvore Visual** = componente visual.

**Executar · Mergulhe** = habilidade que transforma conteúdo, projetos e arquivos em uma estrutura navegável compatível com Árvore Visual e Obsidian.

## Princípio central

A árvore pode ser complexa. A interação não.

O usuário deve conseguir:

1. reconhecer onde está;
2. abrir um ramo;
3. entender o que depende do quê;
4. chegar à ação ou evidência;
5. voltar ao nível superior sem perder contexto.
