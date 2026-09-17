# GUÍA Y ESTADO PARA RETOMAR LA ORDEN — PSICO·FLUJO

> **ESTADO AL MOMENTO DE PAUSA (17-Sep-2026):**
> Se ordenó **PAUSAR TODO** tras consolidar la Fase 2, auditar la Fase 3 y completar el remaquetado de **19 de los 34 borradores automáticos** al estándar Skill2.md.
> Todo el material producido fue incorporado a `PsicoFlujo/banco/`, sincronizado a `psico-flujo-t1/public/instrumentos/` y desplegado en vivo en Vercel.

---

## 1. Resumen Ejecutivo del Banco Consolidado

- **Total familias en catálogo maestro:** **231 familias**
- **Instrumentos en banco activo (`PsicoFlujo/banco/`):** **217 familias**
  - **Ejes clínicos I al VI:** **173 familias** (todas con `Ficha_Tecnica.pdf` y `Protocolo.pdf`)
  - **Comerciales aislados (`banco/comerciales/`):** **44 familias** (con `Ficha_Tecnica.pdf` y `Fuente_y_uso.md` con enlaces oficiales; sin protocolos por copyright)
- **Instrumentos excluidos / en cuarentena:** **14 familias**
  - **SIN_DATOS:** 7 familias sin archivo rastreable local ni remoto.
  - **ORIGEN_DESCONOCIDO:** 6 familias que fallaron la validación textual.
  - **DAI:** 1 familia cuyo archivo rotulado DAI contenía la PANSS (comercial MHS).

---

## 2. Estado de Calidad y Maquetación (Fase 3 - Lote 1)

Tras realizar la auditoría visual y de metadata cruzada sobre el banco, se demostró que la auditoría previa basada en regex era un falso cuello de botella: 79 protocolos ya eran maquetaciones finales de excelencia (Enrique Morosini / Arturo Bados).

### Estado actual de las 173 familias de los Ejes:
- **LISTO (98 instrumentos):** Cumplen 100% con ítems reales, formato Skill2.md (membrete formal, tabla tipográfica, opciones de respuesta limpias, casillas cuadradas, pie editorial).
  - **79 iniciales:** Línea base verificada visualmente.
  - **19 remaquetados en esta sesión:** Transformados con el motor Typst + python-docx.
- **CASI (75 instrumentos pendientes):**
  - **15 Borradores automáticos restantes** (detallados abajo).
  - **45 Bobes / Seagate** (requieren recorte/extracción directa de páginas limpias del libro o archivo fuente).
  - **15 Artículos científicos largos** (requieren extracción de las páginas de cuestionario anexo).

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

## 4. Trabajo Pendiente para la Próxima Sesión

### A. Los 15 Borradores Automáticos Restantes (Prioridad Inmediata)
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

### B. Los 45 Instrumentos de Bobes / Seagate
- Ubicación de fuentes reales: `/Users/emorosini/Downloads/Instrumentos/tmp/DISCO_SEAGATE_98/`
- Tarea: Para cada uno de los 45, extraer o recortar el cuestionario real limpio a `Protocolo.pdf` en `banco/<Eje>/<instrumento>/`.

### C. Los 15 Artículos Científicos Largos
- Ubicación de fuentes: `banco/<Eje>/<Familia>/`
- Tarea: Recortar las páginas finales donde está impreso el anexo o escala original, reemplazando el PDF del artículo completo por el protocolo administrable.

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
3. **Reactivar la interfaz pública (desactivar mantenimiento):**
   Cuando se decida abrir nuevamente el catálogo al público, restaurar `app/page.tsx` en `psico-flujo-t1`:
   ```bash
   cd /Users/emorosini/psico-flujo-t1
   git checkout 68ee0ad^ -- app/page.tsx
   git add app/page.tsx
   git commit -m "feat: reactivar catálogo tras consolidación"
   git push origin main
   ```
4. **Validación final:**
   Verificar en `https://psico-flujo.vercel.app` que los instrumentos y filtros operen correctamente.
