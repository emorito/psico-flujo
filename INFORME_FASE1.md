# Informe Fase 1 — Diagnóstico y Saneamiento de Psico-Flujo

**Fecha:** 2026-10-14  
**Ejecutor:** Antigravity  
**Repositorio:** `https://github.com/emorito/psico-flujo.git`  
**Ramas creadas:** `saneamiento` en `/Users/emorosini/PsicoFlujo/web` y en `/Users/emorosini/psico-flujo-t1`

---

## 1. Salida de Linter y Compilación (Build)

### 1.1 `PsicoFlujo/web`
* **`npm run lint`**:
  ```
  /Users/emorosini/PsicoFlujo/web/app/ui/instrument-library.tsx
    7:3  warning  'ExternalLink' is defined but never used  @typescript-eslint/no-unused-vars
  ✖ 1 problem (0 errors, 1 warning)
  ```
* **`npm run build`**:
  ```
  ▲ Next.js 16.2.9 (Turbopack)
  Creating an optimized production build ...
  ✓ Compiled successfully in 1219ms
  Finished TypeScript in 917ms
  Collecting page data using 5 workers in 172ms
  ✓ Generating static pages using 5 workers (4/4) in 150ms
  Finalizing page optimization in 524ms
  Route (app): / , /_not-found , /icon.svg (Static prerendered)
  ```
* **Tamaños:**
  * `web/out/`: **122 MB**
  * `web/public/instrumentos/`: **103 MB**

### 1.2 `psico-flujo-t1` (Repositorio vivo en producción)
* **`npm run lint`**: 0 errores, 0 advertencias.
* **`npm run build`**: Compilación estática exitosa en 1023ms.
* **Tamaños:**
  * `t1/out/`: **120 MB**
  * `t1/public/instrumentos/`: **98 MB**

---

## 2. Defecto Conocido A — Ruta absoluta y seguridad de PDFs

1. **Respaldo preventivo e inmutable realizado:**
   * Copia completa preservada en: `~/psico-flujo-respaldos/public-instrumentos-20261014/` (103 MB).
2. **Neutralización de `build_catalog.py`:**
   * `shutil.rmtree(pub_inst)` **comentado y deshabilitado**. El script jamás borrará la carpeta de instrumentos.
   * `BASE_DIR` configurado obligatoriamente por la variable de entorno `PSICOFLUJO_BASE`. Si falta, aborta con mensaje instructivo.
   * Modificado el manejo de archivos: si una ficha o protocolo no se localiza, emite aviso `[AVISO]` y omite en lugar de lanzar `FileNotFoundError`.
   * Agregado soporte dual para nombres canónicos: localiza tanto `Ficha_Tecnica.pdf` como `<SIGLA>_ficha_tecnica.pdf`, y tanto `Protocolo.pdf` como `<SIGLA>_protocolo.pdf`.
3. **Estado de `BASE_INSTRUMENTAL_FINAL`:**
   * Se constató que `/Users/emorosini/Downloads/Instrumentos/BASE_INSTRUMENTAL_FINAL` **sí existe** y contiene las 270 familias organizadas en 6 ejes.
4. **Identificación del Repositorio Vivo:**
   * **`~/psico-flujo-t1`**: Contiene la rama `main` al día (`8cd9d54`), conectada a `origin` en GitHub y sincronizada con Vercel. Tiene implementada la última capa de optimización del 18 de septiembre (buscador reactivo desduplicado, hero optimizado WebP/JPG, pruebas de accesibilidad y 270 familias validadas).
   * **`~/PsicoFlujo/web`**: Clon previo que había quedado 14 commits por detrás en `68ee0ad`. Tenía archivos de sincronización sin confirmar. **Todos fueron asegurados y preservados** en la rama `saneamiento` (commit `b4c2b97`).

---

## 3. Defecto Conocido B — Cifras de Instrumentos

Búsqueda realizada con `grep -rnE "\b(144|231|270)\b"`:
* **En el código de la interfaz (`app/`):** **Cero cifras fijas**. La interfaz lee dinámicamente `catalog.length` y calcula `totalDocuments` a partir de los datos cargados.
* **En `README.md` y `RETOMAR_ORDEN.md` de `psico-flujo-t1`:** Ya reflejan la cifra oficial consolidada: **270 familias** y **500 documentos** en 6 ejes clínicos y 40 temas.

---

## 4. Defecto Conocido C — Duplicados y Consistencia en `CATALOGO_MAESTRO.csv`

Auditoría de solo lectura ejecutada sobre las 270 filas:

| Comprobación | Resultado | Detalle |
|---|---|---|
| `family_id` duplicados | **0** | Todos los 270 identificadores son únicos. |
| Carpetas inexistentes en `BASE_INSTRUMENTAL_FINAL` | **0** | Las 270 carpetas existen físicamente en disco. |
| Carpetas en `PsicoFlujo/banco` | **0 faltantes** | 226 en `banco/Eje N/` y 44 en `banco/comerciales/`. |
| Fichas técnicas declaradas sin archivo | **0** | 100% de las 270 fichas existen en disco. |
| Protocolos declarados sin archivo | **0** | 100% de los 218 protocolos verificados existen en disco. |
| Filas con `poblacion` vacía | **2** | Ver tabla abajo. |
| Filas con `fuente_referencia` vacía | **50** | 50 familias sin URL/referencia explícita en el CSV. |

### Casos puntuales con `poblacion` vacía en el CSV:
| family_id | Sigla | Nombre | Eje | Observación |
|---|---|---|---|---|
| `bss_47` | BSS | Escala de Ideación Suicida de Beck | Eje I | Casilla `poblacion` vacía en CSV maestro |
| `agq-r_92` | AGQ-R | Cuestionario de Metas de Logro Revisado | Eje III | Casilla `poblacion` vacía en CSV maestro |

---

## 5. Prueba de `build_catalog.py` en Entorno Aislado (`/tmp/pf-prueba`)

1. Se copió el proyecto a `/tmp/pf-prueba`.
2. Se ejecutó con `export PSICOFLUJO_BASE=/Users/emorosini/Downloads/Instrumentos/BASE_INSTRUMENTAL_FINAL`.
3. **Resultado:**
   * 270 familias leídas y procesadas en `catalog.json`.
   * 270 fichas técnicas copiadas.
   * 218 protocolos descargables copiados (excluyendo comerciales y restringidos).
   * Total: 488 documentos PDF enlazados.
   * Compilación `npm run build` posterior: **Exitosa sin errores**.
