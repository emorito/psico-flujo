#!/usr/bin/env python3
"""
scripts/check_public.py
Verificación de integridad y seguridad de archivos públicos:
1. Todo PDF en public/instrumentos pertenece a la lista blanca.
2. 0 protocolos de familias no publicables (incluyendo las 7 no verificadas y las con licencia).
3. Exactamente 231 Ficha_Tecnica.pdf y exactamente 169 Protocolo.pdf (total 400).
4. Todo archivo enlazado en data/catalog.json existe en disco.
5. Todo archivo en disco está registrado en data/catalog.json.
"""

import os
import sys
import json
import csv

REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_DIR = '/Users/emorosini/Downloads/Instrumentos/BASE_INSTRUMENTAL_FINAL'
CATALOG_CSV = os.path.join(BASE_DIR, 'CATALOGO_MAESTRO.csv')
CATALOG_JSON = os.path.join(REPO_DIR, 'data', 'catalog.json')
PUBLIC_INST = os.path.join(REPO_DIR, 'public', 'instrumentos')

VALID_PROTOCOLS = {'reconstruido_verificado', 'presente_fuente_local', 'presente_verificado'}
EXCLUDED_7 = {'CAE', 'EAS', 'FMPS', 'PANAS', 'RS-14', 'TMMS-24', 'BEAQ'}
LICENSED_HOTFIX = {'BAI', 'BDI_II', 'DTS', 'PANSS', 'SOGS', 'UPPS_P'}

def main():
    errors = []
    print("=== INICIANDO AUDITORÍA check_public.py ===")

    # 1. Cargar CSV maestro para lista blanca
    if not os.path.exists(CATALOG_CSV):
        print(f"ERROR: No existe {CATALOG_CSV}")
        sys.exit(1)

    with open(CATALOG_CSV, 'r', encoding='utf-8') as f:
        csv_rows = list(csv.DictReader(f))

    print(f"1. Leídas {len(csv_rows)} familias desde CATALOGO_MAESTRO.csv")
    if len(csv_rows) != 231:
        errors.append(f"Esperadas 231 familias en CSV, encontradas {len(csv_rows)}")

    # Lista blanca de familias autorizadas para protocolo
    whitelist_protocolos = set()
    for row in csv_rows:
        sigla = row['sigla'].strip()
        proto_status = row['protocolo'].strip()
        fid = row['family_id'].strip()
        if proto_status in VALID_PROTOCOLS and sigla not in EXCLUDED_7:
            whitelist_protocolos.add(fid)

    print(f"2. Familias autorizadas para Protocolo.pdf en lista blanca: {len(whitelist_protocolos)}")
    if len(whitelist_protocolos) != 169:
        errors.append(f"Esperadas 169 familias con protocolo en lista blanca, encontradas {len(whitelist_protocolos)}")

    # 2. Cargar catalog.json
    if not os.path.exists(CATALOG_JSON):
        print(f"ERROR: No existe {CATALOG_JSON}")
        sys.exit(1)

    with open(CATALOG_JSON, 'r', encoding='utf-8') as f:
        catalog_items = json.load(f)

    print(f"3. Leídas {len(catalog_items)} familias desde catalog.json")
    if len(catalog_items) != 231:
        errors.append(f"Esperadas 231 familias en catalog.json, encontradas {len(catalog_items)}")

    # 3. Escanear archivos físicos en public/instrumentos
    all_files = []
    fichas = []
    protocolos = []
    otros = []

    for root, dirs, files in os.walk(PUBLIC_INST):
        for file in files:
            if file.startswith('.'):
                continue
            rel_path = os.path.relpath(os.path.join(root, file), PUBLIC_INST)
            full_path = os.path.join(root, file)
            all_files.append((rel_path, full_path, file))
            if file == 'Ficha_Tecnica.pdf':
                fichas.append(rel_path)
            elif file == 'Protocolo.pdf':
                protocolos.append(rel_path)
            else:
                otros.append(rel_path)

    print(f"4. Total archivos físicos en public/instrumentos: {len(all_files)}")
    print(f"   - Ficha_Tecnica.pdf: {len(fichas)}")
    print(f"   - Protocolo.pdf:     {len(protocolos)}")
    if otros:
        print(f"   - Archivos inesperados: {len(otros)}: {otros}")
        errors.append(f"Archivos inesperados en public/instrumentos: {otros}")

    if len(fichas) != 231:
        errors.append(f"Esperadas 231 Ficha_Tecnica.pdf, encontradas {len(fichas)}")
    if len(protocolos) != 169:
        errors.append(f"Esperadas 169 Protocolo.pdf, encontradas {len(protocolos)}")
    if len(all_files) != 400:
        errors.append(f"Esperados 400 archivos en total en public/instrumentos, encontrados {len(all_files)}")

    # 4. Validar que cada Protocolo.pdf físico esté en la lista blanca
    for proto_rel in protocolos:
        # formato: eje-N/family_id/Protocolo.pdf
        parts = proto_rel.split(os.sep)
        if len(parts) != 3:
            errors.append(f"Ruta de protocolo no canónica: {proto_rel}")
            continue
        eje_dir, fid, filename = parts
        if fid not in whitelist_protocolos:
            errors.append(f"VIOLACIÓN DE SEGURIDAD: Protocolo publicado para familia no autorizada: {proto_rel}")

    # 5. Validar que ninguna de las 7 familias excluidas ni los 6 hotfixed tengan Protocolo
    for item in catalog_items:
        sigla = item['sigla']
        fid = item['family_id']
        eje_num = item['eje_num']
        
        # Ficha tecnica debe existir siempre
        expected_ficha = os.path.join(PUBLIC_INST, f"eje-{eje_num}", fid, "Ficha_Tecnica.pdf")
        if not os.path.exists(expected_ficha):
            errors.append(f"Falta Ficha_Tecnica para {fid}: {expected_ficha}")

        expected_proto = os.path.join(PUBLIC_INST, f"eje-{eje_num}", fid, "Protocolo.pdf")
        
        # Familias no verificadas o no descargables
        if sigla in EXCLUDED_7:
            if item['descargable'] is not False:
                errors.append(f"Familia excluida {sigla} figura como descargable=True en catalog.json")
            if os.path.exists(expected_proto):
                errors.append(f"VIOLACIÓN: Protocolo existe para familia excluida {sigla}: {expected_proto}")

        if sigla in LICENSED_HOTFIX:
            if item['descargable'] is not False:
                errors.append(f"Familia con licencia {sigla} figura como descargable=True en catalog.json")
            if os.path.exists(expected_proto):
                errors.append(f"VIOLACIÓN: Protocolo existe para familia con licencia {sigla}: {expected_proto}")

        if item['descargable']:
            if fid not in whitelist_protocolos:
                errors.append(f"Familia {fid} marcada descargable pero no está en whitelist")
            if not os.path.exists(expected_proto):
                errors.append(f"Falta Protocolo para {fid}: {expected_proto}")
            if 'Protocolo.pdf' not in item['archivos']:
                errors.append(f"Protocolo.pdf falta en item['archivos'] de {fid}")
        else:
            if os.path.exists(expected_proto):
                errors.append(f"VIOLACIÓN: Protocolo existe en disco para {fid} no descargable: {expected_proto}")
            if 'Protocolo.pdf' in item['archivos']:
                errors.append(f"Protocolo.pdf no debe estar en archivos de {fid} no descargable")

    # 6. Validar que todos los archivos listados en catalog.json existen
    for item in catalog_items:
        eje_num = item['eje_num']
        fid = item['family_id']
        for arch in item['archivos']:
            p = os.path.join(PUBLIC_INST, f"eje-{eje_num}", fid, arch)
            if not os.path.exists(p):
                errors.append(f"Archivo listado en catalog.json no existe en disco: {p}")

    print("==========================================")
    if errors:
        print(f"AUDITORÍA FALLIDA: {len(errors)} errores detectados:")
        for err in errors:
            print(f"  [ERROR] {err}")
        sys.exit(1)
    else:
        print("AUDITORÍA EXITOSA:")
        print("  ✓ Todo PDF en public/instrumentos pertenece a la lista blanca.")
        print("  ✓ 0 protocolos de familias no publicables (incluyendo las 7 y las licenciadas).")
        print("  ✓ Exactamente 231 Ficha_Tecnica.pdf y 169 Protocolo.pdf (400 PDFs).")
        print("  ✓ Todo archivo enlazado en catalog.json existe en disco.")
        print("  ✓ Ningún archivo huérfano en public/instrumentos.")
        print("check_public.py pasó sin errores.")
        sys.exit(0)

if __name__ == '__main__':
    main()
