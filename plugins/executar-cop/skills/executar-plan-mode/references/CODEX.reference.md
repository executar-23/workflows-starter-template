# Codex · Reference

## Função nesta Skill

Adaptar planos para execução posterior por OpenAI Codex.

## Conceitos relevantes

- `AGENTS.md` fornece instruções persistentes sobre o repositório.
- instruções podem ser scoped por diretório;
- arquivos mais específicos podem governar paths mais específicos;
- prompts se beneficiam de contexto semelhante a uma issue/PR:
  paths, componentes, mudança requerida e critérios de aceitação;
- testes e ambiente devem fazer parte do plano de verificação;
- documentação profunda deve permanecer em fontes de verdade, evitando inflar instruções de entrada.

## Aplicação

Quando `TARGET_AGENT = CODEX`, carregar:

`contracts/CODEX-PLAN-MODE.contract.md`

e usar:

`adapters/codex/AGENTS.template.md`
