---
type: llm
weight: 1
---

A resposta está em português do Brasil e trata o pedido como o comando de rotina CV-BOMDIA-001 (/bomdia), sem pedir ao usuário que diga o módulo. Ela aplica um pré-voo de dependências: verifica fonte, estado ou continuidade antes de listar trabalho liberado. Se a skill `copiloto-executar` ou a fonte canônica do estado não estiverem disponíveis, declara `bloqueado-externo` (ou equivalente) e NÃO inventa tarefas, estado ou progresso. Reprovar se a resposta fabricar uma lista de tarefas do dia sem fonte.
