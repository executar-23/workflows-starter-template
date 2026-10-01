# Plano de Execução

Use este arquivo como referência para decidir quais módulos carregar antes de executar uma tarefa.

## 1. Identifique o entregável

Classifique o resultado principal:

| Entregável | Caminho |
|---|---|
| Pesquisa ou análise de vários itens independentes | Workflow Composer |
| Dados extraídos de uma imagem ou transformação determinística | Image Processing |
| Relatório, análise ou documento técnico | Technical Writing |
| Combinação dos anteriores | Carregamento progressivo por etapa |

## 2. Verifique se existe fan-out

Use Workflow Composer somente quando:

- existirem 3 ou mais unidades independentes;
- cada unidade exigir pesquisa, raciocínio ou julgamento próprio;
- os resultados puderem ser processados em paralelo.

Se a mesma operação determinística puder ser aplicada a todos os itens, use um único script com concorrência limitada.

## 3. Verifique a natureza da tarefa visual

Para imagens existentes:

- descrição, perguntas ou extração semântica → compreensão multimodal;
- crop, resize, conversão ou compressão → PIL/Pillow;
- filtros, bordas ou operações geométricas → OpenCV;
- criação, restauração, upscale, estilo ou edição semântica → geração/edição por IA.

## 4. Defina a etapa de síntese

Quando houver documento final, carregue Technical Writing somente após os dados necessários estarem disponíveis.

Organize o resultado da conclusão geral para os detalhes.

## 5. Progressive disclosure

Carregue apenas o necessário para a etapa corrente:

1. `SKILL.md`
2. uma referência específica
3. outra referência apenas se a tarefa realmente atravessar outro domínio

Evite carregar todo o diretório de uma vez.
