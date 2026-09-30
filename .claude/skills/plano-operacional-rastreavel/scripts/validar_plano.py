#!/usr/bin/env python3
"""
Juiz validador do documento interno (entregável #1) da skill plano-operacional-rastreavel.

Uso:
    python3 scripts/validar_plano.py caminho/para/plano-interno-cliente-periodo.md

Roda DEPOIS de gerar o documento interno e ANTES de gerar os entregáveis #2, #3 e #4.
Saída: relatório no stdout. Exit code 0 = PASS (pode prosseguir), 1 = FAIL (corrigir e re-rodar).

O que ele verifica (checagem estrutural determinística, não julga conteúdo):
  1. As 17 seções numeradas + Apêndice A + Apêndice B existem.
  2. O disclaimer legal ("não é auditoria, certificação...") está presente.
  3. O Registro Final de Honestidade e o fechamento "Fim do documento" existem.
  4. Nenhum placeholder de template sobrou ([PREENCHER], [nome do titular], [DD/MM/AAAA], etc.).
  5. Todo conflito mencionado em texto tem registro formal CONF-XX (conflito nunca é
     "resolvido" escondendo informação); todo CONF-XX citado fora do §3.5 está definido lá.
  6. Capacidade: total alocado / execução planejada é ESTRITAMENTE menor que a nominal.
  7. Contingência: o percentual declarado NA LINHA de contingência da tabela §7 é 15%,
     a menos que exista uma DECISION (DEC-XX) registrando outro percentual para contingência.
     (A busca é restrita à própria linha da contingência — números intermediários como
     "-8h" em outras células/linhas não interferem na extração do percentual.)
"""

import re
import sys
import unicodedata

CONTINGENCIA_PADRAO = 15.0  # percentual fixo da metodologia


def _norm(s: str) -> str:
    """minúsculas + sem acentos, para comparações tolerantes."""
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.lower()


class Relatorio:
    def __init__(self):
        self.erros = []
        self.avisos = []
        self.oks = []

    def erro(self, msg):
        self.erros.append(msg)

    def aviso(self, msg):
        self.avisos.append(msg)

    def ok(self, msg):
        self.oks.append(msg)

    def imprimir(self):
        for m in self.oks:
            print(f"  [OK]    {m}")
        for m in self.avisos:
            print(f"  [AVISO] {m}")
        for m in self.erros:
            print(f"  [ERRO]  {m}")
        print()
        if self.erros:
            print(f"RESULTADO: FAIL — {len(self.erros)} erro(s), {len(self.avisos)} aviso(s).")
            print("Corrija o documento interno e rode o juiz de novo ANTES de gerar os entregáveis #2, #3 e #4.")
            return 1
        print(f"RESULTADO: PASS — 0 erros, {len(self.avisos)} aviso(s). Pode gerar os entregáveis do cliente.")
        return 0


# ---------------------------------------------------------------------------
# 1. Seções e apêndices
# ---------------------------------------------------------------------------

def checar_secoes(texto, rel):
    numeros = set()
    for m in re.finditer(r"^#{1,4}\s*(\d{1,2})[\.\)\u2014\-:\s]", texto, re.MULTILINE):
        n = int(m.group(1))
        if 1 <= n <= 17:
            numeros.add(n)
    faltando = sorted(set(range(1, 18)) - numeros)
    if faltando:
        rel.erro(f"Seções numeradas ausentes: {faltando} (o schema exige as 17 seções, §1 a §17).")
    else:
        rel.ok("17 seções numeradas (§1–§17) presentes.")

    tnorm = _norm(texto)
    for ap in ("a", "b"):
        if re.search(rf"apendice\s+{ap}\b", tnorm):
            rel.ok(f"Apêndice {ap.upper()} presente.")
        else:
            rel.erro(f"Apêndice {ap.upper()} ausente.")


# ---------------------------------------------------------------------------
# 2. Disclaimer e fechamento
# ---------------------------------------------------------------------------

def checar_disclaimer_e_fechamento(texto, rel):
    tnorm = _norm(texto)
    if re.search(r"nao\s+e\s+auditoria", tnorm) and "certifica" in tnorm:
        rel.ok("Disclaimer legal ('não é auditoria, certificação...') presente.")
    else:
        rel.erro("Disclaimer legal ausente — o documento deve declarar que não é auditoria, "
                 "certificação, opinião legal, aprovação regulatória nem declaração de conformidade.")

    if "registro final de honestidade" in tnorm:
        rel.ok("Registro Final de Honestidade presente.")
    else:
        rel.erro("Seção 'Registro Final de Honestidade' ausente.")

    if "fim do documento" in tnorm:
        rel.ok("Fechamento 'Fim do documento' presente.")
    else:
        rel.erro("Fechamento 'Fim do documento. Emitido em ...' ausente.")


# ---------------------------------------------------------------------------
# 3. Placeholders esquecidos
# ---------------------------------------------------------------------------

PLACEHOLDERS = [
    r"\[PREENCHER[^\]]*\]",
    r"\[INSERIR[^\]]*\]",
    r"\[COMPLETAR[^\]]*\]",
    r"\[nome d[oa][^\]]*\]",
    r"\[DD/MM/AAAA\]",
    r"\[ex\.\:[^\]]*\]",
    r"\[cliente\]",
    r"\[periodo\]",
    r"\[per[ií]odo\]",
]


def checar_placeholders(texto, rel):
    achados = []
    for pat in PLACEHOLDERS:
        for m in re.finditer(pat, texto, re.IGNORECASE):
            achados.append(m.group(0))
    if achados:
        unicos = sorted(set(achados))
        rel.erro(f"Placeholders de template esquecidos no documento final: {unicos}")
    else:
        rel.ok("Nenhum placeholder de template esquecido.")


# ---------------------------------------------------------------------------
# 4. Conflitos: menção em texto exige registro CONF-XX
# ---------------------------------------------------------------------------

def checar_conflitos(texto, rel):
    conf_ids = set(re.findall(r"\bCONF-\d+\b", texto))

    tnorm = _norm(texto)
    menciona_conflito = bool(
        re.search(r"\bconflit", tnorm)
        or re.search(r"divergencia\s+entre\s+(as\s+)?fontes", tnorm)
        or re.search(r"fontes\s+diverg", tnorm)
    )

    if menciona_conflito and not conf_ids:
        rel.erro("O texto menciona conflito/divergência entre fontes, mas não existe NENHUM "
                 "registro CONF-XX. Conflitos nunca podem ser resolvidos escondendo a "
                 "informação — registre ambas as versões na tabela §3.5 com ID CONF-XX.")
    elif menciona_conflito:
        rel.ok(f"Conflitos mencionados têm registro formal ({len(conf_ids)} ID(s) CONF-XX encontrados).")
    else:
        # Sem menção a conflito: só checar se a subseção 3.5 declara ausência ou existe
        if re.search(r"3\.5", texto) or "conflitos" in tnorm:
            rel.ok("Sem conflitos mencionados; estrutura de conflitos (§3.5) presente.")
        else:
            rel.aviso("Nenhuma menção a conflitos e a subseção §3.5 não foi localizada — confirme "
                      "que ela existe (mesmo vazia, com 'nenhum conflito identificado').")

    # CONF-XX citados fora do §3.5 devem estar definidos em tabela (linha iniciando com | CONF-)
    definidos = set(re.findall(r"^\s*\|\s*(CONF-\d+)\b", texto, re.MULTILINE))
    if conf_ids and not definidos:
        rel.erro(f"IDs {sorted(conf_ids)} são citados no texto, mas nenhum aparece como linha de "
                 "tabela em §3.5 (`| CONF-XX | Fonte A | Fonte B | ... |`).")
    else:
        orfaos = conf_ids - definidos
        if orfaos:
            rel.erro(f"CONF citados sem definição na tabela §3.5: {sorted(orfaos)}")
        elif conf_ids:
            rel.ok("Todos os CONF-XX citados estão definidos na tabela de conflitos.")


# ---------------------------------------------------------------------------
# 5. Capacidade e contingência (seção 7)
# ---------------------------------------------------------------------------

def _extrair_secao7(texto):
    """Recorta o trecho do documento entre o heading da §7 e o próximo heading numerado."""
    m = re.search(r"^#{1,4}\s*7[\.\)\u2014\-:\s].*$", texto, re.MULTILINE)
    if not m:
        return None
    inicio = m.end()
    prox = re.search(r"^#{1,4}\s*(?:8|9|1\d)[\.\)\u2014\-:\s]", texto[inicio:], re.MULTILINE)
    return texto[inicio:inicio + prox.start()] if prox else texto[inicio:]


def _horas_da_linha(linha):
    """Primeiro valor de horas na linha (aceita '40h', '40 h', '40,5h')."""
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*h\b", linha, re.IGNORECASE)
    return float(m.group(1).replace(",", ".")) if m else None


def checar_capacidade_e_contingencia(texto, rel):
    sec7 = _extrair_secao7(texto)
    if sec7 is None:
        rel.erro("Não foi possível localizar a seção 7 (Capacidade e Alocação) para validar capacidade.")
        return

    linhas = sec7.splitlines()
    nominal = alocado = None
    linha_conting = None

    for ln in linhas:
        lnorm = _norm(ln)
        if nominal is None and "nominal" in lnorm:
            nominal = _horas_da_linha(ln)
        if "total alocado" in lnorm or "total planejado" in lnorm:
            alocado = _horas_da_linha(ln)
        if alocado is None and ("execucao planejada" in lnorm or "execucao focada" in lnorm):
            alocado = _horas_da_linha(ln)  # fallback se não houver linha de total
        if linha_conting is None and "contingencia" in lnorm:
            linha_conting = ln

    # --- capacidade planejada < nominal ---
    if nominal is None:
        rel.erro("Linha de capacidade nominal (com horas) não encontrada na tabela §7.")
    elif alocado is None:
        rel.erro("Linha de total alocado/execução planejada (com horas) não encontrada na tabela §7.")
    elif alocado >= nominal:
        rel.erro(f"Capacidade planejada/alocada ({alocado}h) é maior ou igual à nominal "
                 f"({nominal}h) — a metodologia proíbe alocar 100% do nominal.")
    else:
        rel.ok(f"Capacidade alocada ({alocado}h) < nominal ({nominal}h).")

    # --- percentual de contingência: extraído SOMENTE da linha de contingência ---
    if linha_conting is None:
        rel.erro("Linha de reserva de contingência não encontrada na tabela §7.")
        return

    # Nota do bug corrigido na auditoria: a busca é feita apenas dentro da própria linha
    # da contingência e captura exclusivamente números seguidos de '%'. Valores de horas
    # (ex.: '-8h', '5,1h') na mesma linha ou em linhas vizinhas não interferem.
    m_pct = re.search(r"(\d+(?:[.,]\d+)?)\s*%", linha_conting)
    if not m_pct:
        rel.erro("A linha de contingência não declara o percentual usado (ex.: '(15%)'). "
                 "O percentual deve estar explícito na própria linha da tabela §7.")
        return
    pct = float(m_pct.group(1).replace(",", "."))

    # DECISION que autorize outro percentual: linha contendo DEC-XX + 'contingência' + um %
    pcts_autorizados = set()
    for ln in texto.splitlines():
        if re.search(r"\bDEC-\d+\b", ln) and "contingencia" in _norm(ln):
            for mm in re.finditer(r"(\d+(?:[.,]\d+)?)\s*%", ln):
                pcts_autorizados.add(float(mm.group(1).replace(",", ".")))

    if abs(pct - CONTINGENCIA_PADRAO) < 0.01:
        rel.ok(f"Reserva de contingência usa o padrão fixo da metodologia ({pct:g}%).")
    elif pct in pcts_autorizados:
        rel.ok(f"Reserva de contingência de {pct:g}% difere do padrão (15%), mas está "
               "coberta por DECISION registrada (DEC-XX) que autoriza esse percentual.")
    else:
        rel.erro(f"Percentual de contingência usado ({pct:g}%) é diferente do padrão fixo "
                 f"({CONTINGENCIA_PADRAO:g}%) e NÃO há DECISION (DEC-XX) registrada "
                 "autorizando outro valor. Ou corrija para 15%, ou registre a decisão do "
                 "cliente em §3.2 mencionando 'contingência' e o percentual.")


# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    caminho = sys.argv[1]
    try:
        with open(caminho, encoding="utf-8") as f:
            texto = f.read()
    except OSError as e:
        print(f"[ERRO] Não foi possível ler '{caminho}': {e}")
        sys.exit(2)

    print(f"Juiz validador — {caminho}")
    print("=" * 60)
    rel = Relatorio()
    checar_secoes(texto, rel)
    checar_disclaimer_e_fechamento(texto, rel)
    checar_placeholders(texto, rel)
    checar_conflitos(texto, rel)
    checar_capacidade_e_contingencia(texto, rel)
    sys.exit(rel.imprimir())


if __name__ == "__main__":
    main()
