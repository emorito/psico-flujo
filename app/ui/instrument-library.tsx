"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Download, FileText, Search, X } from "lucide-react";
import rawFiles from "../../data/eje1-files.json";
import { instrumentMeta } from "../../data/eje1-meta";

type RawFiles = Record<string, string[]>;
const files = rawFiles as RawFiles;

const areas: { label: string; short: string }[] = [
  { label: "Todos", short: "Todos" },
  { label: "Ansiedad y estrés", short: "Ansiedad" },
  { label: "Depresión y afecto", short: "Depresión" },
  { label: "Trauma y violencia", short: "Trauma" },
  { label: "Riesgo y conducta", short: "Riesgo" },
  { label: "Consumo y adicciones", short: "Adicciones" },
  { label: "TOC y síntomas relacionados", short: "TOC" },
  { label: "Psicosis y síntomas graves", short: "Psicosis" },
  { label: "Infancia y adolescencia", short: "Infancia" },
  { label: "Somatización y salud", short: "Salud" },
];

function fileKind(file: string) {
  const lower = file.toLowerCase();
  if (lower.includes("ficha")) return "Ficha técnica";
  if (lower.includes("manual")) return "Manual";
  if (lower.includes("reference")) return "Referencia rápida";
  if (lower.includes("entrevista")) return "Entrevista";
  return "Escala";
}

function prettyFile(file: string) {
  return file.replace(/\.(pdf|docx?|PDF)$/i, "").replaceAll("_", " ").replace(/Scale/gi, "Escala");
}

export function InstrumentLibrary() {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("Todos");
  const [open, setOpen] = useState<string | null>(null);

  const instruments = useMemo(() => instrumentMeta.map((item) => ({ ...item, files: files[item.slug] ?? [] })), []);
  const filtered = instruments.filter((item) => {
    const q = query.trim().toLocaleLowerCase("es");
    return (area === "Todos" || item.area === area) && (!q || `${item.code} ${item.name} ${item.description} ${item.area}`.toLocaleLowerCase("es").includes(q));
  });

  return (
    <section className="library-section" aria-label="Biblioteca de instrumentos del Eje I">
      <div className="library-toolbar">
        <div>
          <p className="section-kicker">Biblioteca del Eje I</p>
          <h2>{instruments.length} instrumentos listos para consultar.</h2>
        </div>
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, sigla o área…" aria-label="Buscar instrumentos" />
          {query && <button onClick={() => setQuery("")} aria-label="Limpiar búsqueda"><X size={16} /></button>}
        </label>
      </div>

      <div className="filter-row" role="group" aria-label="Filtrar por área">
        {areas.map((item) => <button className={area === item.label ? "active" : ""} onClick={() => setArea(item.label)} key={item.label}>{item.short}</button>)}
      </div>

      <div className="results-line"><span>{filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}</span><span>Orden alfabético</span></div>

      {filtered.length ? <div className="instrument-grid">
        {filtered.map((item, index) => {
          const isOpen = open === item.slug;
          return <article className={`instrument-card ${isOpen ? "open" : ""}`} key={item.slug}>
            <div className="card-index">{String(index + 1).padStart(2, "0")}</div>
            <div className="area-tag">{item.area}</div>
            <h3><span>{item.code}</span>{item.name}</h3>
            <p>{item.description}</p>
            <div className="card-meta"><span>{item.use}</span><span>{item.files.length} {item.files.length === 1 ? "archivo" : "archivos"}</span></div>
            <button className="resources-toggle" onClick={() => setOpen(isOpen ? null : item.slug)} aria-expanded={isOpen}>
              Ver recursos <ChevronDown size={17} />
            </button>
            {isOpen && <div className="file-list">
              {item.files.map((file) => <a href={`/instrumentos/eje-1/${item.slug}/${encodeURIComponent(file)}`} download key={file}>
                <span className="file-icon"><FileText size={17} /></span>
                <span><strong>{fileKind(file)}</strong><small>{prettyFile(file)} · {file.split(".").pop()?.toUpperCase()}</small></span>
                <Download size={17} />
              </a>)}
            </div>}
          </article>;
        })}
      </div> : <div className="empty-state"><Search size={28} /><h3>No encontramos coincidencias</h3><p>Prueba otra palabra o selecciona “Todos”.</p><button onClick={() => { setQuery(""); setArea("Todos"); }}>Limpiar filtros</button></div>}
    </section>
  );
}
