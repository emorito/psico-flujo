#!/usr/bin/env python3
"""
scripts/reglas_ambitos.py
Clasificador determinista por reglas para asignar ámbitos a las 270 familias
del CATALOGO_MAESTRO.csv sin modificar el archivo fuente.
Genera banco/ambitos_propuesta.csv con las columnas requeridas:
family_id, ambitos, rol_en_ambito, metodo, nivel_uso, cualificacion, baremos_locales, origen_regla, revisar
"""

import os
import sys
import csv
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.dirname(SCRIPT_DIR)
PSICOFLUJO_DIR = os.path.dirname(WEB_DIR)

BANCO_DIR = os.path.join(PSICOFLUJO_DIR, "banco")
CATALOGO_CSV = os.path.join(BANCO_DIR, "CATALOGO_MAESTRO.csv")
OUTPUT_CSV = os.path.join(BANCO_DIR, "ambitos_propuesta.csv")

# Si no está en PsicoFlujo/banco, buscar en Downloads/Instrumentos/BASE_INSTRUMENTAL_FINAL
if not os.path.exists(CATALOGO_CSV):
    alt = "/Users/emorosini/Downloads/Instrumentos/BASE_INSTRUMENTAL_FINAL/CATALOGO_MAESTRO.csv"
    if os.path.exists(alt):
        CATALOGO_CSV = alt

print(f"Leyendo catálogo maestro desde: {CATALOGO_CSV}")

# Exclusiones de cuarentena / histórico si aplica
CUARENTENA_SIGLAS = set()

# Diccionarios de palabras clave y reglas
PALABRAS_EDUCATIVO_POBLACION = [
    r"\bniñ[oa]s?\b", r"\binfantil\b", r"\bescolar(es)?\b", r"\badolescente?s?\b",
    r"\bjóvenes\b", r"\b5 a 18\b", r"\b6 a 1[28]\b", r"\bestudiantes?\b",
    r"\balumnos?\b", r"\beducaci[oó]n\b", r"\bprimaria\b", r"\bsecundaria\b",
    r"\buniversitari[oa]s?\b"
]

PALABRAS_EDUCATIVO_CONSTRUCTO = [
    r"funci[oó]n(es)? ejecutiva(s)?", r"atenci[oó]n", r"aprendizaje",
    r"lectura", r"metacognici[oó]n", r"metas de logro", r"motivaci[oó]n",
    r"madurez", r"visomotor", r"autismo", r"comunicaci[oó]n social",
    r"conducta adaptativa", r"desarrollo", r"hiperactividad", r"impulsividad",
    r"bullying", r"agresi[oó]n", r"ansiedad escolar", r"rechazo escolar",
    r"clima familiar", r"funci[oó]n familiar", r"parental", r"trauma infantil",
    r"adversidad temprana", r"identidad [eé]tnica"
]

PALABRAS_LABORAL_CONSTRUCTO = [
    r"burnout", r"desgaste profesional", r"engagement", r"compromiso laboral",
    r"trabajo", r"ocupacional", r"personalidad", r"metas de logro",
    r"asertividad", r"atenci[oó]n", r"fatiga", r"estr[eé]s percibido",
    r"salud general", r"calidad de vida", r"satisfacci[oó]n", r"tr[ií]ada oscura",
    r"t[eé]trada oscura", r"autoeficacia"
]

PALABRAS_JURIDICO_CONSTRUCTO = [
    r"agresi[oó]n", r"violencia", r"hostilidad", r"ira", r"impulsividad",
    r"trauma", r"postraum[aá]tico", r"secuelas", r"deterioro cognitivo",
    r"demencia", r"capacidad", r"juicio", r"alcohol", r"sustancias",
    r"abuso", r"dependencia", r"personalidad", r"psicopat[ií]a",
    r"adversidad temprana", r"trauma infantil", r"riesgo suicida",
    r"ideaci[oó]n suicida"
]

PALABRAS_SALUD_CONSTRUCTO = [
    r"dolor", r"fatiga", r"sueño", r"insomnio", r"somnolencia", r"apnea",
    r"adherencia", r"medicamentos", r"enfermedad", r"cr[oó]nica",
    r"sensibilidad central", r"catastrofismo", r"deterioro cognitivo",
    r"demencia", r"memoria", r"calidad de vida", r"salud general",
    r"discapacidad", r"sexual", r"efectos secundarios", r"antipsic[oó]ticos"
]

PALABRAS_CULTURAL_CONSTRUCTO = [
    r"aculturaci[oó]n", r"identidad [eé]tnica", r"capital social",
    r"apoyo social", r"alfabetizaci[oó]n en salud", r"minor[ií]as"
]

# Siglas con mapeo explícito consolidado por relevancia clínica / psicométrica
MAPEO_EXPLICITO = {
    # Eje IV específicos
    "CHTE": ["educativo"],
    "BASC-3": ["educativo", "clinico"],
    "KATZ": ["salud"],
    "ZBI": ["salud", "clinico"],
    "EEAG-GAF": ["clinico"],
    "CGI": ["clinico"],
    "SASS": ["clinico", "laboral"],
    "SWBS": ["cultural", "laboral", "clinico"],
    "CD-RISC": ["clinico", "laboral", "educativo"],
    "VIA-IS": ["clinico", "laboral", "educativo"],
    "PWB": ["clinico", "laboral"],
    "FS": ["clinico", "laboral"],

    # Educativo clave
    "BRIEF-2": ["educativo", "clinico"],
    "EFECO": ["educativo", "clinico"],
    "d2-R": ["educativo", "laboral", "clinico"],
    "TMT": ["educativo", "clinico", "salud", "laboral"],
    "Figura de Rey": ["educativo", "clinico", "salud"],
    "Stroop Test": ["educativo", "clinico", "salud"],
    "WCST": ["educativo", "clinico", "salud"],
    "AGQ-R": ["educativo", "laboral"],
    "IMI": ["educativo", "laboral"],
    "APGAR": ["educativo", "clinico", "salud"],
    "ACEQ": ["clinico", "educativo", "juridico"],
    "CTQ-SF": ["clinico", "educativo", "juridico"],
    "MEIM": ["cultural", "educativo"],
    "RMET": ["educativo", "clinico"],
    "DEX-Sp": ["educativo", "clinico", "salud"],
    
    # Laboral clave
    "MBI": ["laboral", "salud"],
    "UWES": ["laboral"],
    "BFI-2": ["laboral", "clinico", "educativo"],
    "SD3": ["laboral", "juridico", "clinico"],
    "SD4": ["laboral", "juridico", "clinico"],
    "RSES": ["clinico", "educativo", "laboral"],
    "GSE": ["laboral", "salud", "clinico"],
    "LOT-R": ["laboral", "salud", "clinico"],
    "SWLS": ["laboral", "salud", "clinico"],
    
    # Jurídico clave
    "AQ": ["juridico", "clinico", "educativo"],
    "BIS-11": ["juridico", "clinico", "educativo"],
    "PCL-5": ["juridico", "clinico"],
    "TOP-8": ["juridico", "clinico"],
    "BDHI": ["juridico", "clinico"],
    "OAS": ["juridico", "clinico"],
    "AUDIT": ["clinico", "juridico", "salud"],
    "DAST-10": ["clinico", "juridico"],
    "MALT": ["clinico", "juridico"],
    
    # Cultural clave
    "VIA": ["cultural"],
    "ECSC-5": ["cultural", "laboral"],
    "SAHLSA-50": ["cultural", "salud"],
    "HLS-EU-Q16": ["cultural", "salud"],
    "MOS-SSS": ["cultural", "salud", "clinico", "educativo"],
    
    # Salud y Neuropsicología clave
    "MoCA": ["salud", "clinico", "juridico"],
    "MMSE": ["salud", "clinico", "juridico"],
    "MEC": ["salud", "clinico", "juridico"],
    "TAVEC": ["salud", "clinico"],
    "ADAS-Cog": ["salud", "clinico"],
    "IFS": ["salud", "clinico", "juridico"],
    "BNT": ["salud", "clinico"],
    "TFV": ["salud", "clinico"],
    "BPI": ["salud", "clinico"],
    "PCS": ["salud", "clinico"],
    "CSI": ["salud", "clinico"],
    "FSS": ["salud", "laboral", "clinico"],
    "ISI": ["salud", "clinico", "laboral"],
    "PSQI": ["salud", "clinico", "laboral"],
    "ESS": ["salud", "laboral", "salud"],
    "STOP-Bang": ["salud", "laboral"],
    "BIPQ": ["salud", "clinico"],
    "CREM-P": ["salud", "clinico"],
    "SEMCD-S": ["salud", "clinico"],
    "SF-36": ["salud", "laboral", "clinico"],
    "WHOQOL-BREF": ["salud", "clinico", "laboral"]
}

def regex_match(patterns, text):
    if not text:
        return False
    for p in patterns:
        if re.search(p, text, re.IGNORECASE):
            return True
    return False

def determinar_metodo(row):
    sigla = row['sigla'].strip()
    constructo = row['constructo'].lower()
    nombre = row['nombre'].lower()
    acceso = row['acceso'].lower()
    
    # Pruebas de ejecución
    if sigla in ["TMT", "d2-R", "Figura de Rey", "Stroop Test", "WCST", "TAVEC", "BNT", "TFV", "IGT"]:
        return "prueba_ejecucion"
    
    # Entrevistas estructuradas / semiestructuradas
    if any(k in nombre for k in ["entrevista", "interview", "scid", "sips", "sops", "mini "]):
        return "entrevista"
        
    # Informe de terceros (heteroadministrado)
    if any(k in constructo for k in ["padres", "profesores", "heteroinforme", "observador"]) or sigla in ["BRIEF-2", "EFECO", "FACES-IV", "APGAR"]:
        if sigla in ["BRIEF-2", "EFECO"]:
            return "informe_terceros"
            
    # Observación clínica
    if any(k in nombre for k in ["escala de observaci", "heteroaplicad"]) or sigla in ["BPRS", "MADRS", "HDRS", "YMRS", "OAS", "UKU", "AIMS"]:
        return "observacion"
        
    return "autoinforme"

def determinar_nivel_uso(row):
    sigla = row['sigla'].strip()
    nombre = row['nombre'].lower()
    
    if any(k in nombre for k in ["screening", "cribado", "breve", "short", "rápida", "screener", "identificación"]):
        return "cribado"
    if sigla in ["PHQ-9", "GAD-7", "AUDIT", "CAGE", "MoCA", "MMSE", "ISI", "STOP-Bang", "APGAR"]:
        return "cribado"
    if any(k in nombre for k in ["batería", "inventario", "diagnóstico", "personality inventory", "structured"]):
        return "diagnostico"
    if sigla in ["BFI-2", "PID-5", "TAVEC", "WCST", "SCID", "DASS-42"]:
        return "diagnostico"
        
    return "cribado" if "escala" in nombre or len(sigla) <= 6 else "seguimiento"

def determinar_cualificacion(row):
    acceso = row['acceso'].lower()
    sigla = row['sigla'].strip()
    
    if "no (" in acceso or "comercial" in acceso or "tea" in acceso or "pearson" in acceso or "copyright" in acceso:
        return "restringido"
    if sigla in ["MoCA", "SCID", "TAVEC", "WCST", "Figura de Rey", "BNT"]:
        return "formacion_especifica"
    return "libre"

def clasificar_familia(row):
    fid = row['family_id'].strip()
    sigla = row['sigla'].strip()
    nombre = row['nombre'].strip()
    eje = row['eje'].strip()
    constructo = row['constructo'].strip()
    poblacion = row['poblacion'].strip()
    acceso = row['acceso'].strip()
    
    # Manejo específico para casos sin población confirmados por Enrique
    if fid == "bss_47":
        poblacion = "Adultos y adolescentes"
    elif fid == "agq-r_92":
        poblacion = "Estudiantes, escolares y adultos"
        
    ambitos = []
    roles = []
    reglas_disparadas = []
    
    # 1. Chequeo de mapeo explícito
    if sigla in MAPEO_EXPLICITO:
        ambitos = list(MAPEO_EXPLICITO[sigla])
        reglas_disparadas.append(f"regla_explicita:{sigla}")
    else:
        # 2. Regla por Ámbito Clínico (Eje I, II, III son por definición clínicos, Eje IV según constructo)
        if eje in ["Eje I", "Eje II", "Eje III"]:
            ambitos.append("clinico")
            reglas_disparadas.append(f"regla_eje_clinico:{eje}")
        elif eje == "Eje IV":
            if any(k in constructo.lower() for k in ["calidad de vida", "discapacidad", "funcionamiento global", "adaptación social", "bienestar", "resiliencia", "sobrecarga", "impresión clínica"]):
                ambitos.append("clinico")
                reglas_disparadas.append("regla_eje_iv_clinico")
            
        # 3. Regla por Ámbito Educativo
        es_pob_educativa = regex_match(PALABRAS_EDUCATIVO_POBLACION, poblacion)
        es_const_educativo = regex_match(PALABRAS_EDUCATIVO_CONSTRUCTO, constructo)
        es_eje_v = (eje == "Eje V")
        
        if (es_pob_educativa and (es_const_educativo or eje in ["Eje I", "Eje II", "Eje V"])) or (es_const_educativo and es_eje_v):
            if "educativo" not in ambitos:
                ambitos.append("educativo")
                reglas_disparadas.append("regla_educativo_constructo_poblacion")
                
        # 4. Regla por Ámbito Laboral
        es_const_laboral = regex_match(PALABRAS_LABORAL_CONSTRUCTO, constructo)
        if es_const_laboral and ("adulto" in poblacion.lower() or "general" in poblacion.lower() or not poblacion):
            if any(k in constructo.lower() for k in ["burnout", "desgaste", "engagement", "laboral", "metas de logro"]):
                if "laboral" not in ambitos:
                    ambitos.append("laboral")
                    reglas_disparadas.append("regla_laboral_especifica")
            elif eje in ["Eje III", "Eje IV", "Eje VI"] and any(k in constructo.lower() for k in ["personalidad", "satisfacci", "bienestar", "fatiga", "calidad de vida"]):
                if "laboral" not in ambitos:
                    ambitos.append("laboral")
                    reglas_disparadas.append("regla_laboral_bienestar")
                    
        # 5. Regla por Ámbito Jurídico / Forense
        es_const_juridico = regex_match(PALABRAS_JURIDICO_CONSTRUCTO, constructo)
        if es_const_juridico and any(k in constructo.lower() for k in ["agresi", "violencia", "trauma", "deterioro cognitivo", "demencia", "alcohol", "sustancias", "impulsividad"]):
            if "juridico" not in ambitos:
                ambitos.append("juridico")
                reglas_disparadas.append("regla_juridico_forense")
                
        # 6. Regla por Ámbito Salud y Neuropsicología
        if eje in ["Eje V", "Eje VI"]:
            if "salud" not in ambitos:
                ambitos.append("salud")
                reglas_disparadas.append(f"regla_salud_eje:{eje}")
        elif regex_match(PALABRAS_SALUD_CONSTRUCTO, constructo):
            if "salud" not in ambitos:
                ambitos.append("salud")
                reglas_disparadas.append("regla_salud_constructo")
                
        # 7. Regla por Ámbito Cultural
        if regex_match(PALABRAS_CULTURAL_CONSTRUCTO, constructo):
            if "cultural" not in ambitos:
                ambitos.append("cultural")
                reglas_disparadas.append("regla_cultural")

    # Si ningún ámbito aplicó por defecto, incluirlo en clinico si tiene eje
    if not ambitos:
        ambitos = ["clinico"]
        reglas_disparadas.append("regla_fallback_clinico")
        revisar = "SI"
    else:
        revisar = "NO"

    # Construir roles según ámbitos asignados
    for amb in ambitos:
        if amb == "educativo":
            if any(k in constructo.lower() for k in ["funci", "atenci", "memoria", "madurez", "visomotor"]):
                roles.append("educativo:evaluacion_neuropsicologica_escolar")
            elif any(k in constructo.lower() for k in ["aprendizaje", "lectura", "metas"]):
                roles.append("educativo:apoyo_aprendizaje")
            elif any(k in constructo.lower() for k in ["familiar", "apgar"]):
                roles.append("educativo:contexto_familiar")
            else:
                roles.append("educativo:cribado_socioemocional")
        elif amb == "clinico":
            roles.append("clinico:evaluacion_sintomatica" if eje == "Eje I" else "clinico:evaluacion_procesos")
        elif amb == "laboral":
            roles.append("laboral:clima_desgaste" if "burnout" in constructo.lower() else "laboral:ajuste_organizacional")
        elif amb == "juridico":
            roles.append("juridico:riesgo_y_secuelas" if "trauma" in constructo.lower() or "agresi" in constructo.lower() else "juridico:capacidad_civil")
        elif amb == "salud":
            roles.append("salud:perfil_neuropsicologico" if eje == "Eje V" else "salud:impacto_medico")
        elif amb == "cultural":
            roles.append("cultural:identidad_y_comunidad")

    metodo = determinar_metodo(row)
    nivel_uso = determinar_nivel_uso(row)
    cualificacion = determinar_cualificacion(row)
    baremos_locales = "no verificado"
    
    return {
        "family_id": fid,
        "ambitos": ";".join(ambitos),
        "rol_en_ambito": ";".join(roles),
        "metodo": metodo,
        "nivel_uso": nivel_uso,
        "cualificacion": cualificacion,
        "baremos_locales": baremos_locales,
        "origen_regla": ";".join(reglas_disparadas),
        "revisar": revisar
    }

def main():
    with open(CATALOGO_CSV, "r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        
    print(f"Total familias a procesar: {len(rows)}")
    
    resultados = []
    conteo_ambitos = {}
    sin_ambito = 0
    multi_ambito = 0
    
    for r in rows:
        clasif = clasificar_familia(r)
        resultados.append(clasif)
        
        amb_list = clasif["ambitos"].split(";") if clasif["ambitos"] else []
        if not amb_list:
            sin_ambito += 1
        elif len(amb_list) > 1:
            multi_ambito += 1
            
        for a in amb_list:
            conteo_ambitos[a] = conteo_ambitos.get(a, 0) + 1
            
    # Guardar en PsicoFlujo/banco/ambitos_propuesta.csv
    fieldnames = [
        "family_id", "ambitos", "rol_en_ambito", "metodo",
        "nivel_uso", "cualificacion", "baremos_locales",
        "origen_regla", "revisar"
    ]
    
    os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)
    with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(resultados)
        
    print(f"\nGuardado exitosamente: {OUTPUT_CSV}")
    print(f"Total filas escritas: {len(resultados)}")
    print("\n--- DISTRIBUCIÓN POR ÁMBITO ---")
    for a, cnt in sorted(conteo_ambitos.items(), key=lambda x: -x[1]):
        print(f"  - {a.capitalize()}: {cnt} familias")
        
    print(f"\nFamilias sin ámbito: {sin_ambito}")
    print(f"Familias con más de un ámbito: {multi_ambito}")
    print(f"Familias marcadas revisar=SI: {sum(1 for r in resultados if r['revisar'] == 'SI')}")

if __name__ == "__main__":
    main()
