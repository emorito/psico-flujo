"use client";

import { useMemo, useState, useEffect, useRef, useCallback, useDeferredValue } from "react";
import {
  ChevronDown,
  Download,
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
import rawIndice from "../../data/indice_psicoflujo.json";
import { crearIndice, buscar } from "../../buscador_indice";
import { claMap } from "../lib/guia";
import { AMBITOS } from "./ambito-selector";

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
  ambitos?: string[];
  rol_en_ambito?: string[];
  secciones?: Record<string, string | undefined>;
  metodo?: string;
  nivel_uso?: string;
  cualificacion?: string;
  baremos_locales?: string;
}

export interface AxisInfo {
  num: number;
  label: string;
  nombre: string;
  subtitulo: string;
  que_es: string;
  por_que: string;
}

export interface IndiceTema {
  id: string;
  nombre: string;
  eje: string;
  apa?: { p: string; pn: string; s: string; sn: string };
  hitop?: { grupo: string; detalle: string };
  dsm5?: string;
  confianza?: string;
  terminos?: string[];
}

export interface IndiceFamilia {
  id: string;
  eje: number;
  sigla: string;
  alias?: string[];
  nombre: string;
  en?: string;
  constructo: string;
  tema: string;
  sec?: string[];
  fuente?: string;
  franjas?: string[];
  protocolo?: string;
}

export interface IndiceData {
  version: string;
  generado: string;
  fuente: string;
  normalizacion: string;
  ejes: AxisInfo[];
  temas: IndiceTema[];
  familias: IndiceFamilia[];
}

export const indiceData = rawIndice as unknown as IndiceData;

// Indice de busqueda creado una sola vez al cargar
export const searchIndex = crearIndice(indiceData);

// Mapas de acceso rapido para facetas
export const indexFamilyMap = new Map<string, IndiceFamilia>(
  indiceData.familias.map((f) => [f.id, f])
);

export const indexThemeMap = new Map<string, IndiceTema>(
  indiceData.temas.map((t) => [t.id, t])
);

export const catalog = rawCatalog as unknown as CatalogItem[];

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

interface InstrumentLibraryProps {
  query?: string;
  setQuery?: (q: string) => void;
  searchResults?: { id: string; score: number; parcial: boolean }[] | null;
  selectedAxis?: number | "all";
  setSelectedAxis?: (axis: number | "all") => void;
  selectedFranja?: string;
  setSelectedFranja?: (franja: string) => void;
  selectedTheme?: string;
  setSelectedTheme?: (theme: string) => void;
  selectedFuncion?: string;
  setSelectedFuncion?: (fn: string) => void;
  selectedTipo?: string;
  setSelectedTipo?: (tipo: string) => void;
  selectedLibre?: boolean;
  setSelectedLibre?: (libre: boolean) => void;
  selectedAmbito?: string;
  setSelectedAmbito?: (ambito: string) => void;
  selectedSeccion?: string;
  setSelectedSeccion?: (sec: string) => void;
}

export function InstrumentLibrary(props: InstrumentLibraryProps) {
  // Internal state fallback if not controlled
  const [internalQuery, setInternalQuery] = useState("");
  const [internalAxis, setInternalAxis] = useState<number | "all">("all");
  const [internalFranja, setInternalFranja] = useState<string>("all");
  const [internalTheme, setInternalTheme] = useState<string>("all");
  const [internalFuncion, setInternalFuncion] = useState<string>("all");
  const [internalTipo, setInternalTipo] = useState<string>("all");
  const [internalLibre, setInternalLibre] = useState<boolean>(false);
  const [internalAmbito, setInternalAmbito] = useState<string>("all");
  const [internalSeccion, setInternalSeccion] = useState<string>("all");

  const query = props.query !== undefined ? props.query : internalQuery;
  const setQuery = props.setQuery || setInternalQuery;
  const deferredQuery = useDeferredValue(query);

  const selectedAxis = props.selectedAxis !== undefined ? props.selectedAxis : internalAxis;
  const setSelectedAxis = props.setSelectedAxis || setInternalAxis;

  const selectedFranja = props.selectedFranja !== undefined ? props.selectedFranja : internalFranja;
  const setSelectedFranja = props.setSelectedFranja || setInternalFranja;

  const selectedTheme = props.selectedTheme !== undefined ? props.selectedTheme : internalTheme;
  const setSelectedTheme = props.setSelectedTheme || setInternalTheme;

  const selectedFuncion = props.selectedFuncion !== undefined ? props.selectedFuncion : internalFuncion;
  const setSelectedFuncion = props.setSelectedFuncion || setInternalFuncion;

  const selectedTipo = props.selectedTipo !== undefined ? props.selectedTipo : internalTipo;
  const setSelectedTipo = props.setSelectedTipo || setInternalTipo;

  const selectedLibre = props.selectedLibre !== undefined ? props.selectedLibre : internalLibre;
  const setSelectedLibre = props.setSelectedLibre || setInternalLibre;

  const selectedAmbito = props.selectedAmbito !== undefined ? props.selectedAmbito : internalAmbito;
  const setSelectedAmbito = props.setSelectedAmbito || setInternalAmbito;

  const selectedSeccion = props.selectedSeccion !== undefined ? props.selectedSeccion : internalSeccion;
  const setSelectedSeccion = props.setSelectedSeccion || setInternalSeccion;

  const normalizedAmbitoId = useMemo(() => {
    if (!selectedAmbito || selectedAmbito === "all" || selectedAmbito === "general") return "all";
    const clean = selectedAmbito.trim().toLowerCase();
    if (clean === "educativa") return "educativo";
    if (clean === "forense") return "juridico";
    if (clean === "clinica") return "clinico";
    return clean;
  }, [selectedAmbito]);

  const isAmbitoActive = normalizedAmbitoId !== "all";
  const activeAmbito = useMemo(() => {
    if (!isAmbitoActive) return null;
    return AMBITOS.find((a) => a.id === normalizedAmbitoId) || null;
  }, [isAmbitoActive, normalizedAmbitoId]);

  const scopedBaseCatalog = useMemo(() => {
    if (!isAmbitoActive || !activeAmbito) return catalog;
    const targetId = activeAmbito.id;
    return catalog.filter((it) => it.ambitos?.includes(targetId));
  }, [isAmbitoActive, activeAmbito]);

  const scopedTotalDocs = useMemo(() => {
    return scopedBaseCatalog.reduce((acc, item) => acc + item.archivos.length, 0);
  }, [scopedBaseCatalog]);

  const [open, setOpen] = useState<string | null>(null);
  const [showAllThemesMobile, setShowAllThemesMobile] = useState(false);
  const [themeCloudCollapsedMobile, setThemeCloudCollapsedMobile] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Total docs across catalog
  const totalDocuments = useMemo(
    () => catalog.reduce((acc, item) => acc + item.archivos.length, 0),
    []
  );

  // List of all 40 themes with family counts by primary theme from index
  const themeList = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of indiceData.temas) {
      counts[t.nombre] = 0;
    }
    for (const f of indiceData.familias) {
      const tName = indexThemeMap.get(f.tema)?.nombre;
      if (tName) {
        counts[tName] = (counts[tName] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({
        name,
        count,
        size: (count >= 8 ? "lg" : count >= 5 ? "md" : "sm") as "lg" | "md" | "sm",
      }));
  }, []);

  // Filtered instruments
  const filtered = useMemo(() => {
    let searchHitMap: Map<string, { score: number; parcial?: boolean; rank: number }> | null = null;

    if (props.searchResults !== undefined) {
      if (props.searchResults !== null) {
        searchHitMap = new Map();
        props.searchResults.forEach((r: { id: string; score: number; parcial?: boolean }, idx: number) => {
          searchHitMap!.set(r.id, { score: r.score, parcial: r.parcial, rank: idx });
        });
      }
    } else {
      const trimmedQuery = deferredQuery.trim();
      if (trimmedQuery.length > 0) {
        const results = buscar(searchIndex, trimmedQuery, { limite: catalog.length });
        searchHitMap = new Map();
        results.forEach((r: { id: string; score: number; parcial?: boolean }, idx: number) => {
          searchHitMap!.set(r.id, { score: r.score, parcial: r.parcial, rank: idx });
        });
      }
    }

    return scopedBaseCatalog
      .filter((item) => {
        const famIndex = indexFamilyMap.get(item.family_id);

        // Ámbito activo: filtrar por dimensión seleccionada dentro del ámbito
        if (isAmbitoActive && activeAmbito) {
          if (selectedSeccion !== "all") {
            const itemSec = item.secciones?.[activeAmbito.id];
            if (itemSec !== selectedSeccion) {
              return false;
            }
          }
        }

        // Search match filter
        if (searchHitMap && !searchHitMap.has(item.family_id)) {
          return false;
        }

        // Filtros exclusivos de la Vista General (Ejes, Temas clínicos, Función, Tipo)
        if (!isAmbitoActive) {
          // Axis filter
          const itemEje = famIndex?.eje ?? item.eje_num;
          if (selectedAxis !== "all" && itemEje !== selectedAxis) {
            return false;
          }

          // Theme filter (from index: primary and secondary themes)
          if (selectedTheme !== "all") {
            const primaryThemeName = indexThemeMap.get(famIndex?.tema ?? "")?.nombre;
            const secThemeNames = (famIndex?.sec || []).map((s) => indexThemeMap.get(s)?.nombre);
            const allThemes = [primaryThemeName, ...secThemeNames].filter(Boolean);
            if (!allThemes.includes(selectedTheme)) {
              return false;
            }
          }

          // Funcion clinica filter
          if (selectedFuncion !== "all") {
            const claItem = claMap.get(item.family_id);
            if (claItem?.funcion_clinica_categoria !== selectedFuncion) {
              return false;
            }
          }

          // Tipo instrumento / quien responde filter
          if (selectedTipo !== "all") {
            const claItem = claMap.get(item.family_id);
            if (claItem?.tipo_instrumento_categoria !== selectedTipo) {
              return false;
            }
          }
        }

        // Franja filter (aplica en ambos modos)
        if (selectedFranja !== "all" && !item.franjas.includes(selectedFranja)) {
          return false;
        }

        // Solo libre filter (aplica en ambos modos)
        if (selectedLibre) {
          const claItem = claMap.get(item.family_id);
          const isAbierto = claItem?.acceso_categoria === "abierto" || item.descargable;
          if (!isAbierto) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (searchHitMap) {
          const rankA = searchHitMap.get(a.family_id)?.rank ?? 9999;
          const rankB = searchHitMap.get(b.family_id)?.rank ?? 9999;
          if (rankA !== rankB) return rankA - rankB;
        }
        return a.sigla.localeCompare(b.sigla);
      });
  }, [
    scopedBaseCatalog,
    isAmbitoActive,
    activeAmbito,
    selectedAxis,
    selectedFranja,
    selectedTheme,
    selectedFuncion,
    selectedTipo,
    selectedLibre,
    selectedSeccion,
    deferredQuery,
    props.searchResults,
  ]);

  // Group filtered results by Axis (General) OR by Section (Active Ámbito)
  const groupedResults = useMemo(() => {
    if (isAmbitoActive && activeAmbito && activeAmbito.secciones && activeAmbito.secciones.length > 0) {
      // Agrupación por las secciones del ámbito activo
      const groups: {
        id: string;
        isSection: boolean;
        titulo: string;
        criterio?: string;
        num?: number;
        label?: string;
        name?: string;
        items: CatalogItem[];
      }[] = [];

      for (let i = 0; i < activeAmbito.secciones.length; i++) {
        const sec = activeAmbito.secciones[i];
        if (selectedSeccion !== "all" && selectedSeccion !== sec.id) {
          continue;
        }
        const items = filtered.filter((it) => it.secciones?.[activeAmbito.id] === sec.id);
        if (items.length > 0 || selectedSeccion === sec.id) {
          groups.push({
            id: sec.id,
            isSection: true,
            titulo: `${i + 1}. ${sec.titulo}`,
            criterio: sec.criterio,
            items,
          });
        }
      }

      // Añadir items no asignados si los hubiese
      const assignedIds = new Set(groups.flatMap((g) => g.items.map((it) => it.family_id)));
      const unassignedItems = filtered.filter((it) => !assignedIds.has(it.family_id));
      if (unassignedItems.length > 0 && selectedSeccion === "all") {
        groups.push({
          id: "otros",
          isSection: true,
          titulo: "Otros instrumentos de este ámbito",
          criterio: "Instrumentos complementarios catalogados en esta área",
          items: unassignedItems,
        });
      }

      return groups;
    }

    // Agrupación canónica por Ejes (Eje I a Eje VI) para Vista General
    const groups: {
      id: string;
      isSection: boolean;
      titulo?: string;
      criterio?: string;
      num?: number;
      label?: string;
      name?: string;
      items: CatalogItem[];
    }[] = [];
    const axesToShow = selectedAxis === "all" ? [1, 2, 3, 4, 5, 6] : [selectedAxis];
    for (const num of axesToShow) {
      const items = filtered.filter((it) => {
        const famIndex = indexFamilyMap.get(it.family_id);
        const itemEje = famIndex?.eje ?? it.eje_num;
        return itemEje === num;
      });
      if (items.length > 0) {
        groups.push({
          id: `axis-${num}`,
          isSection: false,
          num,
          label: AXIS_MAP[num].label,
          name: AXIS_MAP[num].name,
          items,
        });
      }
    }
    return groups;
  }, [filtered, selectedAxis, isAmbitoActive, activeAmbito, selectedSeccion]);

  const hasActiveFilters = isAmbitoActive
    ? query !== "" || selectedSeccion !== "all" || selectedFranja !== "all" || selectedLibre
    : query !== "" ||
      selectedAxis !== "all" ||
      selectedFranja !== "all" ||
      selectedTheme !== "all" ||
      selectedFuncion !== "all" ||
      selectedTipo !== "all" ||
      selectedLibre;

  const activeFiltersCount = isAmbitoActive
    ? (query ? 1 : 0) +
      (selectedSeccion !== "all" ? 1 : 0) +
      (selectedFranja !== "all" ? 1 : 0) +
      (selectedLibre ? 1 : 0)
    : (query ? 1 : 0) +
      (selectedAxis !== "all" ? 1 : 0) +
      (selectedFranja !== "all" ? 1 : 0) +
      (selectedTheme !== "all" ? 1 : 0) +
      (selectedFuncion !== "all" ? 1 : 0) +
      (selectedTipo !== "all" ? 1 : 0) +
      (selectedLibre ? 1 : 0);

  const resetFilters = useCallback(() => {
    setQuery("");
    setSelectedFranja("all");
    setSelectedLibre(false);
    if (isAmbitoActive) {
      setSelectedSeccion("all");
    } else {
      setSelectedAxis("all");
      setSelectedTheme("all");
      setSelectedFuncion("all");
      setSelectedTipo("all");
      setSelectedAmbito("all");
      setSelectedSeccion("all");
    }
    setOpen(null);
  }, [
    isAmbitoActive,
    setQuery,
    setSelectedFranja,
    setSelectedLibre,
    setSelectedSeccion,
    setSelectedAxis,
    setSelectedTheme,
    setSelectedFuncion,
    setSelectedTipo,
    setSelectedAmbito,
  ]);

  // Sync URL search params on client mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get("q");
    const ejeParam = params.get("eje");
    const edadParam = params.get("edad");
    const temaParam = params.get("tema");
    const fnParam = params.get("fn");
    const quienParam = params.get("quien");
    const libreParam = params.get("libre");
    const ambitoParam = params.get("ambito");
    const secParam = params.get("sec");

    let hasParam = false;
    if (qParam) {
      setQuery(qParam);
      hasParam = true;
    }
    if (ambitoParam && ambitoParam !== "all") {
      setSelectedAmbito(ambitoParam);
      hasParam = true;
    }
    if (secParam && secParam !== "all") {
      setSelectedSeccion(secParam);
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
    if (fnParam) {
      setSelectedFuncion(fnParam);
      hasParam = true;
    }
    if (quienParam) {
      setSelectedTipo(quienParam);
      hasParam = true;
    }
    if (libreParam === "1" || libreParam === "true") {
      setSelectedLibre(true);
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
  }, [setQuery, setSelectedAxis, setSelectedFranja, setSelectedTheme, setSelectedFuncion, setSelectedTipo, setSelectedLibre, setSelectedAmbito, setSelectedSeccion]);

  // Update URL search params when filters change without reload
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();
    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.get("guia")) params.set("guia", currentParams.get("guia")!);

    if (selectedAmbito !== "all" && selectedAmbito !== "general") {
      params.set("ambito", selectedAmbito);
      if (selectedSeccion !== "all") params.set("sec", selectedSeccion);
    }

    if (query.trim()) params.set("q", query.trim());
    if (selectedAxis !== "all") params.set("eje", String(selectedAxis));
    if (selectedFranja !== "all") params.set("edad", selectedFranja);
    if (selectedTheme !== "all") params.set("tema", selectedTheme);
    if (selectedFuncion !== "all") params.set("fn", selectedFuncion);
    if (selectedTipo !== "all") params.set("quien", selectedTipo);
    if (selectedLibre) params.set("libre", "1");

    const qs = params.toString();
    const newUrl = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [query, selectedAxis, selectedFranja, selectedTheme, selectedFuncion, selectedTipo, selectedLibre, selectedAmbito, selectedSeccion]);

  return (
    <section className="library-section" id="biblioteca" data-ambito={selectedAmbito} aria-label="Biblioteca de instrumentos de evaluación psicológica">
      {/* Encabezado general del catálogo: sólo visible en la Vista General canónica.
          En páginas de ámbito especializado se oculta por completo según indicación del usuario para eliminar redundancia y dar paso directo a los filtros */}
      {!isAmbitoActive && (
        <div className="library-heading">
          <div>
            <span className="overline">Catálogo General de Instrumentos</span>
            <h2>Encuentra el instrumento adecuado.</h2>
          </div>
          <span className="catalog-count">
            {catalog.length} instrumentos · {totalDocuments} documentos · 6 ejes · {themeList.length} temas
          </span>
        </div>
      )}

      {/* Barra única de búsqueda y filtros (Sticky) */}
      <div className="catalog-controls-v1 library-sticky-bar">
        <div className="filter-bar-row">
          <label className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                isAmbitoActive && activeAmbito
                  ? `Buscar en ${activeAmbito.nombre_corto} (ej. ${activeAmbito.id === 'educativo' ? 'BRIEF, EFECO, lectura' : 'sigla, nombre o constructo'})…`
                  : "Buscar por sigla, nombre o tema (ej. PHQ, BDI, ansiedad)…"
              }
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
            {isAmbitoActive && activeAmbito ? (
              <>
                {/* 1. Selector de Dimensión de este Ámbito */}
                <div className="select-wrapper">
                  <select
                    className="filter-select"
                    value={selectedSeccion}
                    onChange={(e) => {
                      setSelectedSeccion(e.target.value);
                      setOpen(null);
                    }}
                    aria-label="Filtrar por dimensión"
                  >
                    <option value="all">Dimensión: Todas las dimensiones ({activeAmbito.secciones.length})</option>
                    {activeAmbito.secciones.map((sec, idx) => {
                      const count = scopedBaseCatalog.filter(
                        (it) => it.secciones?.[activeAmbito.id] === sec.id
                      ).length;
                      return (
                        <option key={sec.id} value={sec.id}>
                          {idx + 1}. {sec.titulo} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 2. Selector de Franja de Edad adaptado al ámbito */}
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
                    <option value="all">Edad: Todas las edades ({scopedBaseCatalog.length})</option>
                    {AGE_FRANJAS.filter((fr) => fr.id !== "all").map((fr) => {
                      const count = scopedBaseCatalog.filter((it) => it.franjas.includes(fr.id)).length;
                      return (
                        <option key={fr.id} value={fr.id} disabled={count === 0}>
                          Edad: {fr.label} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 3. Selector de Condición de Acceso */}
                <div className="select-wrapper">
                  <select
                    className="filter-select"
                    value={selectedLibre ? "libre" : "all"}
                    onChange={(e) => {
                      setSelectedLibre(e.target.value === "libre");
                      setOpen(null);
                    }}
                    aria-label="Filtrar por condición de acceso"
                  >
                    <option value="all">Acceso: Todos ({scopedBaseCatalog.length})</option>
                    <option value="libre">
                      Solo uso libre ({scopedBaseCatalog.filter((it) => {
                        const claItem = claMap.get(it.family_id);
                        return claItem?.acceso_categoria === "abierto" || it.descargable;
                      }).length})
                    </option>
                  </select>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}

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

            {isAmbitoActive ? (
              <>
                {selectedSeccion !== "all" && (
                  <button
                    type="button"
                    className="active-filter-chip"
                    onClick={() => {
                      setSelectedSeccion("all");
                      setOpen(null);
                    }}
                    aria-label="Quitar filtro de dimensión"
                  >
                    <span>
                      Dimensión: {activeAmbito?.secciones?.find((s) => s.id === selectedSeccion)?.titulo || selectedSeccion}
                    </span>
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

                {selectedLibre && (
                  <button
                    type="button"
                    className="active-filter-chip"
                    onClick={() => {
                      setSelectedLibre(false);
                      setOpen(null);
                    }}
                    aria-label="Quitar filtro de sólo uso libre"
                  >
                    <span>Solo uso libre</span>
                    <X size={13} />
                  </button>
                )}
              </>
            ) : (
              <>
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

                {selectedFuncion !== "all" && (
                  <button
                    type="button"
                    className="active-filter-chip"
                    onClick={() => {
                      setSelectedFuncion("all");
                      setOpen(null);
                    }}
                    aria-label={`Quitar filtro de función clínica ${selectedFuncion}`}
                  >
                    <span>Función: {selectedFuncion}</span>
                    <X size={13} />
                  </button>
                )}

                {selectedTipo !== "all" && (
                  <button
                    type="button"
                    className="active-filter-chip"
                    onClick={() => {
                      setSelectedTipo("all");
                      setOpen(null);
                    }}
                    aria-label={`Quitar filtro de modalidad ${selectedTipo}`}
                  >
                    <span>Modalidad: {selectedTipo}</span>
                    <X size={13} />
                  </button>
                )}

                {selectedLibre && (
                  <button
                    type="button"
                    className="active-filter-chip"
                    onClick={() => {
                      setSelectedLibre(false);
                      setOpen(null);
                    }}
                    aria-label="Quitar filtro de sólo uso libre"
                  >
                    <span>Solo uso libre</span>
                    <X size={13} />
                  </button>
                )}
              </>
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
              {isAmbitoActive && activeAmbito ? (
                <>
                  {/* Filtro Dimensión */}
                  <div className="drawer-section">
                    <span className="drawer-section-label">Dimensión / Área de Evaluación</span>
                    <div className="drawer-pills">
                      <button
                        type="button"
                        className={`drawer-pill ${selectedSeccion === "all" ? "active" : ""}`}
                        onClick={() => setSelectedSeccion("all")}
                      >
                        Todas las dimensiones ({scopedBaseCatalog.length})
                      </button>
                      {activeAmbito.secciones.map((sec, idx) => {
                        const count = scopedBaseCatalog.filter(
                          (it) => it.secciones?.[activeAmbito.id] === sec.id
                        ).length;
                        return (
                          <button
                            key={sec.id}
                            type="button"
                            className={`drawer-pill ${selectedSeccion === sec.id ? "active" : ""}`}
                            onClick={() => setSelectedSeccion(sec.id)}
                          >
                            {idx + 1}. {sec.titulo} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filtro Edad */}
                  <div className="drawer-section">
                    <span className="drawer-section-label">Franja de edad</span>
                    <div className="drawer-pills">
                      {AGE_FRANJAS.map((fr) => {
                        const count = scopedBaseCatalog.filter(
                          (it) => fr.id === "all" || it.franjas.includes(fr.id)
                        ).length;
                        return (
                          <button
                            key={fr.id}
                            type="button"
                            className={`drawer-pill ${selectedFranja === fr.id ? "active" : ""}`}
                            onClick={() => setSelectedFranja(fr.id)}
                            disabled={count === 0}
                          >
                            {fr.label} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filtro Acceso */}
                  <div className="drawer-section">
                    <span className="drawer-section-label">Condición de acceso</span>
                    <div className="drawer-pills">
                      <button
                        type="button"
                        className={`drawer-pill ${!selectedLibre ? "active" : ""}`}
                        onClick={() => setSelectedLibre(false)}
                      >
                        Todos ({scopedBaseCatalog.length})
                      </button>
                      <button
                        type="button"
                        className={`drawer-pill ${selectedLibre ? "active" : ""}`}
                        onClick={() => setSelectedLibre(true)}
                      >
                        Solo uso libre ({scopedBaseCatalog.filter((it) => {
                          const claItem = claMap.get(it.family_id);
                          return claItem?.acceso_categoria === "abierto" || it.descargable;
                        }).length})
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Filtros Canónicos para Vista General */}
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
                </>
              )}
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

      {/* Bloque Explorar por tema (40 temas) - SOLO en Vista General */}
      {!isAmbitoActive && (
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
      )}

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
        <span>{filtered.length} {filtered.length === 1 ? "instrumento disponible" : "instrumentos disponibles"}</span>
        <div className="catalog-summary-right">
          <span>
            {isAmbitoActive && activeAmbito ? (
              <>
                {selectedSeccion === "all"
                  ? "Todas las dimensiones"
                  : activeAmbito.secciones.find((s) => s.id === selectedSeccion)?.titulo || selectedSeccion} ·{" "}
                {selectedFranja === "all"
                  ? "Todas las edades"
                  : AGE_FRANJAS.find((f) => f.id === selectedFranja)?.label}
                {selectedLibre ? " · Solo uso libre" : ""}
              </>
            ) : (
              <>
                {selectedAxis === "all" ? "Todos los ejes" : `Eje ${selectedAxis}`} ·{" "}
                {selectedFranja === "all"
                  ? "Todas las edades"
                  : AGE_FRANJAS.find((f) => f.id === selectedFranja)?.label}
                {selectedTheme !== "all" ? ` · Tema: ${selectedTheme}` : ""}
              </>
            )}
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

      {/* Listado de instrumentos agrupados por Eje o por Sección de Ámbito */}
      {filtered.length ? (
        <div className="instrument-groups">
          {groupedResults.map((group) => {
            const activeAmbitoMeta =
              selectedAmbito !== "all" && selectedAmbito !== "general"
                ? AMBITOS.find((a) => a.id === selectedAmbito)
                : null;
            return (
              <section
                className="instrument-group"
                aria-labelledby={group.isSection ? `section-${group.id}` : `axis-${group.num}`}
                key={group.id}
              >
                <div className={`group-heading ${group.isSection ? "ambito-section-heading" : ""}`}>
                  <span
                    className="group-marker"
                    style={
                      group.isSection && activeAmbitoMeta
                        ? { background: activeAmbitoMeta.color_tema.primary }
                        : undefined
                    }
                  />
                  <div>
                    <h3 id={group.isSection ? `section-${group.id}` : `axis-${group.num}`}>
                      {group.isSection ? group.titulo : `${group.label} · ${group.name}`}
                    </h3>
                    {group.isSection && group.criterio && (
                      <p className="group-criterio">{group.criterio}</p>
                    )}
                  </div>
                  <span>
                    {group.items.length}{" "}
                    {group.items.length === 1 ? "instrumento" : "instrumentos"}
                  </span>
                </div>
                {group.items.length > 0 ? (
                  <div className="instrument-list">
                    {group.items.map((item, index) => {
                  const isOpen = open === item.family_id;
                  const famIndex = indexFamilyMap.get(item.family_id);
                  const primaryThemeName = indexThemeMap.get(famIndex?.tema ?? "")?.nombre || item.temas?.[0] || "";
                  const secThemeNames = (famIndex?.sec || []).map((s) => indexThemeMap.get(s)?.nombre).filter(Boolean) as string[];
                  const resolvedThemes = [primaryThemeName, ...secThemeNames].filter(Boolean);
                  const itemSecId = isAmbitoActive && activeAmbito ? item.secciones?.[activeAmbito.id] : undefined;
                  const secIndex = isAmbitoActive && activeAmbito && itemSecId ? activeAmbito.secciones?.findIndex((s) => s.id === itemSecId) : -1;
                  const secMeta = secIndex >= 0 && activeAmbito ? activeAmbito.secciones[secIndex] : undefined;
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
                            {!isAmbitoActive && primaryThemeName && (
                              <span
                                role="button"
                                tabIndex={0}
                                className="row-theme-chip"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTheme(primaryThemeName);
                                  setOpen(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedTheme(primaryThemeName);
                                    setOpen(null);
                                  }
                                }}
                                title={`Filtrar por tema: ${primaryThemeName}`}
                                aria-label={`Filtrar por tema ${primaryThemeName}`}
                              >
                                <Tag size={12} />
                                <span>{primaryThemeName}</span>
                              </span>
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
                        <span
                          className={`row-eje ${isAmbitoActive ? "row-ambito-dim" : ""}`}
                          title={isAmbitoActive && secMeta ? `Dimensión ${secIndex + 1}: ${secMeta.titulo}` : item.eje}
                        >
                          {isAmbitoActive
                            ? (secIndex >= 0 ? `Dim. ${secIndex + 1}` : activeAmbito?.nombre_corto || "Ámbito")
                            : item.eje}
                        </span>
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
                            {isAmbitoActive && activeAmbito && secMeta ? (
                              <div className="detail-dimension-box">
                                <span className="detail-meta-label">Dimensión Disciplinar ({activeAmbito.nombre_corto})</span>
                                <p className="detail-dimension-desc">
                                  <strong>{secMeta.titulo}</strong> — {secMeta.criterio}
                                </p>
                              </div>
                            ) : (
                              <>
                                <span>Eje y constructo</span>
                                <strong>{item.eje} · {item.constructo}</strong>
                              </>
                            )}

                            {/* Tema clínico asignado y secundarios con botones clicables (solo en Vista General) */}
                            {!isAmbitoActive && resolvedThemes.length > 0 && (
                              <div className="detail-themes-box">
                                <span>Temas clínicos</span>
                                <div className="detail-themes-list">
                                  {resolvedThemes.map((t) => (
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

                            {/* Metadatos de Cualificación, Uso y Baremos */}
                            <div className="detail-meta-grid">
                              <div className="detail-meta-item">
                                <span className="detail-meta-label">Método y Nivel</span>
                                <span className="detail-meta-value">
                                  {item.metodo ? item.metodo.replace(/_/g, " ") : "Autoinforme"} · {item.nivel_uso ? item.nivel_uso.replace(/_/g, " ") : "Cribado"}
                                </span>
                              </div>

                              <div className="detail-meta-item">
                                <span className="detail-meta-label">Cualificación requerida</span>
                                <span className={`detail-meta-badge cualificacion-${item.cualificacion || "libre"}`}>
                                  {item.cualificacion === "restringido"
                                    ? "Restringido (Cualificación requerida)"
                                    : item.cualificacion === "formacion_especifica"
                                    ? "Formación específica requerida"
                                    : "Libre uso profesional"}
                                </span>
                              </div>

                              <div className="detail-meta-item">
                                <span className="detail-meta-label">Baremos locales</span>
                                <span className="detail-meta-value baremos-alerta">
                                  {item.baremos_locales ? `Baremos locales: ${item.baremos_locales}` : "Baremos locales: no verificado"}
                                </span>
                              </div>
                            </div>

                            {/* Áreas de Aplicación Interdisciplinar */}
                            {item.ambitos && item.ambitos.length > 0 && (
                              <div className="detail-ambitos-box">
                                <span className="detail-meta-label">Áreas de aplicación interdisciplinar</span>
                                <div className="detail-ambitos-list">
                                  {item.ambitos.map((ambId) => {
                                    const ambMeta = AMBITOS.find((a) => a.id === ambId);
                                    if (!ambMeta) return null;
                                    return (
                                      <span
                                        key={ambId}
                                        className="detail-ambito-pill"
                                        style={
                                          {
                                            "--badge-bg": ambMeta.color_tema.badge_bg,
                                            "--badge-text": ambMeta.color_tema.badge_text,
                                            "--badge-border": ambMeta.color_tema.accent_border,
                                          } as React.CSSProperties
                                        }
                                      >
                                        {ambMeta.nombre_corto || ambMeta.nombre}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {(() => {
                            const cleanSigla = (s: string) => s.trim().replace(/[\/\\]/g, '-').replace(/\s+/g, '_');
                            const fichaName = item.archivos?.find(a => a.toLowerCase().includes('ficha_tecnica')) || `${cleanSigla(item.sigla)}_ficha_tecnica.pdf`;
                            const protoName = item.archivos?.find(a => a.toLowerCase().includes('protocolo')) || `${cleanSigla(item.sigla)}_protocolo.pdf`;
                            
                            return (
                              <div className="file-list">
                                {/* Ficha técnica */}
                                <a
                                  href={`/instrumentos/eje-${item.eje_num}/${item.family_id}/${fichaName}`}
                                  download={fichaName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <span className="file-icon">
                                    <FileText size={18} />
                                  </span>
                                  <span>
                                    <strong>Ficha técnica</strong>
                                    <small>{fichaName} · PDF</small>
                                  </span>
                                  <Download size={16} />
                                </a>

                                {/* Protocolo (si descargable) o Etiqueta Protocolo según condición */}
                                {item.descargable ? (
                                  <a
                                    href={`/instrumentos/eje-${item.eje_num}/${item.family_id}/${protoName}`}
                                    download={protoName}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <span className="file-icon">
                                      <FileText size={18} />
                                    </span>
                                    <span>
                                      <strong>Protocolo</strong>
                                      <small>{protoName} · PDF</small>
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
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
              ) : (
                <div className="empty-section-notice" style={{ padding: "14px 20px", color: "var(--muted)", fontStyle: "italic", fontSize: "12px" }}>
                  No hay instrumentos en esta sección para los filtros activos.
                </div>
              )}
            </section>
          );
        })}
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
