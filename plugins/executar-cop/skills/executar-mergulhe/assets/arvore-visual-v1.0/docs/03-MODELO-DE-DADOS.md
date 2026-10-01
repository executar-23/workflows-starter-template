# 03 · Modelo de dados

## Nó

Cada elemento visível é um nó.

```json
{
  "id": "D25-ROTAS",
  "titulo": "Reunir rotas existentes",
  "tipo": "arquivo",
  "estado": "liberado",
  "dependeDe": [],
  "desbloqueia": ["D25-DEPS"]
}
```

## Nó com filhos

```json
{
  "id": "D25",
  "titulo": "25/08 · Central de lançamento",
  "tipo": "pasta",
  "estado": "atual",
  "filhos": [
    {"id":"D25-ROTAS","titulo":"Reunir rotas existentes","tipo":"arquivo"},
    {"id":"D25-CTAS","titulo":"Classificar chamadas para ação","tipo":"arquivo"}
  ]
}
```

## Porta

```json
{
  "id": "PORTA-D26",
  "titulo": "Liberar 26/08",
  "tipo": "porta",
  "estado": "dependencia",
  "dependeDe": ["D25-ROTAS", "D25-CTAS", "D25-MATERIAIS", "D25-DEPS"],
  "desbloqueia": ["D26"]
}
```

## Dependência externa

```json
{
  "id": "HOTMART-CADASTRO",
  "titulo": "Hotmart",
  "tipo": "arquivo",
  "estado": "dependencia",
  "nota": "Dependência externa",
  "bloqueio": {
    "tipo": "externo",
    "descricao": "Aguardando habilitação da plataforma"
  }
}
```

## Separação recomendada

Para sistemas maiores, armazenar separadamente:

```text
nodes.json
relations.json
states.json
views.json
```

`nodes` descreve objetos.

`relations` descreve dependências e desbloqueios.

`states` descreve estado operacional.

`views` descreve quais ramos aparecem em cada visualização.

## Vistas diferentes da mesma fonte

O mesmo conjunto de nós pode gerar:

- árvore por projeto;
- árvore por data;
- árvore por área;
- árvore por entrega;
- árvore por dependência;
- árvore editorial;
- árvore de lançamento.

Assim, a Árvore Visual é uma **projeção**, não uma duplicação dos dados.
