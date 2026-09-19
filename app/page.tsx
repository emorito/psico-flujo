"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ShieldCheck, X, ArrowDown } from "lucide-react";
import { InstrumentLibrary, catalog, indiceData, searchIndex } from "./ui/instrument-library";
import { buscar } from "../buscador_indice";
import { AxisCards } from "./ui/axis-cards";
import { GuiaOrientacion } from "./ui/guia-orientacion";
import { FiltrosGuia } from "./lib/guia";
import acercaData from "../data/acerca.json";

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedAxis, setSelectedAxis] = useState<number | "all">("all");
  const [selectedFranja, setSelectedFranja] = useState<string>("all");
  const [selectedTheme, setSelectedTheme] = useState<string>("all");
  const [selectedFuncion, setSelectedFuncion] = useState<string>("all");
  const [selectedTipo, setSelectedTipo] = useState<string>("all");
  const [selectedLibre, setSelectedLibre] = useState<boolean>(false);
  const [showGuia, setShowGuia] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState(false);

  // Compact header on scroll y lectura inicial de guia=1 y q
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("guia") === "1") {
        setShowGuia(true);
      }
      const initialQ = params.get("q");
      if (initialQ) {
        setQuery(initialQ);
      }
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const heroSearchCount = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return null;
    const hits = buscar(searchIndex, trimmed, { limite: catalog.length });
    return hits.length;
  }, [query]);

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
  const totalThemes = useMemoThemeCount();

  const handleSelectAxis = (axisNum: number) => {
    setSelectedAxis(axisNum);
    setSelectedTheme("all");
  };

  const handleSelectAxisAndTheme = (axisNum: number, theme: string) => {
    setSelectedAxis(axisNum);
    setSelectedTheme(theme);
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
    setQuery("");
  };

  return (
    <main>
      {/* Encabezado: marca + "Instrumentos" (#biblioteca) + "Acerca de" (#acerca). Se compacta al desplazar. */}
      <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
        <a className="brand" href="#inicio" aria-label="Psico Flujo, inicio">
          <span className="brand-symbol" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>psico<span>·</span>flujo</span>
        </a>
        <nav aria-label="Navegación principal">
          <a href="#biblioteca">Instrumentos</a>
          <a href="#acerca">Acerca de</a>
        </nav>
      </header>

      {/* Portada: título actual, frase de propósito, campo de búsqueda real y cifras en una sola línea de texto. Sin insignia ni botones. */}
      <section className="hero" id="inicio">
        <div className="hero-backdrop" />
        <div className="hero-content">
          <h1>Evaluar es trazar <span>un mapa para comprender.</span></h1>
          <p className="hero-purpose">
            Instrumentos de evaluación psicológica de uso libre, organizados en seis ejes, con ficha técnica verificada.
          </p>

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
                placeholder="Buscar por sigla, nombre, constructo o tema (ej. PHQ, BDI, TOC, TEPT, ansiedad, depresión)…"
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
                <button
                  type="button"
                  className="hero-search-results-btn"
                  onClick={() => handleHeroSearchSubmit()}
                  aria-label={`Ver resultados de búsqueda (${heroSearchCount ?? 0} instrumentos)`}
                >
                  <span>
                    {heroSearchCount === 0
                      ? `Sin coincidencias directas para “${query.trim()}” — Ver catálogo completo`
                      : `Ver ${heroSearchCount} ${heroSearchCount === 1 ? "instrumento encontrado" : "instrumentos encontrados"} ↓`}
                  </span>
                  <ArrowDown size={14} />
                </button>
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

          <p className="hero-stats-line">
            {totalFamilies} instrumentos · {totalDocs} documentos · {totalAxes} ejes · {totalThemes} temas
          </p>
        </div>
      </section>

      {/* Seis rutas: Seis tarjetas de eje interactivas (cuando la guía está activa, la biblioteca va de inmediato para actualizar en vivo) */}
      {!showGuia && (
        <AxisCards
          onSelectAxis={handleSelectAxis}
          onSelectAxisAndTheme={handleSelectAxisAndTheme}
        />
      )}

      {/* Biblioteca con buscador y barra única de filtros */}
      <InstrumentLibrary
        query={query}
        setQuery={setQuery}
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
      />

      {showGuia && (
        <AxisCards
          onSelectAxis={handleSelectAxis}
          onSelectAxisAndTheme={handleSelectAxisAndTheme}
        />
      )}

      {/* Uso profesional responsable (una sola frase) */}
      <section className="responsible-use" aria-label="Uso profesional responsable">
        <ShieldCheck size={24} />
        <div>
          <strong>Uso profesional responsable</strong>
          <p>{acercaData.uso_responsable}</p>
        </div>
      </section>

      {/* Sección nueva "Acerca de" antes del pie */}
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

      {/* Pie con mención académica, versión y enlace a Acerca de */}
      <footer className="site-footer">
        <a className="brand footer-brand" href="#inicio" aria-label="Inicio">
          <span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span>
          <span>psico<span>·</span>flujo</span>
        </a>
        <p className="footer-academic">Facultad de Filosofía · Universidad Nacional del Este</p>
        <div className="footer-links">
          <a href="#biblioteca">Instrumentos</a>
          <a href="#acerca">Acerca de</a>
        </div>
        <span className="footer-version">v1.3 · 2026-09-11</span>
      </footer>
    </main>
  );
}

function useMemoThemeCount() {
  return indiceData.temas.length;
}
