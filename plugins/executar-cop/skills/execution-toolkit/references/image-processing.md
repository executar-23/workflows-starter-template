# Processamento de Imagens

## Quando usar

Use esta referência para:

- descrever uma imagem existente;
- responder perguntas sobre seu conteúdo;
- extrair informações;
- redimensionar, recortar, converter ou comprimir;
- executar operações tradicionais de visão computacional.

## Regra principal

Escolha a ferramenta pelo entregável.

Se o resultado for **dados extraídos** ou os **mesmos pixels recodificados**, use processamento determinístico.

Se o resultado for uma **nova imagem visual**, edição semântica, restauração, melhoria ou estilização, use geração/edição por IA.

## Rotas recomendadas

| Tarefa | Ferramenta |
|---|---|
| Descrição ou Q&A sobre imagem | compreensão multimodal |
| Resize, crop, conversão, compressão | PIL/Pillow |
| Filtros, bordas, geometria | OpenCV |
| Upscale, restauração, melhoria | geração/edição por IA |
| Transferência de estilo | geração/edição por IA |
| Adição visual de textos, setas ou callouts | geração/edição por IA |

## Limites

- Preserve a proporção por padrão.
- Não corte bordas sem autorização quando isso alterar conteúdo relevante.
- Não use processamento determinístico para criar novo conteúdo visual.
- Não use OpenCV para restauração ou upscale visual.
- Não componha textos ou anotações finais com PIL, SVG, canvas, HTML ou matplotlib.
- Para plantas, layouts, vistas de produto e desenhos conceituais, use geração de imagens salvo quando houver exigência de escala exata, medidas verificadas ou fonte CAD/editável.

## Entrega

- Grave a transformação em um novo caminho.
- Não sobrescreva o original salvo solicitação explícita.
- Se houver risco de perda de proporção, rotação, espaço de cor ou transparência, valide o resultado uma vez.
- Entregue o arquivo final.
- Inclua o script somente quando o usuário precisar reutilizá-lo.
