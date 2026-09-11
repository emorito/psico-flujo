"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { ArrowRight, Check, Compass, X } from "lucide-react";
import { AXES, catalog } from "./instrument-library";

interface AxisCardsProps {
  onSelectAxis: (axisNum: number) => void;
  onSelectAxisAndTheme: (axisNum: number, theme: string) => void;
}

export function AxisCards({ onSelectAxis, onSelectAxisAndTheme }: AxisCardsProps) {
  const [activeAxis, setActiveAxis] = useState<number | null>(null);
  const triggerRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Axis item counts
  const axisCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const item of catalog) {
      counts[item.eje_num] = (counts[item.eje_num] || 0) + 1;
    }
    return counts;
  }, []);

  // Axis primary theme counts: sum of counts === axis count
  const axisThemesMap = useMemo(() => {
    const map: Record<number, { name: string; count: number }[]> = {};
    for (const ax of AXES) {
      const items = catalog.filter((it) => it.eje_num === ax.num);
      const counts: Record<string, number> = {};
      for (const it of items) {
        const t = it.temas?.[0];
        if (t) {
          counts[t] = (counts[t] || 0) + 1;
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

  const handleMouseEnter = (num: number) => {
    // Only on non-touch screens (hover)
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      setActiveAxis(num);
    }
  };

  const handleMouseLeave = () => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        setActiveAxis(null);
      }, 250);
    }
  };

  const handlePanelMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handlePanelMouseLeave = () => {
    handleMouseLeave();
  };

  const handleCardClick = (num: number) => {
    if (activeAxis === num) {
      setActiveAxis(null);
    } else {
      setActiveAxis(num);
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
              onMouseEnter={() => handleMouseEnter(axis.num)}
              onMouseLeave={handleMouseLeave}
              role="listitem"
            >
              <button
                type="button"
                className="axis-card-trigger"
                ref={(el) => { triggerRefs.current[axis.num] = el; }}
                onClick={() => handleCardClick(axis.num)}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                aria-controls={`axis-panel-${axis.num}`}
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
                  <ArrowRight size={16} className="axis-card-arrow" />
                </div>
              </button>

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
                    onMouseEnter={handlePanelMouseEnter}
                    onMouseLeave={handlePanelMouseLeave}
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
