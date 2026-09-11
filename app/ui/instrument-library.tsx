"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Download,
  FileText,
  Lock,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import rawCatalog from "../../data/catalog.json";

export interface CatalogItem {
  family_id: string;
  eje: string;
  eje_num: number;
  sigla: string;
  nombre: string;
  constructo: string;
  poblacion: string;
  franjas: string[];
  acceso: string;
  descargable: boolean;
  archivos: string[];
  description?: string;
  use?: string;
}

const catalog = rawCatalog as CatalogItem[];

const AXIS_MAP: Record<number, { label: string; name: string }> = {
  1: { label: "Eje I", name: "Problemas, síntomas y riesgo" },
  2: { label: "Eje II", name: "Procesos psicológicos" },
  3: { label: "Eje III", name: "Características de la persona" },
  4: { label: "Eje IV", name: "Funcionamiento y recursos" },
  5: { label: "Eje V", name: "Funcionamiento cognitivo" },
  6: { label: "Eje VI", name: "Salud y estilo de vida" },
};

const AXES = [
  { num: 1, label: "Eje I", name: "Problemas, síntomas y riesgo" },
  { num: 2, label: "Eje II", name: "Procesos psicológicos" },
  { num: 3, label: "Eje III", name: "Características de la persona" },
  { num: 4, label: "Eje IV", name: "Funcionamiento y recursos" },
  { num: 5, label: "Eje V", name: "Funcionamiento cognitivo" },
  { num: 6, label: "Eje VI", name: "Salud y estilo de vida" },
];

const AGE_FRANJAS = [
  { id: "all", label: "Todas las edades" },
  { id: "niños", label: "Niños (<13)" },
  { id: "adolescentes", label: "Adolescentes (13–17)" },
  { id: "adultos", label: "Adultos (18–64)" },
  { id: "mayores", label: "Mayores (65+)" },
];

function normalizeText(text: string): string {
  return text
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function InstrumentLibrary() {
  const [query, setQuery] = useState("");
  const [selectedAxis, setSelectedAxis] = useState<number | "all">("all");
  const [selectedFranja, setSelectedFranja] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);

  // Total docs across catalog
  const totalDocuments = useMemo(
    () => catalog.reduce((acc, item) => acc + item.archivos.length, 0),
    []
  );

  // Counters for Axis buttons
  const axisCounts = useMemo(() => {
    const counts: Record<string, number> = { all: catalog.length };
    for (const item of catalog) {
      counts[item.eje_num] = (counts[item.eje_num] || 0) + 1;
    }
    return counts;
  }, []);

  // Counters for Franja buttons
  const franjaCounts = useMemo(() => {
    const counts: Record<string, number> = { all: catalog.length };
    for (const item of catalog) {
      for (const f of item.franjas) {
        counts[f] = (counts[f] || 0) + 1;
      }
    }
    return counts;
  }, []);

  // Filtered instruments
  const filtered = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);

    return catalog.filter((item) => {
      // Axis filter
      if (selectedAxis !== "all" && item.eje_num !== selectedAxis) {
        return false;
      }
      // Franja filter
      if (selectedFranja !== "all" && !item.franjas.includes(selectedFranja)) {
        return false;
      }
      // Free search on sigla, nombre, constructo (and poblacion/description/use)
      if (queryWords.length > 0) {
        const searchable = normalizeText(
          `${item.sigla} ${item.nombre} ${item.constructo} ${item.poblacion} ${item.description ?? ""} ${item.use ?? ""}`
        );
        const matchesAllWords = queryWords.every((word) => searchable.includes(word));
        if (!matchesAllWords) {
          return false;
        }
      }
      return true;
    });
  }, [selectedAxis, selectedFranja, query]);

  // Group filtered results by Axis
  const groupedByAxis = useMemo(() => {
    const groups: { num: number; label: string; name: string; items: CatalogItem[] }[] = [];
    const axesToShow = selectedAxis === "all" ? [1, 2, 3, 4, 5, 6] : [selectedAxis];
    for (const num of axesToShow) {
      const items = filtered.filter((it) => it.eje_num === num);
      if (items.length > 0) {
        groups.push({
          num,
          label: AXIS_MAP[num].label,
          name: AXIS_MAP[num].name,
          items,
        });
      }
    }
    return groups;
  }, [filtered, selectedAxis]);

  const hasActiveFilters = query !== "" || selectedAxis !== "all" || selectedFranja !== "all";

  const resetFilters = () => {
    setQuery("");
    setSelectedAxis("all");
    setSelectedFranja("all");
    setOpen(null);
  };

  return (
    <section className="library-section" aria-label="Biblioteca de instrumentos de evaluación psicológica">
      <div className="library-heading">
        <div>
          <span className="overline">Catálogo General de Instrumentos</span>
          <h2>Encuentra el instrumento adecuado.</h2>
        </div>
        <span className="catalog-count">
          {catalog.length} instrumentos · {totalDocuments} documentos · 6 ejes
        </span>
      </div>

      {/* Controles de búsqueda y filtros */}
      <div className="catalog-controls-v1">
        <label className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por sigla, nombre o constructo (ej. PHQ, BDI, ansiedad, depresión)…"
            aria-label="Buscar instrumentos"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Limpiar búsqueda">
              <X size={16} />
            </button>
          )}
        </label>
      </div>

      <div className="filter-container">
        {/* Filtro por Eje (6 botones + Todos con contador) */}
        <div className="filter-row" role="group" aria-label="Filtrar por eje clínico">
          <div className="filter-row-header">
            <span className="filter-label">Eje clínico</span>
          </div>
          <div className="filter-tags">
            <button
              className={selectedAxis === "all" ? "active" : ""}
              onClick={() => { setSelectedAxis("all"); setOpen(null); }}
              aria-pressed={selectedAxis === "all"}
            >
              <span>Todos los ejes</span>
              <small>{axisCounts.all ?? 0}</small>
            </button>
            {AXES.map((axis) => (
              <button
                key={axis.num}
                className={selectedAxis === axis.num ? "active" : ""}
                onClick={() => { setSelectedAxis(axis.num); setOpen(null); }}
                aria-pressed={selectedAxis === axis.num}
              >
                <span>{axis.label}</span>
                <small>{axisCounts[axis.num] ?? 0}</small>
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por Franja de edad (con contador) */}
        <div className="filter-row" role="group" aria-label="Filtrar por franja de edad">
          <div className="filter-row-header">
            <span className="filter-label">Franja de edad</span>
          </div>
          <div className="filter-tags">
            {AGE_FRANJAS.map((fr) => (
              <button
                key={fr.id}
                className={selectedFranja === fr.id ? "active" : ""}
                onClick={() => { setSelectedFranja(fr.id); setOpen(null); }}
                aria-pressed={selectedFranja === fr.id}
              >
                <span>{fr.label}</span>
                <small>{franjaCounts[fr.id] ?? 0}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen de resultados activos */}
      <div className="catalog-summary">
        <span>{filtered.length} {filtered.length === 1 ? "instrumento encontrado" : "instrumentos encontrados"}</span>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span>
            {selectedAxis === "all" ? "Todos los ejes" : `Eje ${selectedAxis}`} ·{" "}
            {selectedFranja === "all"
              ? "Todas las edades"
              : AGE_FRANJAS.find((f) => f.id === selectedFranja)?.label}
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={{
                background: "transparent",
                border: "0",
                color: "var(--indigo)",
                cursor: "pointer",
                fontSize: "9px",
                textDecoration: "underline",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                padding: "0",
              }}
            >
              Restablecer
            </button>
          )}
        </div>
      </div>

      {/* Listado de instrumentos agrupados por Eje */}
      {filtered.length ? (
        <div className="instrument-groups">
          {groupedByAxis.map((group) => (
            <section
              className="instrument-group"
              aria-labelledby={`axis-${group.num}`}
              key={group.num}
            >
              <div className="group-heading">
                <span className="group-marker" />
                <h3 id={`axis-${group.num}`}>
                  {group.label} · {group.name}
                </h3>
                <span>
                  {group.items.length}{" "}
                  {group.items.length === 1 ? "instrumento" : "instrumentos"}
                </span>
              </div>
              <div className="instrument-list">
                {group.items.map((item, index) => {
                  const isOpen = open === item.family_id;
                  return (
                    <article
                      className={`instrument-row ${isOpen ? "open" : ""}`}
                      key={item.family_id}
                    >
                      <button
                        className="instrument-main"
                        onClick={() => setOpen(isOpen ? null : item.family_id)}
                        aria-expanded={isOpen}
                      >
                        <span className="row-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="code-badge">{item.sigla}</span>
                        <span className="instrument-copy">
                          <strong>{item.nombre}</strong>
                          <small>{item.constructo}</small>
                        </span>
                        <span className="row-eje">{item.eje}</span>
                        <span className="row-poblacion" title={item.poblacion}>
                          {item.poblacion || "Población general"}
                        </span>
                        <span className="row-files">
                          {item.archivos.length}{" "}
                          {item.archivos.length === 1 ? "archivo" : "archivos"}
                        </span>
                        <span className="expand-icon">
                          <ChevronDown size={17} />
                        </span>
                      </button>

                      {isOpen && (
                        <div className="instrument-detail">
                          <div className="detail-context">
                            <span>Eje y constructo</span>
                            <strong>{item.eje} · {item.constructo}</strong>

                            <span style={{ marginTop: "10px", display: "block" }}>Población objetivo</span>
                            <p style={{ margin: "3px 0 8px" }}>
                              {item.poblacion || "Población general"}
                            </p>

                            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "10px" }}>
                              {item.franjas.map((fr) => (
                                <span
                                  key={fr}
                                  style={{
                                    fontSize: "8px",
                                    padding: "2px 7px",
                                    borderRadius: "999px",
                                    background: "#f0efff",
                                    color: "var(--indigo)",
                                    fontWeight: "600",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {fr}
                                </span>
                              ))}
                            </div>

                            {item.description && item.description !== item.constructo && (
                              <>
                                <span style={{ marginTop: "8px", display: "block" }}>Descripción</span>
                                <p style={{ margin: "3px 0" }}>{item.description}</p>
                              </>
                            )}

                            {item.use && item.use !== item.poblacion && item.use !== item.constructo && (
                              <>
                                <span style={{ marginTop: "8px", display: "block" }}>Uso sugerido</span>
                                <p style={{ margin: "3px 0" }}>{item.use}</p>
                              </>
                            )}

                            <span style={{ marginTop: "10px", display: "block" }}>Condición de acceso</span>
                            <small style={{ color: "#7a7a8d", fontSize: "8.5px", lineHeight: "1.4", display: "block", marginTop: "3px" }}>
                              {item.acceso}
                            </small>
                          </div>

                          <div className="file-list">
                            {/* Ficha técnica (siempre presente para las 231 familias) */}
                            <a
                              href={`/instrumentos/eje-${item.eje_num}/${item.family_id}/Ficha_Tecnica.pdf`}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span className="file-icon">
                                <FileText size={16} />
                              </span>
                              <span>
                                <strong>Ficha técnica</strong>
                                <small>Ficha_Tecnica.pdf · PDF</small>
                              </span>
                              <Download size={16} />
                            </a>

                            {/* Protocolo (si descargable) o Etiqueta Protocolo no publicable */}
                            {item.descargable ? (
                              <a
                                href={`/instrumentos/eje-${item.eje_num}/${item.family_id}/Protocolo.pdf`}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <span className="file-icon">
                                  <FileText size={16} />
                                </span>
                                <span>
                                  <strong>Protocolo</strong>
                                  <small>Protocolo.pdf · PDF</small>
                                </span>
                                <Download size={16} />
                              </a>
                            ) : (
                              <div className="file-restricted">
                                <span className="file-restricted-icon">
                                  <Lock size={15} />
                                </span>
                                <div>
                                  <strong className="badge-no-protocol">
                                    Protocolo no publicable
                                  </strong>
                                  <small>
                                    Acceso restringido por licencia o verificación pendiente
                                  </small>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={26} />
          <h3>No encontramos coincidencias</h3>
          <p>Prueba con otros términos de búsqueda o selecciona otros filtros.</p>
          <button onClick={resetFilters}>Limpiar filtros</button>
        </div>
      )}
    </section>
  );
}
