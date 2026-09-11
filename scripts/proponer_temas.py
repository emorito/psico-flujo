#!/usr/bin/env python3
"""
scripts/proponer_temas.py
T2 - Fase B: Propuesta de temas con Ollama (qwen2.5:7b y gemma4:e4b).
Genera:
1. _orquestacion/salidas/T2/temas_propuesta.csv
2. _orquestacion/salidas/T2/sinonimos_propuesta.csv
3. _orquestacion/salidas/T2/licencias_para_revisar.csv
4. _orquestacion/salidas/T2/REVISION_ENRIQUE.md
"""

import os
import sys
import csv
import json
import re
import urllib.request
from collections import defaultdict

BASE_DIR = "/Users/emorosini/Downloads/Instrumentos/BASE_INSTRUMENTAL_FINAL"
CATALOGO_CSV = os.path.join(BASE_DIR, "CATALOGO_MAESTRO.csv")
SALIDAS_T2 = "/Users/emorosini/Downloads/Instrumentos/_orquestacion/salidas/T2"
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

# Lista cerrada de 38 temas definidos a partir de los 6 ejes y constructos
THEMES = [
    "Adicciones conductuales",
    "Afrontamiento y resiliencia",
    "Agresividad, ira y violencia",
    "Alfabetización y conductas de salud",
    "Ansiedad y fobia",
    "Apego y relaciones interpersonales",
    "Apoyo social y familia",
    "Atención y concentración",
    "Autoestima y autoconcepto",
    "Bienestar y satisfacción vital",
    "Bipolaridad y manía",
    "Calidad de vida",
    "Cognición social",
    "Conducta alimentaria e imagen corporal",
    "Cribado cognitivo y demencias",
    "Depresión y estado de ánimo",
    "Desempeño laboral y burnout",
    "Dolor y síntomas somáticos",
    "Efectos de psicofármacos",
    "Esquemas y procesos cognitivos",
    "Flexibilidad psicológica y mindfulness",
    "Funcionamiento y discapacidad",
    "Funciones ejecutivas",
    "Identidad y valores",
    "Impulsividad y conducta disruptiva",
    "Lenguaje y comunicación verbal",
    "Memoria y aprendizaje",
    "Obsesiones y compulsiones",
    "Personalidad patológica",
    "Psicosis y experiencias delirantes",
    "Rasgos de personalidad",
    "Regulación emocional",
    "Rendimiento académico",
    "Salud sexual",
    "Sueño y ritmos circadianos",
    "Suicidio y autolesión",
    "Sustancias y alcoholismo",
    "Trauma y estrés postraumático"
]

def query_ollama(model, prompt):
    payload = {
        "model": model,
        "prompt": prompt,
        "format": "json",
        "stream": False,
        "options": {"temperature": 0}
    }
    req = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=120) as res:
        data = json.loads(res.read().decode("utf-8"))
        return json.loads(data["response"])

def clean_theme(raw_theme):
    if not raw_theme:
        return None
    raw = raw_theme.strip().lower()
    for t in THEMES:
        if t.lower() == raw:
            return t
    # Substring match
    for t in THEMES:
        if raw in t.lower() or t.lower() in raw:
            return t
    return raw_theme.strip()

def classify_batch(model, batch_items):
    themes_str = "\n".join(f"- {t}" for t in THEMES)
    items_str = "\n".join(
        f'{i+1}. [ID: {item["id"]}] Constructo: "{item["constructo"]}" | Eje: {item["eje"]}'
        for i, item in enumerate(batch_items)
    )
    first_id = batch_items[0]["id"]
    last_id = batch_items[-1]["id"]
    prompt = f"""Eres un psicólogo clínico y metodólogo experto.
Dispones de la siguiente lista CERRADA de 38 temas clínicos:
{themes_str}

Para cada uno de los constructos listados abajo, selecciona el tema principal más adecuado de la lista cerrada:
{items_str}

Responde ÚNICAMENTE un objeto JSON con este formato exacto (usando los mismos IDs de cada constructo):
{{
  "clasificaciones": [
    {{"id": {first_id}, "tema": "<tema_exacto_de_la_lista>"}},
    {{"id": {last_id}, "tema": "<tema_exacto_de_la_lista>"}}
  ]
}}"""
    mapping = {}
    valid_ids = {it["id"]: it for it in batch_items}
    try:
        res = query_ollama(model, prompt)
        res_list = res.get("clasificaciones") or res.get("resultados") or res.get("items") or []
        for idx, r in enumerate(res_list):
            raw_id = r.get("id")
            tema = clean_theme(r.get("tema"))
            # Caso 1: el ID coincide con el ID global del constructo
            if raw_id in valid_ids:
                mapping[raw_id] = tema
            # Caso 2: el ID es el índice 1-based del lote
            elif isinstance(raw_id, int) and 1 <= raw_id <= len(batch_items):
                target_id = batch_items[raw_id - 1]["id"]
                mapping[target_id] = tema
            # Caso 3: coincidencia por posición en la lista
            elif idx < len(batch_items) and batch_items[idx]["id"] not in mapping:
                mapping[batch_items[idx]["id"]] = tema
    except Exception as e:
        print(f"  [ERROR batch {model}]: {e}")

    # Fallback individual para cualquier item que no haya quedado mapeado
    for item in batch_items:
        if item["id"] not in mapping or not mapping[item["id"]]:
            try:
                single_p = f"""Dispones de esta lista cerrada de temas clínicos:
{themes_str}

Constructo: "{item['constructo']}" | Eje: {item['eje']}
Elige exactamente un tema de la lista cerrada para este constructo.
Responde ÚNICAMENTE en JSON: {{"id": {item['id']}, "tema": "<tema_exacto_de_la_lista>"}}"""
                s_res = query_ollama(model, single_p)
                mapping[item['id']] = clean_theme(s_res.get("tema"))
            except Exception as e2:
                print(f"  [ERROR individual {model}] ID {item['id']}: {e2}")
                mapping[item['id']] = "Sin clasificar"

    return mapping

def main():
    print("=== INICIANDO PROPUESTA DE TEMAS CON OLLAMA (T2 - FASE B) ===")
    os.makedirs(SALIDAS_T2, exist_ok=True)

    # 1. Leer CATALOGO_MAESTRO.csv
    print(f"1. Leyendo catálogo desde: {CATALOGO_CSV}")
    with open(CATALOGO_CSV, "r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    print(f"   Total familias: {len(rows)}")

    # Agrupar por constructo
    constructo_map = defaultdict(lambda: {"ejes": set(), "n_familias": 0, "familias": []})
    for r in rows:
        c = r["constructo"].strip()
        e = r["eje"].strip()
        constructo_map[c]["ejes"].add(e)
        constructo_map[c]["n_familias"] += 1
        constructo_map[c]["familias"].append(r["sigla"].strip())

    items = []
    idx = 1
    for c, info in sorted(constructo_map.items()):
        items.append({
            "id": idx,
            "constructo": c,
            "eje": ", ".join(sorted(info["ejes"])),
            "n_familias": info["n_familias"],
            "familias": info["familias"]
        })
        idx += 1

    print(f"2. Total constructos distintos para clasificar: {len(items)}")

    # 2. Clasificación con Modelo 1: qwen2.5:7b
    print("\n3. Clasificando con Modelo 1: qwen2.5:7b...")
    batch_size = 10
    model1_res = {}
    for i in range(0, len(items), batch_size):
        batch = items[i:i+batch_size]
        print(f"   Procesando lote {i+1} - {min(i+batch_size, len(items))} de {len(items)}...")
        m = classify_batch("qwen2.5:7b", batch)
        model1_res.update(m)

    # 3. Clasificación con Modelo 2: gemma4:e4b
    print("\n4. Clasificando con Modelo 2: gemma4:e4b...")
    model2_res = {}
    for i in range(0, len(items), batch_size):
        batch = items[i:i+batch_size]
        print(f"   Procesando lote {i+1} - {min(i+batch_size, len(items))} de {len(items)}...")
        m = classify_batch("gemma4:e4b", batch)
        model2_res.update(m)

    # 4. Consolidar temas_propuesta.csv
    print("\n5. Consolidando temas_propuesta.csv...")
    temas_propuesta_path = os.path.join(SALIDAS_T2, "temas_propuesta.csv")
    temas_rows = []
    acuerdos_count = 0
    revisar_count = 0

    for it in items:
        cid = it["id"]
        c_text = it["constructo"]
        eje = it["eje"]
        n_fam = it["n_familias"]
        t1 = model1_res.get(cid, "")
        t2 = model2_res.get(cid, "")
        
        acuerdo = "sí" if (t1 and t2 and t1 == t2) else "no"
        if acuerdo == "sí":
            tema_final = t1
            acuerdos_count += 1
            # Verificar si el tema se deduce del constructo
            # Si no hay tokens comunes o palabras clave, marcar revisar=1
            c_low = c_text.lower()
            t_low = t1.lower()
            # Stopwords básicas
            stopwords = {"y", "de", "la", "el", "en", "del", "las", "los", "e", "o"}
            c_words = set(re.findall(r"\w+", c_low)) - stopwords
            t_words = set(re.findall(r"\w+", t_low)) - stopwords
            has_overlap = bool(c_words & t_words)
            
            # Casos específicos con sinónimos conocidos donde sí se deduce
            known_deductions = [
                ("miedo", "ansiedad"), ("anhedonia", "depresión"), ("afecto", "emocional"),
                ("coping", "afrontamiento"), ("estrés", "trauma"), ("estres", "trauma"),
                ("bulímicos", "conducta alimentaria"), ("alimentaria", "conducta alimentaria"),
                ("alcohol", "sustancias"), ("tabaco", "sustancias"), ("adicción", "sustancias"),
                ("manía", "bipolaridad"), ("delirante", "psicosis"), ("prodrómicos", "psicosis"),
                ("autolesiones", "suicidio"), ("suicida", "suicidio"), ("metamemoria", "memoria"),
                ("estado mental", "cribado cognitivo"), ("demencia", "cribado cognitivo"),
                ("alzheimer", "cribado cognitivo"), ("disejecutivos", "funciones ejecutivas"),
                ("circadiano", "sueño"), ("insomnio", "sueño"), ("eréctil", "salud sexual"),
                ("psicofármacos", "efectos de psicofármacos"), ("mindfulness", "mindfulness"),
                ("burnout", "desempeño laboral"), ("autocompasión", "emocional"),
                ("alexitimia", "emocional"), ("rumiación", "cognitivos"), ("fusión", "mindfulness"),
                ("aculturación", "identidad"), ("narcisista", "personalidad")
            ]
            for cw, tw in known_deductions:
                if cw in c_low and tw in t_low:
                    has_overlap = True
                    break
            
            revisar = 0 if has_overlap else 1
        else:
            tema_final = ""
            revisar = 1

        if revisar == 1:
            revisar_count += 1

        temas_rows.append({
            "constructo": c_text,
            "eje": eje,
            "n_familias": n_fam,
            "tema_modelo1": t1,
            "tema_modelo2": t2,
            "acuerdo": acuerdo,
            "tema_final": tema_final,
            "revisar": revisar
        })

    with open(temas_propuesta_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["constructo", "eje", "n_familias", "tema_modelo1", "tema_modelo2", "acuerdo", "tema_final", "revisar"],
            lineterminator="\n"
        )
        writer.writeheader()
        writer.writerows(temas_rows)

    print(f"   Guardado: {temas_propuesta_path} ({len(temas_rows)} filas)")
    print(f"   Acuerdos entre modelos: {acuerdos_count} ({acuerdos_count/len(temas_rows)*100:.1f}%)")
    print(f"   Filas marcadas con revisar=1: {revisar_count}")

    # 5. Generar sinonimos_propuesta.csv
    print("\n6. Generando sinonimos_propuesta.csv para los 38 temas...")
    sinonimos_path = os.path.join(SALIDAS_T2, "sinonimos_propuesta.csv")
    sinonimos_rows = []

    # Prompt para sinónimos por lotes de 5 temas
    for i in range(0, len(THEMES), 5):
        batch_themes = THEMES[i:i+5]
        s_prompt = f"""Para cada uno de los siguientes temas de evaluación psicológica, provee de 3 a 6 términos clínicos, siglas, acrónimos o sinónimos habituales de búsqueda (solo términos clínicos, separados por comas, sin definiciones):
{batch_themes}

Responde en formato JSON:
{{
  "sinonimos": [
    {{"tema": "{batch_themes[0]}", "terminos": "..."}}
  ]
}}"""
        try:
            res_s = query_ollama("qwen2.5:7b", s_prompt)
            items_s = res_s.get("sinonimos") or []
            terms_map = {item["tema"]: item["terminos"] for item in items_s if "tema" in item and "terminos" in item}
        except Exception:
            terms_map = {}

        for t in batch_themes:
            terms = terms_map.get(t, "")
            # Fallback a términos conocidos si vino vacío
            if not terms:
                known_terms = {
                    "Ansiedad y fobia": "TAG, fobia social, crisis de angustia, pánico, agorafobia",
                    "Depresión y estado de ánimo": "depresión mayor, distimia, afecto negativo, anhedonia, ánimo bajo",
                    "Bipolaridad y manía": "trastorno bipolar, manía, hipomanía, ciclotimia",
                    "Trauma y estrés postraumático": "TEPT, trauma complejo, estrés agudo, disociación",
                    "Suicidio y autolesión": "ideación suicida, riesgo de suicidio, NSSI, autolesiones",
                    "Obsesiones y compulsiones": "TOC, dudas obsesivas, comprobación, contaminación, rituales",
                    "Psicosis y experiencias delirantes": "esquizofrenia, síntomas positivos, delirio, alucinación",
                    "Impulsividad y conducta disruptiva": "TDAH, oposicionismo, problemas de conducta, descontrol",
                    "Sustancias y alcoholismo": "consumo problemático, AUDIT, abuso de drogas, dependencia, adicción",
                    "Adicciones conductuales": "juego patológico, ludopatía, uso de internet, apuestas",
                    "Conducta alimentaria e imagen corporal": "TCA, anorexia, bulimia, atracones, insatisfacción corporal",
                    "Agresividad, ira y violencia": "hostilidad, rabia, agresión física, conducta violenta",
                    "Regulación emocional": "DERS, desregulación emocional, reevaluación cognitiva, supresión",
                    "Afrontamiento y resiliencia": "coping, resiliencia, tolerancia a la frustración, adaptación",
                    "Esquemas y procesos cognitivos": "creencias centrales, distorsiones cognitivas, rumiación, preocupación",
                    "Flexibilidad psicológica y mindfulness": "ACT, defusión cognitiva, atención plena, aceptación",
                    "Apego y relaciones interpersonales": "apego ansioso, apego evitativo, dependencia emocional, asertividad",
                    "Rasgos de personalidad": "Big Five, neuroticismo, extraversión, apertura, amabilidad",
                    "Personalidad patológica": "TLP, narcisismo, psicopatía, tríada oscura, desapego",
                    "Autoestima y autoconcepto": "valía personal, autoeficacia, autoimagen",
                    "Identidad y valores": "sentido de vida, propósito vital, valores personales",
                    "Bienestar y satisfacción vital": "florecimiento, felicidad, satisfacción vital, afecto positivo",
                    "Calidad de vida": "QoL, bienestar general, estado percibido de salud",
                    "Apoyo social y familia": "red de apoyo, funcionamiento familiar, dinámica de pareja",
                    "Funcionamiento y discapacidad": "WHODAS, actividades de la vida diaria, discapacidad funcional",
                    "Desempeño laboral y burnout": "agotamiento laboral, engagement, estrés laboral",
                    "Rendimiento académico": "adaptación escolar, hábitos de estudio, aprendizaje escolar",
                    "Cribado cognitivo y demencias": "MMSE, MoCA, deterioro cognitivo, demencia, Alzheimer",
                    "Memoria y aprendizaje": "memoria de trabajo, memoria episódica, metamemoria, olvidos",
                    "Atención y concentración": "atención sostenida, vigilancia, atención dividida, concentración",
                    "Funciones ejecutivas": "planificación, inhibición, flexibilidad cognitiva, control inhibitorio",
                    "Lenguaje y comunicación verbal": "fluidez verbal, denominación, afasia, expresión verbal",
                    "Cognición social": "teoría de la mente, reconocimiento de emociones, empatía, interocepción",
                    "Sueño y ritmos circadianos": "insomnio, apnea, calidad del sueño, cronotipo",
                    "Dolor y síntomas somáticos": "somatización, fatiga crónica, fibromialgia, dolor crónico",
                    "Salud sexual": "disfunción sexual, satisfacción sexual, función eréctil",
                    "Alfabetización y conductas de salud": "adherencia terapéutica, conductas de salud, autocuidado",
                    "Efectos de psicofármacos": "efectos secundarios, extrapiramidalismo, sedación, temblor"
                }
                terms = known_terms.get(t, t)

            sinonimos_rows.append({
                "tema": t,
                "sinonimos": terms,
                "revisar": 1
            })

    with open(sinonimos_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["tema", "sinonimos", "revisar"], lineterminator="\n")
        writer.writeheader()
        writer.writerows(sinonimos_rows)

    print(f"   Guardado: {sinonimos_path} ({len(sinonimos_rows)} temas con revisar=1)")

    # 6. Generar licencias_para_revisar.csv
    print("\n7. Generando licencias_para_revisar.csv...")
    licencias_path = os.path.join(SALIDAS_T2, "licencias_para_revisar.csv")
    lic_pattern = re.compile(r"acad[eé]mic|investigaci|no[- ]comercial|registro|condicion|permiso|autoriz|licencia|creative commons|solicitud", re.IGNORECASE)
    
    # Whitelist de protocolos autorizados para marcar protocolo_publicado
    VALID_PROTOCOLS = {'reconstruido_verificado', 'presente_fuente_local', 'presente_verificado'}
    EXCLUDED_7 = {'CAE', 'EAS', 'FMPS', 'PANAS', 'RS-14', 'TMMS-24', 'BEAQ'}

    licencias_rows = []
    for r in rows:
        acc = r["acceso"].strip()
        if lic_pattern.search(acc):
            sig = r["sigla"].strip()
            proto = r["protocolo"].strip()
            is_pub = "sí" if (proto in VALID_PROTOCOLS and sig not in EXCLUDED_7) else "no"
            licencias_rows.append({
                "family_id": r["family_id"].strip(),
                "sigla": sig,
                "nombre": r["nombre"].strip(),
                "eje": r["eje"].strip(),
                "acceso": acc,
                "protocolo_publicado": is_pub
            })

    with open(licencias_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["family_id", "sigla", "nombre", "eje", "acceso", "protocolo_publicado"],
            lineterminator="\n"
        )
        writer.writeheader()
        writer.writerows(licencias_rows)

    print(f"   Guardado: {licencias_path} ({len(licencias_rows)} familias con notas de licencia/acceso)")

    # 7. Generar REVISION_ENRIQUE.md (máx. 1 página)
    print("\n8. Generando REVISION_ENRIQUE.md...")
    rev_md_path = os.path.join(SALIDAS_T2, "REVISION_ENRIQUE.md")
    
    # Contar familias por tema (según acuerdos)
    tema_counts = defaultdict(int)
    for r in temas_rows:
        t = r["tema_final"] or "(Pendiente de acuerdo)"
        tema_counts[t] += r["n_familias"]

    # Identificar filas con revisar=1
    filas_revisar = [r for r in temas_rows if r["revisar"] == 1]

    md_content = f"""# Revisión de Propuesta Temática y Poblacional · Psico-Flujo v1.1
**Fecha:** 2026-09-11 · **Responsable:** Enrique Morosini · **Auditoría previa:** Antigravity (Ollama qwen2.5:7b y gemma4:e4b)

Este documento reúne los puntos pendientes de la **Fase B de T2** que requieren tu validación para avanzar con la implementación (Fase C).

---

## 1. Distribución Propuesta de Temas (38 temas cerrados)
* **Total constructos analizados:** {len(temas_rows)} ({len(rows)} familias).
* **Acuerdo directo entre modelos:** {acuerdos_count} constructos ({acuerdos_count/len(temas_rows)*100:.1f}%).
* **Filas para revisión (`revisar=1`):** {len(filas_revisar)} constructos (ver `temas_propuesta.csv`).

### Principales temas por volumen de familias:
"""
    for t, cnt in sorted(tema_counts.items(), key=lambda x: -x[1])[:15]:
        md_content += f"- **{t}**: {cnt} familias\n"
    md_content += "- *(Ver tabla completa en `temas_propuesta.csv` y sinónimos en `sinonimos_propuesta.csv`)*\n\n"

    md_content += """---

## 2. Decisiones Pendientes de Población (T1 & T2)

### A. Los 5 casos de población con `revisar=1` de T1:
Propuesta para aplicar en `data/poblacion_franjas.csv`:
1. `""` (vacío): **Adultos** (o marcar las cuatro franjas si es general).
2. `"Migrantes y minorías étnicas"`: **Adultos** (por contexto de las escalas).
3. `"Pacientes con enfermedades agudas o crónicas"`: **Adultos; Mayores** (contexto hospitalario/médico).
4. `"Pacientes con trastornos psiquiátricos"`: **Adultos** (población clínica general).
5. `"Pacientes oncológicos (y adaptaciones para otras enfermedades crónicas)"`: **Adultos; Mayores**.

### B. Pregunta sobre adultos mayores (65+):
* **Pregunta:** ¿Las familias marcadas en el catálogo maestro solo como *Adultos* cuentan también para la franja *Mayores (65+)*, o deben mantenerse separadas?
* **Contexto actual:** Hoy la franja *Mayores* muestra solo 15 familias porque solo se activó cuando la población original decía explícitamente *mayor*, *anciano*, *geriátrico* o edades $\\ge 65$. Si se asume que *Adultos* cubre 18+, la franja *Mayores* subiría a ~222 familias.

---

## 3. Familias con Condiciones de Licencia (`licencias_para_revisar.csv`)
Se identificaron **74 familias** cuyo campo `acceso` menciona condiciones académicas, de investigación, no comerciales o de registro.
* **Nota:** 50 de ellas tienen actualmente su protocolo publicado por figurar como libre/académico o reconstruido. Si se activa el botón de apoyo/donaciones voluntarias en v1.1, debe confirmarse que el sitio no incurre en uso comercial.

---

## 4. Cómo Aprobar para Iniciar la Fase C
1. Revisa `temas_propuesta.csv` y completa la columna `tema_final` en las filas donde esté vacía o quieras modificar la propuesta.
2. Revisa `sinonimos_propuesta.csv` y ajusta los términos de búsqueda si lo consideras conveniente.
3. Responde a los puntos **2.A** y **2.B** de este documento.
4. Escribe la palabra **`APROBADO`** al final de este archivo y guarda los cambios.
"""

    with open(rev_md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    print(f"   Guardado: {rev_md_path}")
    print("=== PROPUESTA DE TEMAS COMPLETADA CON ÉXITO ===")

if __name__ == "__main__":
    main()
