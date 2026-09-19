"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { ArrowRight, Check, Compass, X } from "lucide-react";
import { AXES, catalog, indiceData, indexThemeMap } from "./instrument-library";

interface AxisCardsProps {
  onSelectAxis: (axisNum: number) => void;
  onSelectAxisAndTheme: (axisNum: number, theme: string) => void;
}

export function AxisCards({ onSelectAxis, onSelectAxisAndTheme }: AxisCardsProps) {
  const [activeAxis, setActiveAxis] = useState<number | null>(null);
  const triggerRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  // Axis item counts
  const axisCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const item of catalog) {
      counts[item.eje_num] = (counts[item.eje_num] || 0) + 1;
    }
    return counts;
  }, []);

  // Axis primary theme counts derived from indice_psicoflujo
  const axisThemesMap = useMemo(() => {
    const map: Record<number, { name: string; count: number }[]> = {};
    for (const ax of AXES) {
      const counts: Record<string, number> = {};
      for (const f of indiceData.familias) {
        if (f.eje === ax.num) {
          const tName = indexThemeMap.get(f.tema)?.nombre;
          if (tName) {
            counts[tName] = (counts[tName] || 0) + 1;
          }
        }
      }
      map[ax.num] = Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([name, count]) => ({ name, count }));
    }
    return map;
  }, []);

  // Close active modal and optionally refocus trigger
  const closeAxisModal = useCallback((refocus = false) => {
    setActiveAxis((prev) => {
      if (refocus && prev && triggerRefs.current[prev]) {
        triggerRefs.current[prev]?.focus();
      }
      return null;
    });
  }, []);

  // Keyboard navigation: Escape closes panel and returns focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeAxis !== null) {
        e.preventDefault();
        closeAxisModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeAxis, closeAxisModal]);

  const handleCardClick = (axisNum: number) => {
    onSelectAxis(axisNum);
    const el = document.getElementById("biblioteca");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleArrowClick = (e: React.MouseEvent, axisNum: number) => {
    e.stopPropagation();
    if (activeAxis === axisNum) {
      closeAxisModal(true);
    } else {
      setActiveAxis(axisNum);
    }
  };

  const handleThemeClick = (axisNum: number, themeName: string) => {
    closeAxisModal(false);
    onSelectAxisAndTheme(axisNum, themeName);
    const el = document.getElementById("biblioteca");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleViewAll = (axisNum: number) => {
    closeAxisModal(false);
    onSelectAxis(axisNum);
    const el = document.getElementById("biblioteca");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="model-section" id="modelo" aria-label="Arquitectura clínica de seis ejes">
      <div className="section-intro">
        <div>
          <span className="overline"><Compass size={14} /> Arquitectura Psico·Flujo</span>
          <h2>Seis rutas para una mirada integral.</h2>
        </div>
        <p>
          Un sistema que ordena la evaluación sin reducir su complejidad.
          Cada eje reúne instrumentos relacionados con una dimensión esencial
          de la formulación clínica.
        </p>
      </div>

      {/* Grid de 6 tarjetas interactivas */}
      <div className="axes-cards-grid" role="list">
        {AXES.map((axis) => {
          const count = axisCounts[axis.num] || 0;
          const isOpen = activeAxis === axis.num;
          return (
            <div
              key={axis.num}
              className={`axis-card-wrapper ${isOpen ? "open" : ""}`}
              role="listitem"
            >
              <div
                className="axis-card-trigger"
                onClick={() => handleCardClick(axis.num)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick(axis.num);
                  }
                }}
                data-axis={axis.num}
              >
                <div className="axis-card-top">
                  <span className="axis-badge">Eje 0{axis.num}</span>
                  <span className="axis-inst-count">{count} {count === 1 ? "instrumento" : "instrumentos"}</span>
                </div>
                <strong className="axis-card-title">{axis.nombre}</strong>
                <span className="axis-card-sub">{axis.subtitulo}</span>
                <div className="axis-card-footer">
                  <span className="axis-card-status">
                    <Check size={14} /> Disponible
                  </span>
                  <button
                    type="button"
                    className="axis-card-arrow-btn"
                    ref={(el) => { triggerRefs.current[axis.num] = el; }}
                    onClick={(e) => handleArrowClick(e, axis.num)}
                    aria-expanded={isOpen}
                    aria-haspopup="dialog"
                    aria-controls={`axis-panel-${axis.num}`}
                    aria-label={`Ver información detallada del ${axis.label}`}
                    title="Ver información del eje"
                  >
                    <ArrowRight size={16} className="axis-card-arrow" />
                  </button>
                </div>
              </div>

              {/* Panel / Pestaña interactiva de eje */}
              {isOpen && (
                <div
                  className="axis-panel-overlay"
                  onClick={() => closeAxisModal(true)}
                  aria-hidden={!isOpen}
                >
                  <div
                    id={`axis-panel-${axis.num}`}
                    className="axis-panel-card"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={`axis-panel-title-${axis.num}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="axis-panel-header">
                      <div>
                        <span className="axis-panel-overline">{axis.label}</span>
                        <h3 id={`axis-panel-title-${axis.num}`} className="axis-panel-title">
                          {axis.nombre}
                        </h3>
                        <p className="axis-panel-sub">{axis.subtitulo}</p>
                      </div>
                      <button
                        type="button"
                        className="axis-panel-close-btn"
                        onClick={() => closeAxisModal(true)}
                        aria-label="Cerrar pestaña de eje"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="axis-panel-body">
                      {/* Qué es */}
                      <div className="axis-panel-block">
                        <span className="axis-panel-label">¿Qué es?</span>
                        <p className="axis-panel-text">{axis.que_es}</p>
                      </div>

                      {/* Por qué evaluarlo */}
                      <div className="axis-panel-block">
                        <span className="axis-panel-label">¿Por qué evaluarlo?</span>
                        <p className="axis-panel-text">{axis.por_que}</p>
                      </div>

                      {/* Nube de temas del eje */}
                      <div className="axis-panel-block">
                        <span className="axis-panel-label">
                          Temas de este eje ({axisThemesMap[axis.num]?.length || 0})
                        </span>
                        <div className="axis-theme-cloud" role="group" aria-label={`Temas del ${axis.label}`}>
                          {axisThemesMap[axis.num]?.map((t) => (
                            <button
                              key={t.name}
                              type="button"
                              className="axis-theme-pill"
                              onClick={() => handleThemeClick(axis.num, t.name)}
                              title={`Filtrar ${axis.label} por ${t.name} (${t.count})`}
                            >
                              <span>{t.name}</span>
                              <small>{t.count}</small>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="axis-panel-footer">
                      <button
                        type="button"
                        className="button button-primary axis-see-btn"
                        onClick={() => handleViewAll(axis.num)}
                      >
                        Ver los {count} instrumentos
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
