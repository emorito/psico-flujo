# Informe Fase 2 — Taxonomía por Ámbitos de Evaluación

**Fecha:** 2026-10-15  
**Ejecutor:** Antigravity  
**Rama activa:** `v2-ambitos` en `/Users/emorosini/PsicoFlujo/web`  
**Archivos generados:**
- [`data/ambitos.json`](file:///Users/emorosini/PsicoFlujo/web/data/ambitos.json) (definición de los 6 ámbitos, preguntas rectoras, secciones educativas y colores temáticos)
- [`banco/ambitos_propuesta.csv`](file:///Users/emorosini/PsicoFlujo/banco/ambitos_propuesta.csv) (matriz de clasificación para las 270 familias)
- [`scripts/reglas_ambitos.py`](file:///Users/emorosini/PsicoFlujo/web/scripts/reglas_ambitos.py) (motor determinista de reglas reproducible)

---

## 1. Resumen de Distribución de Familias por Ámbito

| Ámbito de Evaluación | Total Familias | Pregunta Rectora | Identidad Visual |
|---|---|---|---|
| **Clínico y Salud Mental** | **229** | ¿Qué le pasa, cuánto y qué lo mantiene? | Índigo clásico (#4338ca) |
| **Educativo y Psicopedagogía** | **80** | ¿Qué decisión de apoyo hay que tomar? | Verde bosque (#047857) |
| **Salud y Neuropsicología** | **76** | ¿Cómo afectan la condición médica o el deterioro a la cognición y la adaptación? | Cian médico (#0e7490) |
| **Laboral y Organizacional** | **40** | ¿Es válido y justo para decidir sobre una persona en el trabajo? | Ámbar organizacional (#b45309) |
| **Jurídico y Forense** | **36** | ¿Es creíble la respuesta, qué riesgo hay y qué capacidad? | Violeta pericial (#6d28d9) |
| **Cultural y Comunitario** | **8** | ¿Cómo influyen las pautas, valores e identidad cultural en la vivencia del consultante? | Rosa transcultural (#be123c) |

- **Familias sin ámbito:** **0** (el 100% de las 270 familias tiene al menos un ámbito asignado).
- **Familias con más de un ámbito:** **156** (refleja la aplicabilidad transversal de herramientas cognitivas, de personalidad y cribado socioemocional).
- **Familias en estado revisar=SI:** **0** (todas las familias fueron resueltas por reglas deterministas validadas).

---

## 2. Detalle del Ámbito Educativo (Prioridad Actual: 80 instrumentos)

Los 80 instrumentos del ámbito educativo se articulan en torno a las 7 preguntas de decisión psicopedagógica:
1. **Dificultades emocionales y de conducta (38 instrumentos):** Cribado socioemocional escolar en niños y adolescentes (DASS-21, PHQ-9, GAD-7, AQ, BIS-11, BASC-3, STAI, ISAS, etc.).
2. **Atención, funciones ejecutivas y autorregulación (18 instrumentos):** Control inhibitorio, memoria de trabajo y cribado de TDAH escolar (BRIEF-2, EFECO, d2-R, TMT, Stroop Test, WCST, IGT, DEX-Sp).
3. **Lectura, aprendizajes y motivación (5 instrumentos):** Procesos lectores, metas de logro y técnicas de estudio (AGQ-R, IMI, CHTE, etc.).
4. **Conducta adaptativa y autonomía (7 instrumentos):** Habilidades conceptuales y de vida diaria en escuela y hogar (Lawton, Barthel, WHODAS 2.0).
5. **Capacidad cognitiva y desarrollo visomotor (6 instrumentos):** Madurez perceptivo-motora y razonamiento gráfico (Figura de Rey, TMT-A/B, etc.).
6. **Indicios del espectro autista y comunicación (2 instrumentos):** Comunicación social e interacción con pares (RMET, SCQ).
7. **Contexto familiar y escolar (4 instrumentos):** Funcionamiento familiar, adversidad temprana y clima relacional (APGAR, MOS-SSS, ACEQ, CTQ-SF).

---

## 3. Muestra de 20 Casos al Azar para Auditoría de Enrique

| # | Family ID | Sigla | Nombre | Eje | Ámbitos asignados | Método | Nivel de uso | Cualificación |
|---|---|---|---|---|---|---|---|---|
| 1 | `cos_203` | **COS** | Cuestionario Oviedo de Calidad del Sueño | Eje VI | `salud` | autoinforme | cribado | libre |
| 2 | `dass-21_5` | **DASS-21** | Escalas de Depresión, Ansiedad y Estrés - 21 | Eje I | `clinico;educativo` | autoinforme | cribado | libre |
| 3 | `ftnd_new1` | **FTND** | Test de Fagerström de Dependencia de la Nicotina | Eje VI | `salud` | autoinforme | cribado | libre |
| 4 | `madrs_178` | **MADRS** | Montgomery-Asberg Depression Rating Scale | Eje I | `clinico` | observacion | cribado | libre |
| 5 | `escala_de_lawton_102` | **Escala de Lawton** | Escala de Lawton y Brody | Eje IV | `clinico;salud` | autoinforme | cribado | libre |
| 6 | `mgl_o_mmas-4_142` | **MGL o MMAS-4** | Cuestionario de Adherencia a la Medicación de Morisky-Green-Levine | Eje VI | `salud` | autoinforme | seguimiento | libre |
| 7 | `sass_213` | **SASS** | Social Adaptation Self-evaluation Scale | Eje IV | `clinico;laboral` | autoinforme | cribado | libre |
| 8 | `rses_84` | **RSES** | Escala de Autoestima de Rosenberg | Eje III | `clinico;educativo;laboral;vocacional` | autoinforme | cribado | libre |
| 9 | `mdq_181` | **MDQ** | Mood Disorder Questionnaire | Eje I | `clinico` | autoinforme | cribado | restringido |
| 10 | `bads_64` | **BADS** | Escala de Activación Conductual para la Depresión | Eje II | `clinico` | autoinforme | cribado | libre |
| 11 | `eeaggaf_211` | **EEAG-GAF** | Escala de Evaluación de la Actividad Global | Eje IV | `clinico` | autoinforme | cribado | libre |
| 12 | `ess_137` | **ESS** | Escala de Somnolencia de Epworth | Eje VI | `salud;laboral;deporte` | autoinforme | cribado | libre |
| 13 | `imi_91` | **IMI** | Inventario de Motivación Intrínseca | Eje III | `educativo;vocacional;laboral;deporte` | autoinforme | diagnostico | libre |
| 14 | `ismi_98` | **ISMI** | Escala de Estigma Internalizado de la Enfermedad Mental | Eje III | `clinico` | autoinforme | cribado | libre |
| 15 | `mec_171` | **MEC** | Mini-Examen Cognoscitivo de Lobo | Eje V | `salud;clinico;juridico` | autoinforme | cribado | libre |
| 16 | `bss_47` | **BSS** | Escala de Ideación Suicida de Beck | Eje I | `clinico;educativo` | autoinforme | cribado | restringido |
| 17 | `edi2_201` | **EDI-2** | Inventario de Trastornos de la Conducta Alimentaria-2 | Eje I | `clinico` | autoinforme | diagnostico | libre |
| 18 | `swbs_new` | **SWBS** | Escala de Bienestar Social de Keyes | Eje IV | `cultural;laboral;clinico` | autoinforme | cribado | libre |
| 19 | `sccs_87` | **SCCS** | Escala de Claridad del Autoconcepto | Eje III | `clinico;vocacional` | autoinforme | cribado | libre |
| 20 | `bfi-2_77` | **BFI-2** | Inventario de los Cinco Grandes 2 | Eje III | `laboral;clinico;educativo;vocacional` | autoinforme | diagnostico | libre |

---

## 4. Estado Técnico y Siguiente Paso (Fase 3)

- Repositorio unificado: `/Users/emorosini/PsicoFlujo` (con `banco/` y `web/` sincronizados).
- Rama: `v2-ambitos`.
- Compilación estática: `npm run build` exitosa.
- Siguiente paso: **Fase 3** (integración en la interfaz de usuario con selector visual en cabecera/filtros y acentos cromáticos por ámbito, sin alterar la vista canónica por defecto).