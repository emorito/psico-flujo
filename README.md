# psico·flujo

Biblioteca clínica de instrumentos de evaluación psicológica organizados en seis ejes:

1. **Eje I**: Problemas, síntomas y riesgo
2. **Eje II**: Procesos psicológicos
3. **Eje III**: Personalidad, identidad y valores
4. **Eje IV**: Funcionamiento, bienestar y recursos
5. **Eje V**: Funcionamiento cognitivo
6. **Eje VI**: Salud y estilo de vida

## Estructura del Catálogo (v1.3)

- `data/catalog.json`: Metadatos de las 270 familias de instrumentos (500 documentos, 40 temas clínicos).
- `data/ejes.json`: Definición canónica de los 6 ejes clínicos y sus nombres.
- `data/indice_psicoflujo.json`: Índice temático y de búsqueda (40 temas clínicos).
- `public/instrumentos/eje-N/<family_id>/`: Fichas técnicas (271) y protocolos verificados (228).
- `scripts/build_catalog.py`: Script determinista para construir el catálogo y copiar documentos desde la base maestra.
- `scripts/check_public.py`: Verificación de integridad y seguridad de archivos públicos.

## Desarrollo

```bash
# Instalar dependencias
npm install

# Construir catálogo de instrumentos
npm run catalog:build

# Compilar para producción (static export)
npm run build

# Ejecutar suite de pruebas
npm test

# Servir localmente
npx serve out
```

## Aviso clínico

Los instrumentos complementan la entrevista y el juicio clínico. Ninguna escala constituye, por sí sola, un diagnóstico. La plataforma no puntúa ni diagnostica.

---
**Versión**: v1.3 · 2026-09-18
