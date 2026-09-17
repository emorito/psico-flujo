"use client";

import { useState, useEffect } from "react";
import { Search, ShieldCheck, X } from "lucide-react";
import { InstrumentLibrary, catalog } from "./ui/instrument-library";
import { AxisCards } from "./ui/axis-cards";
import acercaData from "../data/acerca.json";

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedAxis, setSelectedAxis] = useState<number | "all">("all");
  const [selectedFranja, setSelectedFranja] = useState<string>("all");
  const [selectedTheme, setSelectedTheme] = useState<string>("all");
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

          <div className="hero-search-wrapper">
            <label className="search-box hero-search-box">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
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
            </label>
          </div>

          <p className="hero-stats-line">
            {totalFamilies} instrumentos · {totalDocs} documentos · {totalAxes} ejes · {totalThemes} temas
          </p>
        </div>
      </section>

      {/* Seis rutas: Seis tarjetas de eje interactivas */}
      <AxisCards
        onSelectAxis={handleSelectAxis}
        onSelectAxisAndTheme={handleSelectAxisAndTheme}
      />

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
      />

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
  const set = new Set<string>();
  for (const it of catalog) {
    if (it.temas && it.temas[0]) {
      set.add(it.temas[0]);
    }
  }
  return set.size;
}
