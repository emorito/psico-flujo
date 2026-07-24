"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Download,
  FileText,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import rawFiles from "../../data/eje1-files.json";
import { instrumentMeta } from "../../data/eje1-meta";

type RawFiles = Record<string, string[]>;
const files = rawFiles as RawFiles;

const areas = [
  "Todos",
  "Ansiedad y estrés",
  "Depresión y afecto",
  "Trauma y violencia",
  "Riesgo y conducta",
  "Consumo y adicciones",
  "TOC y síntomas relacionados",
  "Psicosis y síntomas graves",
  "Infancia y adolescencia",
  "Somatización y salud",
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
  return file
    .replace(/\.(pdf|docx?)$/i, "")
    .replaceAll("_", " ")
    .replace(/Scale/gi, "Escala");
}

export function InstrumentLibrary() {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("Todos");
  const [open, setOpen] = useState<string | null>(null);

  const instruments = useMemo(
    () => instrumentMeta.map((item) => ({ ...item, files: files[item.slug] ?? [] })),
    []
  );
  const filtered = instruments.filter((item) => {
    const q = query.trim().toLocaleLowerCase("es");
    return (
      (area === "Todos" || item.area === area) &&
      (!q ||
        `${item.code} ${item.name} ${item.description} ${item.area}`
          .toLocaleLowerCase("es")
          .includes(q))
    );
  });
  const grouped = areas
    .filter((item) => item !== "Todos")
    .map((item) => ({
      area: item,
      items: filtered.filter((instrument) => instrument.area === item),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <section className="library-section" aria-label="Biblioteca de instrumentos del Eje I">
      <div className="library-heading">
        <div>
          <span className="overline">Biblioteca del Eje I</span>
          <h2>Encuentra el instrumento adecuado.</h2>
        </div>
        <span className="catalog-count">{instruments.length} instrumentos · 104 documentos</span>
      </div>

      <div className="catalog-controls">
        <label className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, sigla o área…"
            aria-label="Buscar instrumentos"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Limpiar búsqueda">
              <X size={16} />
            </button>
          )}
        </label>
        <label className="area-select">
          <SlidersHorizontal size={16} />
          <select value={area} onChange={(event) => setArea(event.target.value)} aria-label="Filtrar por área">
            {areas.map((item) => <option key={item}>{item}</option>)}
          </select>
          <ChevronDown size={15} />
        </label>
      </div>

      <div className="area-tags" role="group" aria-label="Áreas de exploración">
        {areas.map((item) => {
          const count = item === "Todos"
            ? instruments.length
            : instruments.filter((instrument) => instrument.area === item).length;
          return (
            <button
              className={area === item ? "active" : ""}
              onClick={() => { setArea(item); setOpen(null); }}
              aria-pressed={area === item}
              key={item}
            >
              <span>{item}</span>
              <small>{count}</small>
            </button>
          );
        })}
      </div>

      <div className="catalog-summary">
        <span>{filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}</span>
        <span>{area === "Todos" ? `${grouped.length} áreas de exploración` : area}</span>
      </div>

      {filtered.length ? (
        <div className="instrument-groups">
          {grouped.map((group) => (
            <section className="instrument-group" aria-labelledby={`area-${group.area}`} key={group.area}>
              <div className="group-heading">
                <span className="group-marker" />
                <h3 id={`area-${group.area}`}>{group.area}</h3>
                <span>{group.items.length} {group.items.length === 1 ? "instrumento" : "instrumentos"}</span>
              </div>
              <div className="instrument-list">
                {group.items.map((item, index) => {
                  const isOpen = open === item.slug;
                  return (
                    <article className={`instrument-row ${isOpen ? "open" : ""}`} key={item.slug}>
                      <button
                        className="instrument-main"
                        onClick={() => setOpen(isOpen ? null : item.slug)}
                        aria-expanded={isOpen}
                      >
                        <span className="row-number">{String(index + 1).padStart(2, "0")}</span>
                        <span className="code-badge">{item.code}</span>
                        <span className="instrument-copy">
                          <strong>{item.name}</strong>
                          <small>{item.description}</small>
                        </span>
                        <span className="row-area">{item.use}</span>
                        <span className="row-files">{item.files.length} {item.files.length === 1 ? "archivo" : "archivos"}</span>
                        <span className="expand-icon"><ChevronDown size={17} /></span>
                      </button>

                      {isOpen && (
                        <div className="instrument-detail">
                          <div className="detail-context">
                            <span>Uso sugerido</span>
                            <strong>{item.use}</strong>
                            <p>{item.description}</p>
                          </div>
                          <div className="file-list">
                            {item.files.map((file) => (
                              <a
                                href={`/instrumentos/eje-1/${item.slug}/${encodeURIComponent(file)}`}
                                download
                                key={file}
                              >
                                <span className="file-icon"><FileText size={16} /></span>
                                <span>
                                  <strong>{fileKind(file)}</strong>
                                  <small>{prettyFile(file)} · {file.split(".").pop()?.toUpperCase()}</small>
                                </span>
                                <Download size={16} />
                              </a>
                            ))}
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
          <p>Prueba otra palabra o selecciona todas las áreas.</p>
          <button onClick={() => { setQuery(""); setArea("Todos"); }}>Limpiar filtros</button>
        </div>
      )}
    </section>
  );
}
