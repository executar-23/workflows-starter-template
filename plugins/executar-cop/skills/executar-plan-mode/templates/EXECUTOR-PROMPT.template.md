# ============================================================
# EXECUTOR PROMPT
# ============================================================

TARGET_AGENT = {{TARGET_AGENT}}
MODE = PLAN
EXECUTION_APPROVED = false

# 0. PAPEL

{{ROLE}}

# 1. MISSÃO

{{MISSION}}

# 2. FONTES DE VERDADE

{{SOURCES_OF_TRUTH}}

# 3. RESTRIÇÕES

{{CONSTRAINTS}}

# 4. ESTADOS NÃO EQUIVALENTES

EXISTENTE != COMPLETO != APROVADO != IMPLEMENTADO != TESTADO != VERIFICADO != PUBLICADO

# 5. FASES

{{PHASES}}

# 6. QUALITY GATES

{{GATES}}

# 7. DEFINITION OF DONE

{{DOD}}

# 8. STOP CONDITION

Quando o plano estiver concluído:

PLAN_READY
AWAITING_EXECUTION_APPROVAL
