# Portas e dependências

## Dependência

Condição que precisa estar satisfeita antes de um nó poder avançar.

## Porta

Nó explícito que avalia ou representa essa condição e libera outro estado.

```text
A
├── B
└── C
    ↓
PORTA
    ↓
D
```

## Bloqueios

Distinguir:

- `bloqueado-interno`: depende de trabalho ainda não concluído no próprio sistema;
- `bloqueado-externo`: depende de terceiro, aprovação ou plataforma externa.

Bloqueio externo não deve ser tratado como falha do restante da cadeia quando os outros ramos puderem continuar.
