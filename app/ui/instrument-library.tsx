"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Lock,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import rawCatalog from "../../data/catalog.json";
import ejesData from "../../data/ejes.json";

export interface CatalogItem {
  family_id: string;
  eje: string;
  eje_num: number;
  sigla: string;
  nombre: string;
  constructo: string;
  temas?: string[];
  sinonimos?: string[];
  resumen?: string;
  poblacion: string;
  franjas: string[];
  acceso: string;
  descargable: boolean;
  protocolo_estado?: string;
  protocolo_etiqueta?: string;
  fuente_url?: string;
  archivos: string[];
  description?: string;
  use?: string;
}

export interface AxisInfo {
  num: number;
  label: string;
  nombre: string;
  subtitulo: string;
  que_es: string;
  por_que: string;
}

export const catalog = rawCatalog as CatalogItem[];

export const AXES: AxisInfo[] = ejesData;

export const AXIS_MAP: Record<number, { label: string; name: string }> = Object.fromEntries(
  ejesData.map((e) => [e.num, { label: e.label, name: e.nombre }])
);

export const AGE_FRANJAS = [
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

interface InstrumentLibraryProps {
  query?: string;
  setQuery?: (q: string) => void;
  selectedAxis?: number | "all";
  setSelectedAxis?: (axis: number | "all") => void;
  selectedFranja?: string;
  setSelectedFranja?: (franja: string) => void;
  selectedTheme?: string;
  setSelectedTheme?: (theme: string) => void;
}

export function InstrumentLibrary(props: InstrumentLibraryProps) {
  // Internal state fallback if not controlled
  const [internalQuery, setInternalQuery] = useState("");
  const [internalAxis, setInternalAxis] = useState<number | "all">("all");
  const [internalFranja, setInternalFranja] = useState<string>("all");
  const [internalTheme, setInternalTheme] = useState<string>("all");

  const query = props.query !== undefined ? props.query : internalQuery;
  const setQuery = props.setQuery || setInternalQuery;

  const selectedAxis = props.selectedAxis !== undefined ? props.selectedAxis : internalAxis;
  const setSelectedAxis = props.setSelectedAxis || setInternalAxis;

  const selectedFranja = props.selectedFranja !== undefined ? props.selectedFranja : internalFranja;
  const setSelectedFranja = props.setSelectedFranja || setInternalFranja;

  const selectedTheme = props.selectedTheme !== undefined ? props.selectedTheme : internalTheme;
  const setSelectedTheme = props.setSelectedTheme || setInternalTheme;

  const [open, setOpen] = useState<string | null>(null);
  const [showAllThemesMobile, setShowAllThemesMobile] = useState(false);
  const [themeCloudCollapsedMobile, setThemeCloudCollapsedMobile] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Total docs across catalog
  const totalDocuments = useMemo(
    () => catalog.reduce((acc, item) => acc + item.archivos.length, 0),
    []
  );

  // List of all 39 themes with family counts by primary theme
  const themeList = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of catalog) {
      const primaryTheme = item.temas?.[0];
      if (primaryTheme) {
        counts[primaryTheme] = (counts[primaryTheme] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({
        name,
        count,
        size: count >= 8 ? "lg" : count >= 5 ? "md" : "sm",
      }));
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
      // Theme filter (primary theme)
      if (selectedTheme !== "all" && item.temas?.[0] !== selectedTheme) {
        return false;
      }
      // Free search
      if (queryWords.length > 0) {
        const searchable = normalizeText(
          `${item.sigla} ${item.nombre} ${item.constructo} ${item.temas?.join(" ") ?? ""} ${item.sinonimos?.join(" ") ?? ""} ${item.poblacion} ${item.description ?? ""} ${item.use ?? ""}`
        );
        const matchesAllWords = queryWords.every((word) => searchable.includes(word));
        if (!matchesAllWords) {
          return false;
        }
      }
      return true;
    });
  }, [selectedAxis, selectedFranja, selectedTheme, query]);

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

  const hasActiveFilters =
    query !== "" ||
    selectedAxis !== "all" ||
    selectedFranja !== "all" ||
    selectedTheme !== "all";

  const activeFiltersCount =
    (query ? 1 : 0) +
    (selectedAxis !== "all" ? 1 : 0) +
    (selectedFranja !== "all" ? 1 : 0) +
    (selectedTheme !== "all" ? 1 : 0);

  const resetFilters = useCallback(() => {
    setQuery("");
    setSelectedAxis("all");
    setSelectedFranja("all");
    setSelectedTheme("all");
    setOpen(null);
  }, [setQuery, setSelectedAxis, setSelectedFranja, setSelectedTheme]);

  // Sync URL search params on client mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get("q");
    const ejeParam = params.get("eje");
    const edadParam = params.get("edad");
    const temaParam = params.get("tema");

    let hasParam = false;
    if (qParam) {
      setQuery(qParam);
      hasParam = true;
    }
    if (ejeParam) {
      const num = parseInt(ejeParam, 10);
      if (!isNaN(num) && num >= 1 && num <= 6) {
        setSelectedAxis(num);
        hasParam = true;
      }
    }
    if (edadParam) {
      setSelectedFranja(edadParam);
      hasParam = true;
    }
    if (temaParam) {
      setSelectedTheme(temaParam);
      hasParam = true;
    }

    if (hasParam) {
      setTimeout(() => {
        const el = document.getElementById("biblioteca");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    }
  }, [setQuery, setSelectedAxis, setSelectedFranja, setSelectedTheme]);

  // Update URL search params when filters change without reload
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (selectedAxis !== "all") params.set("eje", String(selectedAxis));
    if (selectedFranja !== "all") params.set("edad", selectedFranja);
    if (selectedTheme !== "all") params.set("tema", selectedTheme);

    const qs = params.toString();
    const newUrl = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [query, selectedAxis, selectedFranja, selectedTheme]);

  return (
    <section className="library-section" id="biblioteca" aria-label="Biblioteca de instrumentos de evaluación psicológica">
      <div className="library-heading">
        <div>
          <span className="overline">Catálogo General de Instrumentos</span>
          <h2>Encuentra el instrumento adecuado.</h2>
        </div>
        <span className="catalog-count">
          {catalog.length} instrumentos · {totalDocuments} documentos · 6 ejes · {themeList.length} temas
        </span>
      </div>

      {/* Barra única de búsqueda y filtros (Sticky) */}
      <div className="catalog-controls-v1 library-sticky-bar">
        <div className="filter-bar-row">
          <label className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por sigla, nombre, constructo o tema (ej. PHQ, BDI, TOC, TEPT, ansiedad, depresión)…"
              aria-label="Buscar instrumentos"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpiar búsqueda"
                className="search-clear-btn"
              >
                <X size={16} />
              </button>
            )}
          </label>

          {/* Selectores en escritorio */}
          <div className="desktop-filters" role="group" aria-label="Filtros del catálogo">
            <div className="select-wrapper">
              <select
                className="filter-select"
                value={selectedAxis}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedAxis(val === "all" ? "all" : Number(val));
                  setOpen(null);
                }}
                aria-label="Filtrar por eje clínico"
              >
                <option value="all">Eje: Todos los ejes</option>
                {AXES.map((ax) => (
                  <option key={ax.num} value={ax.num}>
                    {ax.label} · {ax.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="select-wrapper">
              <select
                className="filter-select"
                value={selectedFranja}
                onChange={(e) => {
                  setSelectedFranja(e.target.value);
                  setOpen(null);
                }}
                aria-label="Filtrar por franja de edad"
              >
                {AGE_FRANJAS.map((fr) => (
                  <option key={fr.id} value={fr.id}>
                    Edad: {fr.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="select-wrapper">
              <select
                className="filter-select"
                value={selectedTheme}
                onChange={(e) => {
                  setSelectedTheme(e.target.value);
                  setOpen(null);
                }}
                aria-label="Filtrar por tema clínico"
              >
                <option value="all">Tema: Todos los temas ({themeList.length})</option>
                {themeList.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.count})
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="filter-clear-btn"
                onClick={resetFilters}
                aria-label="Limpiar todos los filtros"
              >
                <X size={14} />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          {/* Botón de filtros en celular */}
          <button
            type="button"
            className="mobile-filter-btn"
            onClick={() => setMobileFiltersOpen(true)}
            aria-label="Abrir panel de filtros"
            aria-expanded={mobileFiltersOpen}
          >
            <SlidersHorizontal size={16} />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="mobile-filter-badge">{activeFiltersCount}</span>
            )}
          </button>
        </div>

        {/* Etiquetas quitables de filtros activos */}
        {hasActiveFilters && (
          <div className="active-filters-bar" role="group" aria-label="Filtros aplicados actualmente">
            <span className="active-filters-label">Filtros activos:</span>
            {selectedAxis !== "all" && (
              <button
                type="button"
                className="active-filter-chip"
                onClick={() => {
                  setSelectedAxis("all");
                  setOpen(null);
                }}
                aria-label={`Quitar filtro de eje ${AXIS_MAP[selectedAxis]?.name}`}
              >
                <span>{AXIS_MAP[selectedAxis]?.label}: {AXIS_MAP[selectedAxis]?.name}</span>
                <X size={13} />
              </button>
            )}

            {selectedFranja !== "all" && (
              <button
                type="button"
                className="active-filter-chip"
                onClick={() => {
                  setSelectedFranja("all");
                  setOpen(null);
                }}
                aria-label={`Quitar filtro de edad ${AGE_FRANJAS.find((f) => f.id === selectedFranja)?.label}`}
              >
                <span>Edad: {AGE_FRANJAS.find((f) => f.id === selectedFranja)?.label}</span>
                <X size={13} />
              </button>
            )}

            {selectedTheme !== "all" && (
              <button
                type="button"
                className="active-filter-chip"
                onClick={() => {
                  setSelectedTheme("all");
                  setOpen(null);
                }}
                aria-label={`Quitar filtro de tema ${selectedTheme}`}
              >
                <span>Tema: {selectedTheme}</span>
                <X size={13} />
              </button>
            )}

            {query.trim() !== "" && (
              <button
                type="button"
                className="active-filter-chip"
                onClick={() => setQuery("")}
                aria-label={`Quitar búsqueda "${query}"`}
              >
                <span>Búsqueda: &ldquo;{query}&rdquo;</span>
                <X size={13} />
              </button>
            )}

            <button
              type="button"
              className="active-filter-chip clear-all"
              onClick={resetFilters}
            >
              <span>Limpiar todo</span>
            </button>
          </div>
        )}
      </div>

      {/* Panel inferior de filtros en celular (Bottom Sheet Drawer) */}
      {mobileFiltersOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileFiltersOpen(false)}>
          <div
            className="mobile-filter-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Panel de filtros"
          >
            <div className="drawer-header">
              <div className="drawer-title">
                <SlidersHorizontal size={16} />
                <strong>Filtros</strong>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Cerrar panel de filtros"
              >
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              {/* Filtro Eje */}
              <div className="drawer-section">
                <span className="drawer-section-label">Eje clínico</span>
                <div className="drawer-pills">
                  <button
                    type="button"
                    className={`drawer-pill ${selectedAxis === "all" ? "active" : ""}`}
                    onClick={() => setSelectedAxis("all")}
                  >
                    Todos los ejes
                  </button>
                  {AXES.map((ax) => (
                    <button
                      key={ax.num}
                      type="button"
                      className={`drawer-pill ${selectedAxis === ax.num ? "active" : ""}`}
                      onClick={() => setSelectedAxis(ax.num)}
                    >
                      {ax.label} · {ax.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro Edad */}
              <div className="drawer-section">
                <span className="drawer-section-label">Franja de edad</span>
                <div className="drawer-pills">
                  {AGE_FRANJAS.map((fr) => (
                    <button
                      key={fr.id}
                      type="button"
                      className={`drawer-pill ${selectedFranja === fr.id ? "active" : ""}`}
                      onClick={() => setSelectedFranja(fr.id)}
                    >
                      {fr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro Tema */}
              <div className="drawer-section">
                <span className="drawer-section-label">Tema clínico ({themeList.length})</span>
                <select
                  className="filter-select drawer-select"
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                >
                  <option value="all">Todos los temas ({themeList.length})</option>
                  {themeList.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} ({t.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="drawer-footer">
              {hasActiveFilters && (
                <button
                  type="button"
                  className="drawer-clear-btn"
                  onClick={resetFilters}
                >
                  Limpiar filtros
                </button>
              )}
              <button
                type="button"
                className="button button-primary drawer-submit-btn"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Ver {filtered.length} {filtered.length === 1 ? "instrumento" : "instrumentos"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bloque Explorar por tema (39 temas cerrados) */}
      <section className="theme-section" aria-label="Explorar por tema clínico">
        <div className="theme-header">
          <div className="theme-title">
            <Sparkles size={14} />
            <span>Explorar por tema clínico ({themeList.length})</span>
          </div>
          {/* Botón en celular para desplegar la nube */}
          <button
            type="button"
            className="theme-collapse-mobile-btn"
            onClick={() => setThemeCloudCollapsedMobile((prev) => !prev)}
            aria-expanded={!themeCloudCollapsedMobile}
          >
            <span>{themeCloudCollapsedMobile ? `Explorar por tema (${themeList.length})` : "Ocultar nube de temas"}</span>
            <ChevronDown size={14} className={!themeCloudCollapsedMobile ? "rotate-180" : ""} />
          </button>
          {selectedTheme !== "all" && (
            <span className="theme-active-indicator">
              Tema activo: {selectedTheme}
            </span>
          )}
        </div>

        <div
          className={`theme-cloud ${showAllThemesMobile ? "expanded" : ""} ${themeCloudCollapsedMobile ? "mobile-collapsed" : ""}`}
          role="group"
          aria-label="Temas clínicos disponibles"
        >
          <button
            type="button"
            className={`theme-tag size-lg ${selectedTheme === "all" ? "active" : ""}`}
            onClick={() => {
              setSelectedTheme("all");
              setOpen(null);
            }}
            aria-pressed={selectedTheme === "all"}
          >
            <span>Todos los temas</span>
            <small>{catalog.length}</small>
          </button>
          {themeList.map((theme) => {
            const isSelected = selectedTheme === theme.name;
            return (
              <button
                key={theme.name}
                type="button"
                className={`theme-tag size-${theme.size} ${isSelected ? "active" : ""}`}
                onClick={() => {
                  setSelectedTheme(isSelected ? "all" : theme.name);
                  setOpen(null);
                }}
                aria-pressed={isSelected}
                title={`${theme.name} (${theme.count} ${theme.count === 1 ? "instrumento" : "instrumentos"})`}
              >
                <span>{theme.name}</span>
                <small>{theme.count}</small>
              </button>
            );
          })}
        </div>

        <div className="theme-toggle-container">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={() => setShowAllThemesMobile((prev) => !prev)}
            aria-expanded={showAllThemesMobile}
          >
            <Layers size={13} />
            <span>
              {showAllThemesMobile
                ? "Mostrar solo temas principales"
                : `Ver todos los temas (${themeList.length})`}
            </span>
          </button>
        </div>
      </section>

      {/* Banner clínico para personas mayores (Franja Mayores) */}
      {selectedFranja === "mayores" && (
        <div className="clinical-warning-banner" role="status" aria-live="polite">
          <Info size={18} className="clinical-warning-icon" />
          <div className="clinical-warning-content">
            <strong>Criterio de evaluación en personas mayores</strong>
            <p>
              Esta selección reúne instrumentos validados, baremados o adaptados específicamente para población geriátrica y contexto psicogerontológico. La mayoría de las escalas de la franja <strong>Adultos</strong> también pueden ser aplicables según el criterio profesional y las capacidades funcionales o cognitivas de cada consultante.
            </p>
          </div>
        </div>
      )}

      {/* Resumen de resultados activos */}
      <div className="catalog-summary">
        <span>{filtered.length} {filtered.length === 1 ? "instrumento encontrado" : "instrumentos encontrados"}</span>
        <div className="catalog-summary-right">
          <span>
            {selectedAxis === "all" ? "Todos los ejes" : `Eje ${selectedAxis}`} ·{" "}
            {selectedFranja === "all"
              ? "Todas las edades"
              : AGE_FRANJAS.find((f) => f.id === selectedFranja)?.label}
            {selectedTheme !== "all" ? ` · Tema: ${selectedTheme}` : ""}
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="summary-reset-btn"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Bloque desplegable: Aviso sobre protocolos no disponibles */}
      <details className="protocols-notice-box">
        <summary className="protocols-notice-summary">
          <HelpCircle size={16} />
          <span>¿Por qué algunos instrumentos no tienen protocolo descargable?</span>
          <ChevronDown size={15} className="notice-chevron" />
        </summary>
        <div className="protocols-notice-body">
          <p>
            Algunos instrumentos tienen derechos de autor o se distribuyen bajo licencia de sus autores o editoriales; otros requieren registro ante su titular, y en otros casos todavía estamos verificando la fuente o las condiciones de uso. En esos casos publicamos solo la ficha técnica, con la referencia para obtener el instrumento por la vía oficial.
          </p>
        </div>
      </details>

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
                  const itemTheme = item.temas?.[0];
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
                        <div className="instrument-copy">
                          <strong>{item.nombre}</strong>
                          {item.resumen && (
                            <span className="row-resumen" title={item.resumen}>
                              {item.resumen}
                            </span>
                          )}
                          <small>
                            {item.constructo}
                            {itemTheme && (
                              <button
                                type="button"
                                className="row-theme-chip"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTheme(itemTheme);
                                  setOpen(null);
                                }}
                                title={`Filtrar por tema: ${itemTheme}`}
                                aria-label={`Filtrar por tema ${itemTheme}`}
                              >
                                <Tag size={12} />
                                <span>{itemTheme}</span>
                              </button>
                            )}
                          </small>
                          {/* Segunda línea para móvil: población y cantidad de archivos */}
                          <div className="row-mobile-meta">
                            <span className="row-mobile-pob">{item.poblacion || "Población general"}</span>
                            <span className="row-mobile-files">
                              {item.archivos.length} {item.archivos.length === 1 ? "archivo" : "archivos"}
                            </span>
                          </div>
                        </div>
                        <span className="row-eje">{item.eje}</span>
                        <span className="row-poblacion desktop-only" title={item.poblacion}>
                          {item.poblacion || "Población general"}
                        </span>
                        <span className="row-files desktop-only">
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

                            {/* Tema clínico asignado y secundarios con botones clicables */}
                            {item.temas && item.temas.length > 0 && (
                              <div className="detail-themes-box">
                                <span>Temas clínicos</span>
                                <div className="detail-themes-list">
                                  {item.temas.map((t) => (
                                    <button
                                      key={t}
                                      type="button"
                                      className={`theme-badge-btn ${selectedTheme === t ? "active" : ""}`}
                                      onClick={() => {
                                        setSelectedTheme(t);
                                      }}
                                      title={`Filtrar catálogo por tema: ${t}`}
                                    >
                                      <Tag size={12} />
                                      <span>{t}</span>
                                      <small>{selectedTheme === t ? "Filtro activo" : "Filtrar"}</small>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <span className="detail-section-title">Población objetivo</span>
                            <p className="detail-text">
                              {item.poblacion || "Población general"}
                            </p>

                            <div className="detail-franjas-list">
                              {item.franjas.map((fr) => (
                                <span
                                  key={fr}
                                  className="detail-franja-chip"
                                >
                                  {fr}
                                </span>
                              ))}
                            </div>

                            {item.description && item.description !== item.constructo && (
                              <>
                                <span className="detail-section-title">Descripción</span>
                                <p className="detail-text">{item.description}</p>
                              </>
                            )}

                            {item.use && item.use !== item.poblacion && item.use !== item.constructo && (
                              <>
                                <span className="detail-section-title">Uso sugerido</span>
                                <p className="detail-text">{item.use}</p>
                              </>
                            )}

                            <span className="detail-section-title">Condición de acceso</span>
                            <small className="detail-acceso-text">
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
                                <FileText size={18} />
                              </span>
                              <span>
                                <strong>Ficha técnica</strong>
                                <small>Ficha_Tecnica.pdf · PDF</small>
                              </span>
                              <Download size={16} />
                            </a>

                            {/* Protocolo (si descargable) o Etiqueta Protocolo según condición */}
                            {item.descargable ? (
                              <a
                                href={`/instrumentos/eje-${item.eje_num}/${item.family_id}/Protocolo.pdf`}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <span className="file-icon">
                                  <FileText size={18} />
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
                                  <Lock size={16} />
                                </span>
                                <div>
                                  <strong className="badge-no-protocol">
                                    {item.protocolo_etiqueta || "Protocolo no disponible"}
                                  </strong>
                                  <small>
                                    Acceso restringido por licencia o verificación pendiente
                                  </small>
                                  {item.fuente_url && (
                                    <a
                                      href={item.fuente_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="official-source-link"
                                    >
                                      <span>Fuente oficial</span>
                                      <ExternalLink size={12} />
                                    </a>
                                  )}
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
          <button type="button" onClick={resetFilters}>Limpiar filtros</button>
        </div>
      )}
    </section>
  );
}
