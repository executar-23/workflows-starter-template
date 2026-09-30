# Formulário e Schema de Intake

Este arquivo define o schema JSON que o artefato `assets/formulario-intake.html` deve produzir, e que Claude deve conseguir reconstruir a partir de texto livre caso o cliente não use o artefato.

## Schema JSON completo

```json
{
  "identificacao": {
    "titular": "",
    "projeto_ou_sistema": "",
    "consultor_validacao": "",
    "usuarios_teste": [],
    "periodo_inicio": "DD/MM/AAAA",
    "periodo_fim": "DD/MM/AAAA",
    "data_emissao": "DD/MM/AAAA",
    "fuso_horario": "America/Sao_Paulo"
  },
  "declaracao_fonte": {
    "autor": "",
    "metodo": "",
    "limite_epistemologico": ""
  },
  "perfil_e_proposito": {
    "objetivo_negocio_ou_projeto": "",
    "linha_de_producao_priorizada": ""
  },
  "recursos_e_restricoes": {
    "capacidade_semanal_horas": null,
    "melhor_janela_energia": "",
    "dias_descanso": [],
    "dias_revisao_leve": [],
    "preferencia_processo": "",
    "restricoes_declaradas": [],
    "sistema_atual_organizacao": ""
  },
  "diagnostico": "",
  "frentes_do_mes": [
    { "nome": "", "objetivo": "" }
  ],
  "estrategia": {
    "meta_mensal_unica": "",
    "gates_semanais": [],
    "entrega_diaria": "",
    "distribuicao_percentual": {
      "resultado_principal": null,
      "operacao": null,
      "contingencia": null
    }
  },
  "riscos_e_respostas": [
    { "risco": "", "resposta": "" }
  ],
  "indicacao_final_cadeia_de_valor": "",
  "tbd_obrigatorio": []
}
```

## Notas de preenchimento

- `padrao_transversal_de_qualidade` **não** entra no JSON do cliente — é fixo da metodologia (contexto → requisito → responsável → capacidade → risco → critério de aceite → evidência → revisão) e deve ser aplicado por Claude, não coletado.
- `tbd_obrigatorio` deve ficar vazio ou parcial se o cliente não souber — nunca inferir esses valores no lugar do cliente nesta etapa. Eles viram GAP-XX no documento interno.
- Se o cliente não tiver "consultor de validação" ou "usuários-teste" (nem todo projeto tem validação externa formal), deixe os campos vazios — isso não é obrigatório, é específico do caso de origem (DESK-OS).
- `frentes_do_mes` e `riscos_e_respostas` são listas de tamanho livre — não force um número fixo (o caso de origem tinha 4 frentes, mas isso não é regra).
- Datas sempre em DD/MM/AAAA na saída final, independente do formato de entrada.

## Extração a partir de texto livre

Se o usuário colar texto solto (e-mail, mensagem, form respondido em prosa) em vez do JSON:

1. Primeiro, tente mapear frase por frase para os campos acima.
2. Para qualquer campo não coberto, deixe null/vazio — não adivinhe.
3. Confirme com o usuário apenas os campos que forem ambíguos o suficiente para mudar uma decisão de capacidade ou prioridade (ex.: "quantas horas semanais você tem disponível?"). Não interrogue campo por campo se a maioria estiver clara.
