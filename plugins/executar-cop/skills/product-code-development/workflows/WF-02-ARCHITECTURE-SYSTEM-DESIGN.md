# WF-02 — Architecture & System Design

Capabilities: ENG01 + ENG02; PM04 para requirements; PM03/WF-08 para gaps.

## Architecture
Defina system context, boundaries, apps/packages/services, data/auth/tenancy, canonical state, interfaces de provider, deployment, constraints e trade-offs.

## System Design
Para cada capability, detalhe: actors/entry points, happy/failure paths, commands/events/APIs, schema/data, concurrency/idempotency, security/authorization, observability, performance/scale e testability.

Regra: feche apenas decisões que bloqueiam código ou são caras de reverter. O restante pode ser resolvido incrementalmente.
