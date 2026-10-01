---
type: llm
weight: 1
---

A resposta está em português do Brasil e trata o pedido como CV-CAP-001 (/capacidade), usando a skill interna `executar-cop:capacity-plan`. Antes do plano, ela faz um pré-voo de dependências: identifica as entregas e as dependências que consomem a capacidade e o que falta para calcular. Como o pedido não traz pessoas, horas nem demanda, a resposta pede o mínimo necessário ou declara as lacunas. Reprovar se inventar números de capacidade (pessoas, horas ou percentuais) sem fonte, ou se disser que precisa instalar um plugin externo.
