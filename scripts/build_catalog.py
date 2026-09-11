#!/usr/bin/env python3
"""
scripts/build_catalog.py
Lee BASE_INSTRUMENTAL_FINAL/CATALOGO_MAESTRO.csv y genera:
1. data/catalog.json (las 231 familias con metadatos y lista de archivos)
2. data/poblacion_franjas.csv (mapeo determinista poblacion -> franjas)
3. public/instrumentos/eje-N/<family_id>/ (231 Ficha_Tecnica.pdf y 169 Protocolo.pdf)
"""

import os
import csv
import json
import shutil
import re

REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_DIR = '/Users/emorosini/Downloads/Instrumentos/BASE_INSTRUMENTAL_FINAL'
CATALOGO_CSV = os.path.join(BASE_DIR, 'CATALOGO_MAESTRO.csv')

VALID_PROTOCOLS = {'reconstruido_verificado', 'presente_fuente_local', 'presente_verificado'}
EXCLUDED_7 = {'CAE', 'EAS', 'FMPS', 'PANAS', 'RS-14', 'TMMS-24', 'BEAQ'}

EJE_MAP = {
    'Eje I': 1,
    'Eje II': 2,
    'Eje III': 3,
    'Eje IV': 4,
    'Eje V': 5,
    'Eje VI': 6,
}

EJE1_DESCRIPTIONS = {
  "assist": "Explora el consumo y el riesgo asociado a distintas sustancias psicoactivas.",
  "audit": "Detecta patrones de consumo de alcohol de riesgo, perjudicial o con posible dependencia.",
  "bai": "Estima la intensidad de síntomas de ansiedad, con énfasis en manifestaciones somáticas.",
  "bdi-ii": "Valora la presencia y severidad de síntomas cognitivos, afectivos y somáticos de depresión.",
  "bis-11": "Evalúa impulsividad atencional, motora y no planificada.",
  "bsl-23": "Cuantifica el malestar y los síntomas asociados al trastorno límite de la personalidad.",
  "cape-42": "Explora experiencias psicóticas positivas, negativas y depresivas en población general.",
  "ces-d": "Detecta frecuencia reciente de síntomas depresivos en población general.",
  "c-ssrs": "Explora ideación, intensidad, conducta suicida y nivel de riesgo en distintos momentos clínicos.",
  "cubi-18": "Indaga experiencias vinculadas con intimidación, victimización y violencia entre pares.",
  "dass-21": "Ofrece una medida breve de tres dimensiones de malestar emocional.",
  "dast-10": "Identifica consecuencias y problemas relacionados con el uso de drogas distintas del alcohol.",
  "dbd": "Explora síntomas de inatención, hiperactividad, oposicionismo y problemas de conducta.",
  "dii": "Evalúa intensidad, frecuencia y expresión problemática de la ira.",
  "docs": "Valora gravedad de contaminación, responsabilidad, pensamientos inaceptables y simetría.",
  "dts": "Mide frecuencia y gravedad de síntomas postraumáticos.",
  "egs-r": "Explora síntomas de estrés postraumático y afectación asociada tras un evento traumático.",
  "eie-r": "Evalúa intrusión, evitación e hiperactivación relacionadas con experiencias estresantes.",
  "ers": "Apoya la exploración estructurada de factores asociados al riesgo de conducta violenta.",
  "gad-7": "Detecta y gradúa síntomas centrales de ansiedad generalizada durante las últimas dos semanas.",
  "hai": "Explora preocupación por la salud, vigilancia corporal y temor a la enfermedad.",
  "ham-d": "Valora mediante entrevista clínica la severidad de síntomas depresivos.",
  "iat": "Explora uso problemático de Internet y su interferencia en la vida cotidiana.",
  "ip": "Evalúa pensamientos intrusivos, impulsos, comprobación, contaminación y compulsiones.",
  "isas": "Indaga frecuencia, métodos y funciones de las autolesiones no suicidas.",
  "jvq": "Registra múltiples formas de victimización y exposición a violencia en jóvenes.",
  "oci-r": "Mide malestar asociado a seis grupos frecuentes de síntomas obsesivo-compulsivos.",
  "panss": "Valora síntomas positivos, negativos y psicopatología general en trastornos psicóticos.",
  "pcl-5": "Explora los grupos sintomáticos del trastorno de estrés postraumático según DSM-5.",
  "pdi-21": "Evalúa experiencias de tipo delirante y su malestar, preocupación y convicción asociados.",
  "phq-15": "Cuantifica la carga de síntomas somáticos frecuentes y su severidad.",
  "phq-9": "Detecta síntomas depresivos y permite seguir su severidad en las últimas dos semanas.",
  "pss": "Reúne versiones para valorar cuánto se perciben las situaciones recientes como impredecibles o desbordantes.",
  "pss-10": "Mide de forma breve la percepción de falta de control y sobrecarga durante el último mes.",
  "pss-14": "Evalúa estrés percibido mediante la versión extensa de catorce reactivos.",
  "pswq": "Mide intensidad, generalidad y dificultad para controlar la preocupación.",
  "sads": "Explora malestar y evitación en situaciones de interacción social.",
  "sdq": "Ofrece un perfil breve de dificultades emocionales y conductuales, pares y conducta prosocial.",
  "shaps": "Evalúa la capacidad para experimentar placer y detectar anhedonia.",
  "sias": "Mide temor y malestar durante interacciones y encuentros sociales.",
  "sogs": "Detecta patrones problemáticos de juego y sus consecuencias.",
  "upps-p": "Perfila urgencia, falta de perseverancia, falta de premeditación y búsqueda de sensaciones.",
  "y-bocs": "Cuantifica severidad, interferencia, malestar, resistencia y control de obsesiones y compulsiones."
}

EJE1_USES = {
  "assist": "Tamizaje de consumo",
  "audit": "Tamizaje de alcohol",
  "bai": "Severidad de ansiedad",
  "bdi-ii": "Severidad depresiva",
  "bis-11": "Perfil de impulsividad",
  "bsl-23": "Monitoreo sintomático",
  "cape-42": "Tamizaje dimensional",
  "ces-d": "Tamizaje depresivo",
  "c-ssrs": "Evaluación de riesgo",
  "cubi-18": "Detección de bullying",
  "dass-21": "Perfil de malestar",
  "dast-10": "Tamizaje de drogas",
  "dbd": "Tamizaje infantojuvenil",
  "dii": "Perfil de ira",
  "docs": "Severidad de TOC",
  "dts": "Severidad postraumática",
  "egs-r": "Evaluación postraumática",
  "eie-r": "Impacto del trauma",
  "ers": "Valoración de riesgo",
  "gad-7": "Tamizaje breve",
  "hai": "Ansiedad por la salud",
  "ham-d": "Evaluación heteroaplicada",
  "iat": "Conducta adictiva",
  "ip": "Síntomas obsesivos",
  "isas": "Evaluación de autolesión",
  "jvq": "Historia de victimización",
  "oci-r": "Tamizaje de TOC",
  "panss": "Perfil psicótico",
  "pcl-5": "Tamizaje de TEPT",
  "pdi-21": "Experiencias delirantes",
  "phq-15": "Tamizaje somático",
  "phq-9": "Tamizaje depresivo",
  "pss": "Estrés percibido",
  "pss-10": "Tamizaje de estrés",
  "pss-14": "Evaluación de estrés",
  "pswq": "Preocupación patológica",
  "sads": "Ansiedad social",
  "sdq": "Tamizaje infantojuvenil",
  "shaps": "Medición de anhedonia",
  "sias": "Ansiedad social",
  "sogs": "Tamizaje de juego",
  "upps-p": "Perfil de impulsividad",
  "y-bocs": "Severidad de TOC"
}

def map_franjas(pob_text):
    t = pob_text.lower().strip()
    franjas = []
    has_age_mention = False
    
    if "todas las edades" in t or "6 a 89" in t or "8 a 80" in t:
        return ["niños", "adolescentes", "adultos", "mayores"], 0
        
    # Niños (<13)
    if any(k in t for k in ["niñ", "infan", "escolar", "primaria", "1.5-5", "3-16", "3 a 18", "5 a 18"]):
        franjas.append("niños")
        has_age_mention = True
        
    # Adolescentes (13-17)
    if any(k in t for k in ["adolesc", "secundaria", "13 años", ">13", "16 años", ">16", "12 anos", "12 años", "3 a 18", "5 a 18", "3-16", "6-18", "pid-5-irf", "via-youth", "jóvenes", "joven"]):
        franjas.append("adolescentes")
        has_age_mention = True
        
    # Adultos (18-64)
    if any(k in t for k in ["adult", "trabajador", "padres", "pareja", "matrimonio", "15-69", "18-65", "universitarios"]):
        franjas.append("adultos")
        has_age_mention = True
        
    # Mayores (65+)
    if any(k in t for k in ["mayor", "geriátr", "ancian", "demencia", "alzheimer"]):
        franjas.append("mayores")
        has_age_mention = True
        
    if not franjas or not has_age_mention:
        return ["adultos"], 1
        
    return franjas, 0

def main():
    print(f'Leyendo catálogo desde: {CATALOGO_CSV}')
    with open(CATALOGO_CSV, 'r', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    print(f'Total familias leídas: {len(rows)}')
    
    eje1_desc, eje1_use = EJE1_DESCRIPTIONS, EJE1_USES
    print(f'Metadatos existentes de Eje 1 cargados: {len(eje1_desc)}')
    
    # Preparamos data/poblacion_franjas.csv
    unique_pobs = sorted(list(set(r['poblacion'].strip() for r in rows)))
    pob_csv_rows = []
    for p in unique_pobs:
        frs, rev = map_franjas(p)
        pob_csv_rows.append({
            'poblacion_original': p,
            'franjas': ';'.join(frs),
            'revisar': rev
        })
    
    data_dir = os.path.join(REPO_DIR, 'data')
    os.makedirs(data_dir, exist_ok=True)
    pob_csv_path = os.path.join(data_dir, 'poblacion_franjas.csv')
    with open(pob_csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['poblacion_original', 'franjas', 'revisar'], lineterminator='\n')
        writer.writeheader()
        writer.writerows(pob_csv_rows)
    print(f'Guardado: {pob_csv_path} ({len(pob_csv_rows)} filas)')
    
    # Limpiar public/instrumentos
    pub_inst = os.path.join(REPO_DIR, 'public/instrumentos')
    if os.path.exists(pub_inst):
        shutil.rmtree(pub_inst)
    os.makedirs(pub_inst, exist_ok=True)
    
    catalog_items = []
    copied_fichas = 0
    copied_protocolos = 0
    
    for r in rows:
        fid = r['family_id'].strip()
        eje_raw = r['eje'].strip()
        eje_num = EJE_MAP.get(eje_raw, 1)
        sigla = r['sigla'].strip()
        nombre = r['nombre'].strip()
        constructo = r['constructo'].strip()
        poblacion = r['poblacion'].strip()
        acceso = r['acceso'].strip()
        proto_status = r['protocolo'].strip()
        carpeta = r['carpeta'].strip()
        
        is_descargable = (proto_status in VALID_PROTOCOLS and sigla not in EXCLUDED_7)
        franjas, _ = map_franjas(poblacion)
        
        # Meta description and use
        norm_sigla = sigla.lower()
        if norm_sigla in eje1_desc and eje_num == 1:
            description = eje1_desc[norm_sigla]
            use = eje1_use.get(norm_sigla, constructo)
        else:
            description = constructo
            use = poblacion if poblacion else 'Población general'
            
        # Target directory: public/instrumentos/eje-N/<family_id>/
        fam_dir = os.path.join(pub_inst, f'eje-{eje_num}', fid)
        os.makedirs(fam_dir, exist_ok=True)
        
        # Ficha tecnica
        src_ficha = os.path.join(BASE_DIR, carpeta, 'Ficha_Tecnica.pdf')
        if not os.path.exists(src_ficha):
            raise FileNotFoundError(f'Ficha técnica no encontrada para {fid}: {src_ficha}')
        dst_ficha = os.path.join(fam_dir, 'Ficha_Tecnica.pdf')
        shutil.copy2(src_ficha, dst_ficha)
        copied_fichas += 1
        
        archivos = ['Ficha_Tecnica.pdf']
        
        # Protocolo
        if is_descargable:
            src_proto = os.path.join(BASE_DIR, carpeta, 'Protocolo.pdf')
            if not os.path.exists(src_proto):
                raise FileNotFoundError(f'Protocolo no encontrado para {fid}: {src_proto}')
            dst_proto = os.path.join(fam_dir, 'Protocolo.pdf')
            shutil.copy2(src_proto, dst_proto)
            copied_protocolos += 1
            archivos.append('Protocolo.pdf')
            
        catalog_items.append({
            'family_id': fid,
            'eje': eje_raw,
            'eje_num': eje_num,
            'sigla': sigla,
            'nombre': nombre,
            'constructo': constructo,
            'poblacion': poblacion,
            'franjas': franjas,
            'acceso': acceso,
            'descargable': is_descargable,
            'archivos': archivos,
            'description': description,
            'use': use
        })
        
    catalog_json_path = os.path.join(REPO_DIR, 'data', 'catalog.json')
    with open(catalog_json_path, 'w', encoding='utf-8') as f:
        json.dump(catalog_items, f, indent=2, ensure_ascii=False)
        f.write('\n')
        
    print(f'Guardado: {catalog_json_path} ({len(catalog_items)} familias)')
    print(f'Fichas copiadas: {copied_fichas}')
    print(f'Protocolos copiados: {copied_protocolos}')
    print(f'Total PDFs en public/instrumentos: {copied_fichas + copied_protocolos}')
    print('Construcción del catálogo finalizada con éxito.')

if __name__ == '__main__':
    main()
