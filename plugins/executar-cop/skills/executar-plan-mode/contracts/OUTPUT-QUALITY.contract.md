# OUTPUT-QUALITY · Contract

ID: CONTRACT-PLAN-QUALITY-001  
Status: ACTIVE_WITHIN_SKILL  
Version: 1.0

## Plan quality dimensions

### Completeness
O plano cobre entradas, saídas, restrições, dependências, riscos e encerramento.

### Specificity
Cada fase produz algo verificável.

### Traceability
Decisões relevantes apontam para regra, evidência ou restrição.

### Executability
Outro agente pode executar sem precisar reconstruir a intenção original.

### Safety
O plano não presume autorização operacional.

### Verification
Cada fase possui gate ou critério de aceitação.

## Reject plan if

- fases são apenas verbos genéricos;
- outputs são vagos;
- dependências críticas estão ausentes;
- não há stop state;
- o plano mistura implementação já realizada com implementação futura;
- o plano declara estados superiores sem evidência.
