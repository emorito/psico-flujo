# GUÍA Y ESTADO PARA RETOMAR LA ORDEN — PSICO·FLUJO

> **ESTADO TRAS CONSOLIDACIÓN FINAL (18-Sep-2026):**
> Banco consolidado con **270 familias** y **500 documentos** verificados en `data/catalog.json`, organizados en **6 ejes clínicos** canónicos (`data/ejes.json`) y **40 temas** (`data/indice_psicoflujo.json`).
> Todo el material publicado está en `psico-flujo-t1/public/instrumentos/` (271 fichas y 228 protocolos).

---

## 1. Resumen Ejecutivo del Banco Consolidado (Verificado)

- **Total familias en catálogo maestro:** **270 familias** (comprobado en `data/catalog.json`)
- **Total documentos publicados:** **500 documentos** (271 fichas técnicas, 228 protocolos y 1 complementario; comprobado en `data/catalog.json`)
- **Ejes clínicos:** **6 ejes** (comprobado en `data/ejes.json`):
  1. **Eje I**: Problemas, síntomas y riesgo
  2. **Eje II**: Procesos psicológicos
  3. **Eje III**: Personalidad, identidad y valores
  4. **Eje IV**: Funcionamiento, bienestar y recursos
  5. **Eje V**: Funcionamiento cognitivo
  6. **Eje VI**: Salud y estilo de vida
- **Temas clínicos en índice:** **40 temas** (comprobado en `data/indice_psicoflujo.json`)

---

## 2. Registro de Cifras Históricas de Etapas Previas

*Las siguientes cifras corresponden a minutas de trabajo intermedias de sesiones anteriores y no pueden ser contrastadas de forma unívoca contra los archivos del repositorio actual, por lo que se consignan señalizadas:*

- **Estado previo del banco:** <mark>231 familias en catálogo previo</mark> / <mark>217 familias activas</mark>
  - <mark>Ejes clínicos I al VI previos: 173 familias</mark>
  - <mark>Comerciales aislados previos: 44 familias</mark>
- **Instrumentos en cuarentena previos:** <mark>14 familias</mark>
  - <mark>SIN_DATOS: 7 familias</mark>
  - <mark>ORIGEN_DESCONOCIDO: 6 familias</mark>
  - <mark>DAI: 1 familia</mark>
- **Estado de maquetación preliminar:**
  - <mark>LISTO: 98 instrumentos (79 iniciales + 19 remaquetados)</mark>
  - <mark>CASI: 75 instrumentos pendientes (15 borradores automáticos, 45 Bobes / Seagate, 15 artículos científicos largos)</mark>

---

## 3. Detalle de los 19 Instrumentos Remaquetados y Aprobados (Skill2.md)

Para cada uno se generó: `Protocolo.pdf` (vectorial Typst), `Protocolo.docx` y `Protocolo_Editable.docx` (Word estándar), más `Protocolo.typ` de control:

1. **Eje I (6):**
   - `AQ` (Cuestionario de Agresión, 29 ítems, 4 dimensiones)
   - `BIS-11` (Escala de Impulsividad de Barratt, 30 ítems)
   - `PCL-5` (Lista de Chequeo TEPT DSM-5, 20 ítems)
   - `RPQ` (Cuestionario de Síntomas Postconmocionales de Rivermead, 16 ítems)
   - `WI` (Índice de Whiteley, 7 ítems de ansiedad por la salud)
   - `TOP-8` (Escala de Resultados de Tratamiento para TEPT, 8 ítems)
2. **Eje II (4):**
   - `AAQ-II` (Cuestionario de Aceptación y Acción - II, 7 ítems)
   - `EROS` (Escala de Obtención de Refuerzo del Entorno, 10 ítems)
   - `COPE-48` (Inventario de Estrategias de Afrontamiento, 48 ítems)
   - `MCQ-30` (Cuestionario de Metacogniciones - 30 ítems)
3. **Eje III (2):**
   - `BFI-2` (Inventario de los Cinco Grandes - 2, 60 ítems completos)
   - `MEIM` (Escala Multigrupo de Identidad Étnica, 12 ítems)
4. **Eje IV (1):**
   - `APGAR` (Cuestionario de Función Familiar de Smilkstein, 5 ítems)
5. **Eje VI (6):**
   - `FSS` (Escala de Severidad de Fatiga, 9 ítems)
   - `ISI` (Índice de Severidad del Insomnio, 7 ítems)
   - `SEMCD-S` (Autoeficacia en el Manejo de Enfermedades Crónicas, 6 ítems)
   - `STOP-Bang` (Cuestionario de Riesgo de Apnea del Sueño, 8 ítems)
   - `CREM-P` (Cuestionario de Creencias sobre Medicamentos, 16 ítems)
   - `CSI` (Índice de Sensibilidad Central, 25 ítems)

*Nota: Los originales descartados de estos 19 quedaron respaldados en `/Users/emorosini/PsicoFlujo/cuarentena/borradores_automaticos/`.*

---

## 4. Trabajo Pendiente Documentado Históricamente

### A. Borradores Automáticos Anotados
1. `ACEQ` (Adverse Childhood Experiences Questionnaire, 10 ítems)
2. `MLQ` (Meaning in Life Questionnaire, 10 ítems)
3. `BIPQ` (Brief Illness Perception Questionnaire, 8 ítems)
4. `MOS-SSS` (Medical Outcomes Study Social Support Survey, 19 ítems)
5. `eHEALS` (eHealth Literacy Scale, 8 ítems)
6. `TMT` (Trail Making Test, partes A y B, tareas gráficas)
7. `IPAQ` (International Physical Activity Questionnaire, 7 ítems)
8. `MEQ-SA` (Morningness-Eveningness Questionnaire, 19 ítems)
9. `WHODAS 2.0` (World Health Organization Disability Assessment Schedule, 12 ítems)
10. `SF-36` (Cuestionario de Salud SF-36, 36 ítems en 8 escalas)
11. `MAIA` (Multidimensional Assessment of Interoceptive Awareness, 32 ítems)
12. `Y-BOCS` (Yale-Brown Obsessive Compulsive Scale, lista de síntomas + 10 ítems de severidad)
13. `FTND` (Fagerström Test for Nicotine Dependence, 6 ítems)
14. `ISAS` (Inventory of Statements About Self-Injury, 39 ítems)
15. `Escala de Lawton` (Escala de Actividades Instrumentales de la Vida Diaria, 8 ítems)

### B. Referencias a Instrumentos Bobes / Seagate
- <mark>Ubicación histórica referenciada: /Users/emorosini/Downloads/Instrumentos/tmp/DISCO_SEAGATE_98/</mark>

### C. Referencias a Artículos Científicos Largos
- <mark>45 de Bobes y 15 artículos científicos de etapas previas</mark>

---

## 5. Herramientas y Scripts Disponibles

- `herramientas/protocolo_base.typ`: Plantilla tipográfica Typst oficial con membrete institucional, tablas compactas, sombreado alterno y casillas de verificación.
- `herramientas/compilar_borradores_skill2.py`: Motor automatizado de renderizado Typst + python-docx.
- `herramientas/ejecutar_compilacion_lote_34.py`: Script que contiene la carga de datos de los borradores y su compilación en lote.
- `herramientas/sincronizar_banco_a_public.py`: Script determinista que copia `banco/` hacia `psico-flujo-t1/public/instrumentos/` y actualiza `data/catalog.json`.

---

## 6. Procedimiento para Retomar y Salir de Mantenimiento

1. **Continuar compilación de borradores:**
   Completar los 15 instrumentos restantes en `ejecutar_compilacion_lote_34.py` y correr:
   ```bash
   python3 /Users/emorosini/PsicoFlujo/herramientas/ejecutar_compilacion_lote_34.py
   ```
2. **Sincronizar hacia la Web:**
   ```bash
   python3 /Users/emorosini/PsicoFlujo/herramientas/sincronizar_banco_a_public.py
   ```
3. **Validación final:**
   Verificar en `https://psico-flujo.vercel.app` que los instrumentos y filtros operen correctamente.
