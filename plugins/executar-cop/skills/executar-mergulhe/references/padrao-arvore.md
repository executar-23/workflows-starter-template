# Padrão de árvore

## Estrutura

```text
RAIZ
├── RAMO A
│   ├── NÓ A1
│   └── NÓ A2
└── RAMO B
    └── NÓ B1
```

## Regras

- cada nó tem um único pai visual;
- um nó pode ter múltiplas dependências operacionais;
- estado não é inferido pela posição;
- filhos devem ser apresentados na ordem útil para navegação;
- ramos longos devem começar fechados, salvo o caminho atual;
- o caminho atual pode começar aberto.
