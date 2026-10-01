# Mapeamento do MASTER_EDITORIAL_RISCO_COGNITIVO_V1

A unidade operacional é `1 problema → 1 solução → múltiplos assets`. Campos reconhecidos do registro de problema: `problem_id`, `problem_title`, `problem_statement`, `audience`, `context`, `consequence`, `principle_mechanism`, `risk_ids`, `cognitive_cost_ids`, `evidence_ids`, `management_domain_ids`, `intervention`, `solution_id`, `before_state`, `after_state`, `next_action`, `success_metric`, `editorial_pillar`, `awareness_level`, `priority`, `status`, métricas e datas.

O normalizador aceita JSON/YAML, CSV e XLSX quando `openpyxl` estiver disponível. Para planilhas via conector, o agente pode converter a linha selecionada ao schema JSON antes de executar scripts. Campos desconhecidos devem ser preservados em `extensions`.
