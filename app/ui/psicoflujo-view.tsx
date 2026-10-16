"use client";

import { useState, useEffect, useMemo, useDeferredValue } from "react";
import Link from "next/link";
import { Search, X, ArrowDown } from "lucide-react";
import { InstrumentLibrary, catalog, indiceData, searchIndex } from "./instrument-library";
import { buscar } from "../../buscador_indice";
import { AxisCards } from "./axis-cards";
import { DecisionCards } from "./decision-cards";
import { AmbitoGateway } from "./ambito-gateway";
import { GuiaOrientacion } from "./guia-orientacion";
import { FiltrosGuia } from "../lib/guia";
import acercaData from "../../data/acerca.json";
import ambitosData from "../../data/ambitos.json";

interface PsicoflujoViewProps {
  initialAmbito?: string;
}

const HERO_HEROIC_TITLES: Record<string, { title: string; subtitle?: string }> = {
  educativo: {
    title: "Evaluar en la escuela es trazar caminos de apoyo y aprendizaje.",
    subtitle: "81 instrumentos psicopedagógicos para decisiones de ajuste razonable, funciones ejecutivas y desarrollo socioemocional."
  },
  vocacional: {
    title: "Construir proyectos de vida con evidencia, sentido y autoconocimiento.",
    subtitle: "21 instrumentos especializados en intereses ocupacionales (RIASEC), hábitos de estudio y autoeficacia vocacional."
  },
  salud: {
    title: "Evaluar el impacto de la salud en la cognición y la adaptación.",
    subtitle: "78 instrumentos para cribado neuropsicológico, adherencia al tratamiento médico y calidad de vida."
  },
  laboral: {
    title: "Evaluar con validez, equidad y rigor en las organizaciones.",
    subtitle: "42 instrumentos para evaluación del desempeño, clima laboral, competencias y bienestar en el trabajo."
  },
  juridico: {
    title: "Rigor psicométrico para la evaluación pericial y forense.",
    subtitle: "37 instrumentos para evaluación pericial, capacidad civil, credibilidad del testimonio y valoración de secuelas."
  },
  clinico: {
    title: "Evaluar es trazar un mapa para comprender el malestar y orientar el cambio.",
    subtitle: "233 instrumentos para evaluación dimensional de severidad, psicopatología, trauma y personalidad estructural."
  },
  deporte: {
    title: "Optimizar el rendimiento psicológico y el bienestar atlético.",
    subtitle: "9 instrumentos para concentración, ansiedad competitiva, autoconfianza y activación en el deporte."
  },
  cultural: {
    title: "Comprender la vivencia psicológica en su entramado cultural y comunitario.",
    subtitle: "9 instrumentos para redes de apoyo, bienestar social, vivencia transcultural y bilingüismo."
  }
};

export function normalizeAmbito(id?: string | null): string {
  if (!id || id === "all" || id === "general") return "all";
  const clean = id.trim().toLowerCase();
  if (clean === "educativa") return "educativo";
  if (clean === "forense") return "juridico";
  if (clean === "clinica") return "clinico";
  return clean;
}

export function PsicoflujoView({ initialAmbito = "all" }: PsicoflujoViewProps) {
  const normalizedInitial = normalizeAmbito(initialAmbito);

  const [selectedAmbito, setSelectedAmbito] = useState<string>(() => {
    if (normalizedInitial && normalizedInitial !== "all") return normalizedInitial;
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("ambito");
      return normalizeAmbito(param);
    }
    return "all";
  });

  const [selectedSeccion, setSelectedSeccion] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("sec") || "all";
    }
    return "all";
  });

  // Sincronizar initialAmbito cuando cambie la ruta dinámica o prop
  useEffect(() => {
    const norm = normalizeAmbito(initialAmbito);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedAmbito(norm);
    setSelectedSeccion("all");
  }, [initialAmbito]);

  const [query, setQuery] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("q") || "";
    }
    return "";
  });
  const deferredQuery = useDeferredValue(query);

  const [selectedAxis, setSelectedAxis] = useState<number | "all">("all");
  const [selectedFranja, setSelectedFranja] = useState<string>("all");
  const [selectedTheme, setSelectedTheme] = useState<string>("all");
  const [selectedFuncion, setSelectedFuncion] = useState<string>("all");
  const [selectedTipo, setSelectedTipo] = useState<string>("all");
  const [selectedLibre, setSelectedLibre] = useState<boolean>(false);

  const [showGuia] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("guia") === "1";
    }
    return false;
  });

  const [scrolled, setScrolled] = useState(false);

  // Compact header on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const normalizedCurrentAmbito = normalizeAmbito(selectedAmbito);
  const isCustomAmbito = normalizedCurrentAmbito !== "all";
  const activeAmbitoData = useMemo(() => {
    if (!isCustomAmbito) return null;
    return ambitosData.find((a) => a.id === normalizedCurrentAmbito) || null;
  }, [isCustomAmbito, normalizedCurrentAmbito]);

  const searchResults = useMemo(() => {
    const trimmed = deferredQuery.trim();
    if (!trimmed) return null;
    const raw = buscar(searchIndex, trimmed, { limite: catalog.length });
    if (!activeAmbitoData) return raw;
    const aid = activeAmbitoData.id;
    return raw.filter((r) => {
      const catItem = catalog.find((c) => c.family_id === r.id);
      return catItem?.ambitos?.includes(aid);
    });
  }, [deferredQuery, activeAmbitoData]);

  const heroSearchCount = searchResults ? searchResults.length : null;

  const handleHeroSearchSubmit = (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    const el = document.getElementById("biblioteca");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const totalFamilies = catalog.length;
  const totalDocs = catalog.reduce((acc, item) => acc + item.archivos.length, 0);
  const totalAxes = new Set(catalog.map((item) => item.eje_num)).size;
  const totalThemes = indiceData.temas.length;

  const currentAmbitoInstrumentsCount = useMemo(() => {
    if (!activeAmbitoData) return totalFamilies;
    const aid = activeAmbitoData.id;
    return catalog.filter((item) => item.ambitos?.includes(aid)).length;
  }, [activeAmbitoData, totalFamilies]);

  const handleSelectAxis = (axisNum: number) => {
    setSelectedAxis(axisNum);
    setSelectedTheme("all");
    setSelectedAmbito("all");
    setSelectedSeccion("all");
  };

  const handleSelectAxisAndTheme = (axisNum: number, theme: string) => {
    setSelectedAxis(axisNum);
    setSelectedTheme(theme);
    setSelectedAmbito("all");
    setSelectedSeccion("all");
  };

  const handleSelectSeccion = (secId: string) => {
    setSelectedSeccion(secId);
    setSelectedAxis("all");
    setSelectedTheme("all");
  };

  const filtrosActuales: FiltrosGuia = {
    edad: selectedFranja,
    eje: selectedAxis,
    tema: selectedTheme,
    fn: selectedFuncion,
    quien: selectedTipo,
    libre: selectedLibre,
    q: query,
  };

  const handleFilterChange = (nuevos: Partial<FiltrosGuia>) => {
    if (nuevos.edad !== undefined) setSelectedFranja(nuevos.edad);
    if (nuevos.eje !== undefined) setSelectedAxis(nuevos.eje);
    if (nuevos.tema !== undefined) setSelectedTheme(nuevos.tema);
    if (nuevos.fn !== undefined) setSelectedFuncion(nuevos.fn);
    if (nuevos.quien !== undefined) setSelectedTipo(nuevos.quien);
    if (nuevos.libre !== undefined) setSelectedLibre(nuevos.libre);
    if (nuevos.q !== undefined) setQuery(nuevos.q);
  };

  const handleClearFilter = (param: keyof FiltrosGuia) => {
    if (param === "edad") setSelectedFranja("all");
    else if (param === "eje") setSelectedAxis("all");
    else if (param === "tema") setSelectedTheme("all");
    else if (param === "fn") setSelectedFuncion("all");
    else if (param === "quien") setSelectedTipo("all");
    else if (param === "libre") setSelectedLibre(false);
    else if (param === "q") setQuery("");
  };

  const handleResetAll = () => {
    setSelectedFranja("all");
    setSelectedAxis("all");
    setSelectedTheme("all");
    setSelectedFuncion("all");
    setSelectedTipo("all");
    setSelectedLibre(false);
    setSelectedAmbito("all");
    setSelectedSeccion("all");
    setQuery("");
  };

  // Textos dinámicos del hero según ámbito
  const heroContent = useMemo(() => {
    if (!isCustomAmbito || !activeAmbitoData) {
      return {
        h1: "Evaluar es trazar un mapa para comprender.",
        purpose: "Instrumentos de evaluación psicológica de uso libre, organizados en seis ejes, con ficha técnica verificada.",
        stats: `${totalFamilies} instrumentos · ${totalDocs} documentos · ${totalAxes} ejes · ${totalThemes} temas`
      };
    }

    const aid = activeAmbitoData.id;
    const customText = HERO_HEROIC_TITLES[aid];
    const secCount = activeAmbitoData.secciones.length;

    return {
      h1: customText?.title || `Evaluación en ${activeAmbitoData.nombre}.`,
      purpose: customText?.subtitle || activeAmbitoData.descripcion,
      stats: `${currentAmbitoInstrumentsCount} instrumentos · ${secCount} dimensiones rectoras · Sin baremos locales verificados`
    };
  }, [isCustomAmbito, activeAmbitoData, totalFamilies, totalDocs, totalAxes, totalThemes, currentAmbitoInstrumentsCount]);

  return (
    <main className="psicoflujo-main-wrapper" data-theme={selectedAmbito}>
      <a href="#biblioteca" className="skip-link">
        Saltar al contenido
      </a>

      {/* Encabezado: marca + "Instrumentos" (#biblioteca) + "Acerca de" (#acerca) */}
      <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
        <Link className="brand" href="/" aria-label="Psico Flujo, inicio">
          <span className="brand-symbol" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>psico<span>·</span>flujo</span>
          {isCustomAmbito && activeAmbitoData && (
            <span className="brand-ambito-pill">{activeAmbitoData.nombre_corto}</span>
          )}
        </Link>
        <nav aria-label="Navegación principal">
          <a href="#biblioteca">Instrumentos</a>
          <a href="#acerca">Acerca de</a>
        </nav>
      </header>

      {/* Capa de Orientación por Ámbitos (justo debajo del encabezado) */}
      <AmbitoGateway
        currentAmbito={selectedAmbito}
        instrumentCount={currentAmbitoInstrumentsCount}
      />

      {/* Portada Hero: se adapta al ámbito o se mantiene canónica */}
      <section className="hero" id="inicio">
        <div className="hero-backdrop" />
        <div className="hero-content">
          <h1>{heroContent.h1}</h1>
          <p className="hero-purpose">{heroContent.purpose}</p>

          <form role="search" className="hero-search-wrapper" onSubmit={handleHeroSearchSubmit}>
            <label className="search-box hero-search-box">
              <Search size={18} className="hero-search-icon" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleHeroSearchSubmit();
                  }
                }}
                placeholder={
                  isCustomAmbito && activeAmbitoData
                    ? `Buscar en ${activeAmbitoData.nombre_corto} (ej. ${activeAmbitoData.id === 'educativo' ? 'BRIEF, EFECO, atención' : 'sigla, autor, tema'})…`
                    : "Buscar por sigla, nombre o tema (ej. PHQ, BDI, ansiedad)…"
                }
                aria-label="Buscar instrumentos en catálogo"
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
              <button
                type="submit"
                className="hero-search-submit-btn"
                aria-label="Buscar en biblioteca de instrumentos"
              >
                Buscar
              </button>
            </label>

            {query.trim() && (
              <div className="hero-search-feedback">
                <a
                  href="#biblioteca"
                  className="hero-search-results-btn"
                  onClick={handleHeroSearchSubmit}
                  aria-label={`Ver resultados de búsqueda (${heroSearchCount ?? 0} resultados)`}
                >
                  <span>
                    {heroSearchCount === 0
                      ? `Sin resultados para “${query.trim()}” — Ver biblioteca`
                      : `Ver ${heroSearchCount} ${heroSearchCount === 1 ? "resultado" : "resultados"}`}
                  </span>
                  <ArrowDown size={14} />
                </a>
              </div>
            )}
          </form>

          {/* Recorrido guiado de orientación clínica (?guia=1) */}
          {showGuia && (
            <GuiaOrientacion
              filtros={filtrosActuales}
              onFilterChange={handleFilterChange}
              onClearFilter={handleClearFilter}
              onResetAll={handleResetAll}
            />
          )}

          <p className="hero-stats-line">{heroContent.stats}</p>
        </div>
      </section>

      {/* Tarjetas de Navegación: 
          Si estamos en modo General: se renderizan las 6 AxisCards canónicas.
          Si estamos en un Ámbito: se renderizan las DecisionCards rectoras de ese ámbito. */}
      {!showGuia && !isCustomAmbito && (
        <AxisCards
          onSelectAxis={handleSelectAxis}
          onSelectAxisAndTheme={handleSelectAxisAndTheme}
        />
      )}

      {!showGuia && isCustomAmbito && (
        <DecisionCards
          ambitoId={selectedAmbito}
          onSelectSeccion={handleSelectSeccion}
          selectedSeccion={selectedSeccion}
        />
      )}

      {/* Biblioteca con buscador y filtros */}
      <InstrumentLibrary
        query={query}
        setQuery={setQuery}
        searchResults={searchResults}
        selectedAxis={selectedAxis}
        setSelectedAxis={setSelectedAxis}
        selectedFranja={selectedFranja}
        setSelectedFranja={setSelectedFranja}
        selectedTheme={selectedTheme}
        setSelectedTheme={setSelectedTheme}
        selectedFuncion={selectedFuncion}
        setSelectedFuncion={setSelectedFuncion}
        selectedTipo={selectedTipo}
        setSelectedTipo={setSelectedTipo}
        selectedLibre={selectedLibre}
        setSelectedLibre={setSelectedLibre}
        selectedAmbito={selectedAmbito}
        setSelectedAmbito={setSelectedAmbito}
        selectedSeccion={selectedSeccion}
        setSelectedSeccion={setSelectedSeccion}
      />

      {/* Sección "Acerca de" antes del pie */}
      <section className="about-section" id="acerca" aria-label="Acerca de Psico·Flujo">
        <div className="about-container">
          <div className="about-header">
            <span className="overline">Marco institucional y metodológico</span>
            <h2>Acerca de Psico·Flujo</h2>
          </div>

          <div className="about-grid">
            <article className="about-card">
              <h3>Propósito</h3>
              <p>{acercaData.proposito}</p>
            </article>

            <article className="about-card">
              <h3>Cómo se construyó</h3>
              <p>{acercaData.como_se_construyo}</p>
            </article>

            <article className="about-card">
              <h3>Marco académico</h3>
              <p>{acercaData.marco_academico}</p>
            </article>
          </div>

          <div className="about-author-line">
            <p><strong>Autoría:</strong> {acercaData.autoria}</p>
          </div>
        </div>
      </section>

      {/* Pie con mención académica y versión */}
      <footer className="site-footer">
        <Link className="brand footer-brand" href="/" aria-label="Inicio">
          <span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span>
          <span>psico<span>·</span>flujo</span>
        </Link>
        <p className="footer-academic">Facultad de Filosofía · Universidad Nacional del Este</p>
        <div className="footer-links">
          <a href="#biblioteca">Instrumentos</a>
          <a href="#acerca">Acerca de</a>
        </div>
        <span className="footer-version">v2.0 · Ámbitos de Evaluación</span>
      </footer>
    </main>
  );
}
