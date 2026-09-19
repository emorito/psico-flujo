# Diccionario y Guía de Clasificaciones e Indexaciones de la Biblioteca Instrumental

Esta carpeta contiene la **suite oficial de indexaciones y clasificaciones estructuradas** de los **270 instrumentos psicométricos** de la biblioteca clínica (`BASE_INSTRUMENTAL_FINAL`), disponible en formatos duales **`.json`** y **`.csv`**.

---

## 1. Estructura de Archivos Generados

| Archivos (`.json` / `.csv`) | Entidad Principal | Descripción y Utilidad | Cobertura |
| :--- | :--- | :--- | :---: |
| **`catalogo_maestro_clasificado`** | Instrumento (270) | Base de datos maestra unificada con 28 atributos normalizados (autores, adaptación, eje, constructo, tema, modalidad, función, tiempo, población, acceso, etc.). | 270 tests |
| **`index_por_eje`** | Eje Biopsicosocial (6) | Agrupación jerárquica por los 6 Ejes clínicos (Eje I al Eje VI), con subtítulo conceptual, descripción y lista de tests. | 6 ejes (270 tests) |
| **`index_por_tema`** | Tema Clínico (74) | Taxonomía clínica macro (e.g., Ansiedad y fobia, Depresión, Trauma, Demencias, Funciones ejecutivas, Suicidio) con sus sinónimos y tests. | 74 temas |
| **`index_por_constructo`** | Constructo (191) | Mapeo detallado de cada uno de los 191 constructos psicométricos específicos evaluados por los instrumentos. | 191 constructos |
| **`index_por_franja_etaria`** | Franja Etaria (4) | Clasificación por cohorte de edad: `niños` (< 12 años), `adolescentes` (12-18 años), `adultos` (18-65 años) y `mayores` (≥ 65 años / geriatría). | 4 franjas |
| **`index_por_modalidad`** | Formato / Aplicación (4) | Agrupación por tipo de administración: Autoinforme, Heteroaplicado / Entrevista clínica, Rendimiento neurocognitivo / Ejecución, y Observacional. | 4 modalidades |
| **`index_por_funcion_clinica`** | Objetivo Clínico (4) | Clasificación por finalidad: Cribado / Triaje rápido, Diagnóstico y medición de gravedad, Monitoreo de proceso terapéutico, y Evaluación forense / Riesgo. | 4 funciones |
| **`index_por_acceso_licencia`** | Estatuto Legal (3) | Clasificación por derechos: Dominio público / Abierto, Académico libre (clínica/investigación), y Comercial restringido (TEA Ediciones, Pearson, etc.). | 3 categorías |
| **`tesauro_busqueda_sinonimos`** | Descriptor / Keyword (703) | Tesauro léxico cruzado: siglas, diagnósticos DSM-5/CIE-11, síntomas, términos coloquiales y sinónimos mapeados a las siglas y IDs de los tests. | 703 descriptores |

---

## 2. Esquema de Campos: `catalogo_maestro_clasificado`

Cada registro en `catalogo_maestro_clasificado.json` y `catalogo_maestro_clasificado.csv` cuenta con las siguientes columnas:

1. `id`: Identificador único inmutable (ej. `stai_0`, `bdi-ii_12`, `moca_195`, `abs_new`).
2. `sigla`: Sigla oficial o acrónimo internacional del test (ej. `STAI`, `MoCA`, `BDI-II`).
3. `nombre_espanol`: Nombre completo estandarizado en español.
4. `nombre_original`: Denominación oficial original en idioma de procedencia.
5. `autores_originales`: Autores seminales y año de publicación original.
6. `adaptacion_hispana`: Investigadores que lideraron la validación o baremación hispanohablante.
7. `eje_codigo`: Código de Eje (`Eje I` a `Eje VI`).
8. `eje_numero`: Número entero (1 a 6).
9. `eje_nombre`: Denominación formal del Eje.
10. `constructo`: Variable psicopatológica, cognitiva o funcional evaluada.
11. `tema_principal`: Macro-área clínica principal.
12. `temas_secundarios`: Lista de áreas clínicas secundarias o comórbidas asociadas.
13. `sinonimos_busqueda`: Lista de descriptores de búsqueda, diagnósticos y términos equivalentes.
14. `tipo_instrumento_categoria`: `Autoinforme`, `Heteroaplicado / Entrevista clínica`, `Rendimiento neurocognitivo / Tarea de ejecución`, `Observacional / Registro conductual`.
15. `tipo_instrumento_detalle`: Descripción extendida del formato de aplicación extraída de la Ficha Técnica.
16. `funcion_clinica_categoria`: `Cribado / Triaje rápido`, `Diagnóstico y severidad`, `Monitoreo de proceso / Evolución`, `Evaluación pericial forense / Riesgo`.
17. `poblacion`: Definición textual de la población diana original.
18. `franjas_etarias`: Lista de franjas cubiertas (`niños`, `adolescentes`, `adultos`, `mayores`).
19. `tiempo_administracion`: Tiempo promedio o estimado de aplicación (minutos).
20. `formato_respuesta`: Escala de calificación (Likert, Dicotómica Sí/No, Ejecución motriz/gráfica).
21. `acceso_categoria`: `abierto`, `academico`, `comercial`.
22. `regimen_licencia`: Declaración completa sobre derechos de autor y condiciones de uso.
23. `protocolo_disponible`: Booleano indicando si el archivo de protocolo imprimible está disponible localmente.
24. `carpeta_relativa`: Ruta relativa del instrumento dentro de `BASE_INSTRUMENTAL_FINAL`.
25. `archivo_ficha_tecnica`: Nombre del archivo PDF de la Ficha Técnica (verificado en 3 páginas).
26. `archivo_protocolo`: Nombre del archivo PDF del Protocolo (si aplica).
27. `resumen_clinico`: Resumen sinóptico de 1 línea con métricas y alcance clínico.

---

## 3. Ejemplos Rápidos de Uso

### A. Filtrar en Python / Pandas
```python
import pandas as pd

# Cargar catálogo maestro
df = pd.read_csv("catalogo_maestro_clasificado.csv")

# 1. Tests de cribado rápido para adolescentes en Eje I
cribado_ado = df[(df["eje_codigo"] == "Eje I") & 
                 (df["funcion_clinica_categoria"] == "Cribado / Triaje rápido") & 
                 (df["franjas_etarias"].str.contains("adolescentes"))]
print(cribado_ado[["sigla", "nombre_espanol", "tiempo_administracion"]])

# 2. Pruebas neurocognitivas de dominio público o académico
cog_libres = df[(df["tipo_instrumento_categoria"].str.contains("Rendimiento neurocognitivo")) & 
                (df["acceso_categoria"] != "comercial")]
print(cog_libres[["sigla", "constructo", "tiempo_administracion"]])
```

### B. Consultar con `jq` en Terminal
```bash
# Obtener todos los tests del tema "Trauma y estrés postraumático"
jq '.[] | select(.tema == "Trauma y estrés postraumático") | .instrumentos[] | {sigla, nombre, tipo_instrumento}' index_por_tema.json

# Ver tests con protocolo descargable en Eje V
jq '.[] | select(.eje_codigo == "Eje V") | .instrumentos[] | select(.protocolo_disponible == true) | .sigla' index_por_eje.json

# Buscar qué tests responden al término "TOC" o "obsesiones"
jq '.[] | select(.termino_busqueda == "toc") | .tests' tesauro_busqueda_sinonimos.json
```

---

## 4. Ubicación de los Archivos

La suite se encuentra disponible en dos rutas sincronizadas del entorno de trabajo:
1. `/Users/emorosini/Downloads/Instrumentos/CLASIFICACIONES_E_INDEXACIONES/` (Directorio raíz de indexaciones)
2. `/Users/emorosini/Downloads/Instrumentos/BASE_INSTRUMENTAL_FINAL/indices/` (Subdirectorio interno de la base)
