# psico·flujo

Biblioteca clínica de instrumentos de evaluación psicológica organizados en seis ejes:

1. **Eje I**: Problemas, síntomas y riesgo
2. **Eje II**: Procesos psicológicos
3. **Eje III**: Características de la persona
4. **Eje IV**: Funcionamiento y recursos
5. **Eje V**: Funcionamiento cognitivo
6. **Eje VI**: Salud y estilo de vida

## Estructura del Catálogo (v1)

- `data/catalog.json`: Metadatos de las 231 familias de instrumentos.
- `public/instrumentos/eje-N/<family_id>/`: Fichas técnicas (231) y protocolos verificados (169).
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

# Servir localmente
npx serve out
```

## Aviso clínico

Los instrumentos complementan la entrevista y el juicio clínico. Ninguna escala constituye, por sí sola, un diagnóstico. La plataforma no puntúa ni diagnostica.

---
**Versión**: v1 · 2026-09-11
