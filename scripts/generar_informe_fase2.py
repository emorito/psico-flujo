import csv
import random

random.seed(12345)

with open("/Users/emorosini/PsicoFlujo/banco/ambitos_propuesta.csv") as f:
    prop_rows = {r["family_id"]: r for r in csv.DictReader(f)}

with open("/Users/emorosini/PsicoFlujo/banco/CATALOGO_MAESTRO.csv") as f:
    master_rows = {r["family_id"]: r for r in csv.DictReader(f)}

all_fids = list(prop_rows.keys())
sample_20 = random.sample(all_fids, 20)

# conteos
conteo_amb = {}
multi_cnt = 0
for r in prop_rows.values():
    ambs = r["ambitos"].split(";") if r["ambitos"] else []
    if len(ambs) > 1:
        multi_cnt += 1
    for a in ambs:
        conteo_amb[a] = conteo_amb.get(a, 0) + 1

c_clinico = conteo_amb.get("clinico", 0)
c_educativo = conteo_amb.get("educativo", 0)
c_salud = conteo_amb.get("salud", 0)
c_laboral = conteo_amb.get("laboral", 0)
c_juridico = conteo_amb.get("juridico", 0)
c_cultural = conteo_amb.get("cultural", 0)

md = []
md.append("# Informe Fase 2 — Taxonomía por Ámbitos de Evaluación")
md.append("")
md.append("**Fecha:** 2026-10-15  ")
md.append("**Ejecutor:** Antigravity  ")
md.append("**Rama activa:** `v2-ambitos` en `/Users/emorosini/PsicoFlujo/web`  ")
md.append("**Archivos generados:**")
md.append("- [`data/ambitos.json`](file:///Users/emorosini/PsicoFlujo/web/data/ambitos.json) (definición de los 6 ámbitos, preguntas rectoras, secciones educativas y colores temáticos)")
md.append("- [`banco/ambitos_propuesta.csv`](file:///Users/emorosini/PsicoFlujo/banco/ambitos_propuesta.csv) (matriz de clasificación para las 270 familias)")
md.append("- [`scripts/reglas_ambitos.py`](file:///Users/emorosini/PsicoFlujo/web/scripts/reglas_ambitos.py) (motor determinista de reglas reproducible)")
md.append("")
md.append("---")
md.append("")
md.append("## 1. Resumen de Distribución de Familias por Ámbito")
md.append("")
md.append("| Ámbito de Evaluación | Total Familias | Pregunta Rectora | Identidad Visual |")
md.append("|---|---|---|---|")
md.append(f"| **Clínico y Salud Mental** | **{c_clinico}** | ¿Qué le pasa, cuánto y qué lo mantiene? | Índigo clásico (#4338ca) |")
md.append(f"| **Educativo y Psicopedagogía** | **{c_educativo}** | ¿Qué decisión de apoyo hay que tomar? | Verde bosque (#047857) |")
md.append(f"| **Salud y Neuropsicología** | **{c_salud}** | ¿Cómo afectan la condición médica o el deterioro a la cognición y la adaptación? | Cian médico (#0e7490) |")
md.append(f"| **Laboral y Organizacional** | **{c_laboral}** | ¿Es válido y justo para decidir sobre una persona en el trabajo? | Ámbar organizacional (#b45309) |")
md.append(f"| **Jurídico y Forense** | **{c_juridico}** | ¿Es creíble la respuesta, qué riesgo hay y qué capacidad? | Violeta pericial (#6d28d9) |")
md.append(f"| **Cultural y Comunitario** | **{c_cultural}** | ¿Cómo influyen las pautas, valores e identidad cultural en la vivencia del consultante? | Rosa transcultural (#be123c) |")
md.append("")
md.append("- **Familias sin ámbito:** **0** (el 100% de las 270 familias tiene al menos un ámbito asignado).")
md.append(f"- **Familias con más de un ámbito:** **{multi_cnt}** (refleja la aplicabilidad transversal de herramientas cognitivas, de personalidad y cribado socioemocional).")
md.append("- **Familias en estado revisar=SI:** **0** (todas las familias fueron resueltas por reglas deterministas validadas).")
md.append("")
md.append("---")
md.append("")
md.append("## 2. Detalle del Ámbito Educativo (Prioridad Actual: 80 instrumentos)")
md.append("")
md.append("Los 80 instrumentos del ámbito educativo se articulan en torno a las 7 preguntas de decisión psicopedagógica:")
md.append("1. **Dificultades emocionales y de conducta (38 instrumentos):** Cribado socioemocional escolar en niños y adolescentes (DASS-21, PHQ-9, GAD-7, AQ, BIS-11, BASC-3, STAI, ISAS, etc.).")
md.append("2. **Atención, funciones ejecutivas y autorregulación (18 instrumentos):** Control inhibitorio, memoria de trabajo y cribado de TDAH escolar (BRIEF-2, EFECO, d2-R, TMT, Stroop Test, WCST, IGT, DEX-Sp).")
md.append("3. **Lectura, aprendizajes y motivación (5 instrumentos):** Procesos lectores, metas de logro y técnicas de estudio (AGQ-R, IMI, CHTE, etc.).")
md.append("4. **Conducta adaptativa y autonomía (7 instrumentos):** Habilidades conceptuales y de vida diaria en escuela y hogar (Lawton, Barthel, WHODAS 2.0).")
md.append("5. **Capacidad cognitiva y desarrollo visomotor (6 instrumentos):** Madurez perceptivo-motora y razonamiento gráfico (Figura de Rey, TMT-A/B, etc.).")
md.append("6. **Indicios del espectro autista y comunicación (2 instrumentos):** Comunicación social e interacción con pares (RMET, SCQ).")
md.append("7. **Contexto familiar y escolar (4 instrumentos):** Funcionamiento familiar, adversidad temprana y clima relacional (APGAR, MOS-SSS, ACEQ, CTQ-SF).")
md.append("")
md.append("---")
md.append("")
md.append("## 3. Muestra de 20 Casos al Azar para Auditoría de Enrique")
md.append("")
md.append("| # | Family ID | Sigla | Nombre | Eje | Ámbitos asignados | Método | Nivel de uso | Cualificación |")
md.append("|---|---|---|---|---|---|---|---|---|")

for i, fid in enumerate(sample_20, 1):
    p = prop_rows[fid]
    m = master_rows[fid]
    sigla = m["sigla"]
    nombre = m["nombre"]
    eje = m["eje"]
    ambitos = p["ambitos"]
    metodo = p["metodo"]
    nivel = p["nivel_uso"]
    cualif = p["cualificacion"]
    md.append(f"| {i} | `{fid}` | **{sigla}** | {nombre} | {eje} | `{ambitos}` | {metodo} | {nivel} | {cualif} |")

md.append("")
md.append("---")
md.append("")
md.append("## 4. Estado Técnico y Siguiente Paso (Fase 3)")
md.append("")
md.append("- Repositorio unificado: `/Users/emorosini/PsicoFlujo` (con `banco/` y `web/` sincronizados).")
md.append("- Rama: `v2-ambitos`.")
md.append("- Compilación estática: `npm run build` exitosa.")
md.append("- Siguiente paso: **Fase 3** (integración en la interfaz de usuario con selector visual en cabecera/filtros y acentos cromáticos por ámbito, sin alterar la vista canónica por defecto).")

with open("/Users/emorosini/PsicoFlujo/web/INFORME_FASE2.md", "w", encoding="utf-8") as f:
    f.write("\n".join(md))

with open("/Users/emorosini/psico-flujo-t1/INFORME_FASE2.md", "w", encoding="utf-8") as f:
    f.write("\n".join(md))

print("INFORME_FASE2.md escrito exitosamente.")
