# 02 · Handoff técnico

## Objetivo de implementação

Incorporar **Executar · Árvore Visual** como componente reutilizável no aplicativo, mantendo dados e apresentação separados.

## Arquitetura recomendada

```text
DADOS
│
├── nós
├── relações pai-filho
├── dependências
├── estados
├── portas
└── destino / evidência
        ↓
NORMALIZAÇÃO
        ↓
ÁRVORE DE VISUALIZAÇÃO
        ↓
COMPONENTE RECURSIVO
        ↓
INTERAÇÃO
├── abrir / fechar
├── ir para atual
├── abrir por ligação
└── destacar bloqueios
```

## Contrato mínimo do nó

```ts
export type EstadoArvore =
  | 'atual'
  | 'liberado'
  | 'dependencia'
  | 'futuro'
  | 'concluido'
  | 'bloqueado';

export type TipoNo =
  | 'pasta'
  | 'arquivo'
  | 'porta'
  | 'evidencia';

export interface NoArvore {
  id: string;
  titulo: string;
  tipo: TipoNo;
  estado?: EstadoArvore;
  nota?: string;
  aberto?: boolean;
  filhos?: NoArvore[];
  dependeDe?: string[];
  desbloqueia?: string[];
  destino?: string;
  evidencia?: string[];
}
```

## Regra importante

**A hierarquia visual e o grafo de dependências não são a mesma coisa.**

Um nó pode estar dentro de um ramo por organização visual e depender de outro nó localizado em outro ramo.

Portanto:

```text
ÁRVORE = organização e navegação
GRAFO = restrições e relações operacionais
```

Nunca inferir dependência somente pela posição na árvore.

## Componente recomendado

Para o aplicativo web:

```text
ArvoreVisual
├── BarraDeFerramentas
├── LegendaDeEstados
└── NoArvore [recursivo]
    ├── BotaoAbrirFechar
    ├── IconeTipo
    ├── Titulo
    ├── EtiquetaEstado
    ├── NotaCurta
    └── Filhos
```

## Estado local

Abertura e fechamento podem ser estado local da interface.

O estado operacional do nó deve vir da fonte de dados.

Não misturar:

```text
aberto_na_interface = true/false
```

com:

```text
estado_operacional = liberado/bloqueado/concluido
```

## Ligação direta

O HTML de referência aceita:

```text
index.html#node=d25
```

No aplicativo, usar rota ou parâmetro equivalente:

```text
/arvore?no=d25
```

ou

```text
/projeto/PRJ-001/arvore#TSK-042
```

## Regras de confiabilidade

1. IDs são estáveis.
2. Um ID não pode existir duas vezes.
3. `dependeDe` deve apontar apenas para IDs existentes.
4. `desbloqueia` deve apontar apenas para IDs existentes.
5. Portas devem declarar condição de liberação.
6. Estado concluído deve aceitar evidência quando o domínio exigir.
7. Um nó bloqueado não pode ser exibido como executável.
8. Abrir e fechar ramos nunca altera o estado operacional.

## Adaptação para o motor do Executar

O padrão combina naturalmente com o motor existente:

```text
PLANO / GRAFO
    ↓
NÓS E DEPENDÊNCIAS
    ↓
ESTADO E RESTRIÇÕES
    ↓
FILA ELEGÍVEL
    ↓
PRÓXIMA AÇÃO
```

A Árvore Visual serve como **visão do todo**. A tela de execução pode continuar mostrando apenas **o próximo passo**.

## Testes mínimos

- abrir ramo;
- fechar ramo;
- abrir todos;
- fechar todos;
- abrir ligação direta;
- navegar por teclado;
- renderizar 1, 10, 100 e 1.000 nós;
- detectar IDs duplicados;
- detectar dependências quebradas;
- manter estado ao atualizar a árvore;
- validar comportamento em celular e tablet.
