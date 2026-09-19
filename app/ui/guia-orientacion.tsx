"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ChevronRight, RotateCcw, Search, Sparkles, X, Check } from "lucide-react";
import {
  FiltrosGuia,
  contar,
  opciones,
  siguientePaso,
  sugerirTemasPorTexto,
  guiaConfig,
} from "../lib/guia";

export interface GuiaOrientacionProps {
  filtros: FiltrosGuia;
  onFilterChange: (nuevosFiltros: Partial<FiltrosGuia>) => void;
  onClearFilter: (param: keyof FiltrosGuia) => void;
  onResetAll: () => void;
}

export function GuiaOrientacion({
  filtros,
  onFilterChange,
  onClearFilter,
  onResetAll,
}: GuiaOrientacionProps) {
  // Estado de pasos y navegación
  const [pasoActivo, setPasoActivo] = useState<string>("edad");
  const [pasosOmitidos, setPasosOmitidos] = useState<string[]>([]);
  const [historialPasos, setHistorialPasos] = useState<string[]>([]);
  const [historialFiltros, setHistorialFiltros] = useState<
    { param: keyof FiltrosGuia; valor: string | number | boolean | undefined }[]
  >([]);

  // Búsqueda libre en tema ("Lo cuento con mis palabras")
  const [textoLibre, setTextoLibre] = useState<string>(filtros.q || "");

  // Indicador de "escribiendo" (400 ms solo la primera vez por sesión)
  const [typing, setTyping] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return !sessionStorage.getItem("guia_typing_shown");
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!typing) return;
    const timer = setTimeout(() => {
      setTyping(false);
      try {
        sessionStorage.setItem("guia_typing_shown", "1");
      } catch {
        // Fallback si sessionStorage no está disponible
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [typing]);

  // Total de instrumentos actual según filtros
  const totalActual = useMemo(() => contar(filtros), [filtros]);

  // Siguiente paso automático si el actual ya está respondido
  useEffect(() => {
    // Si no hay paso activo o ya está cubierto, buscar siguiente
    const sig = siguientePaso(filtros, pasosOmitidos);
    if (sig && pasoActivo !== sig && !historialPasos.includes(sig)) {
      // Verificar si el paso actual ya fue contestado
      if (
        (pasoActivo === "edad" && filtros.edad !== undefined) ||
        (pasoActivo === "area" && filtros.eje !== undefined) ||
        (pasoActivo === "tema" && (filtros.tema !== undefined || (filtros.q && filtros.q.trim() !== ""))) ||
        (pasoActivo === "funcion" && filtros.fn !== undefined) ||
        (pasoActivo === "quien" && filtros.quien !== undefined) ||
        (pasoActivo === "libre" && filtros.libre !== undefined)
      ) {
        const timer = setTimeout(() => {
          setPasoActivo(sig);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [filtros, pasoActivo, pasosOmitidos, historialPasos]);

  // Opciones disponibles para el paso actual
  const opcionesActuales = useMemo(() => {
    if (!pasoActivo || pasoActivo === "completado") return [];
    return opciones(pasoActivo, filtros);
  }, [pasoActivo, filtros]);

  // Sugerencias de temas cuando el usuario escribe con sus palabras
  const sugerenciasTexto = useMemo(() => {
    if (pasoActivo !== "tema" || !textoLibre.trim()) return [];
    return sugerirTemasPorTexto(textoLibre, filtros);
  }, [pasoActivo, textoLibre, filtros]);

  // Lista de chips con respuestas previas activas
  const activeChips = useMemo(() => {
    const chips: { id: string; label: string; param: keyof FiltrosGuia; valor: string }[] = [];

    if (filtros.edad && filtros.edad !== "all") {
      const op = guiaConfig.pasos.edad.opciones.find((o) => o.franja === filtros.edad);
      chips.push({
        id: "edad",
        label: op ? op.label : `Edad: ${filtros.edad}`,
        param: "edad",
        valor: filtros.edad,
      });
    }

    if (filtros.eje && filtros.eje !== "all") {
      const op = guiaConfig.pasos.area.opciones.find((o) => o.eje === filtros.eje);
      chips.push({
        id: "eje",
        label: op ? op.label : `Eje ${filtros.eje}`,
        param: "eje",
        valor: String(filtros.eje),
      });
    }

    if (filtros.tema && filtros.tema !== "all") {
      chips.push({
        id: "tema",
        label: filtros.tema,
        param: "tema",
        valor: filtros.tema,
      });
    }

    if (filtros.q && filtros.q.trim()) {
      chips.push({
        id: "q",
        label: `"${filtros.q}"`,
        param: "q",
        valor: filtros.q,
      });
    }

    if (filtros.fn && filtros.fn !== "all") {
      chips.push({
        id: "fn",
        label: filtros.fn,
        param: "fn",
        valor: filtros.fn,
      });
    }

    if (filtros.quien && filtros.quien !== "all") {
      chips.push({
        id: "quien",
        label: filtros.quien,
        param: "quien",
        valor: filtros.quien,
      });
    }

    if (filtros.libre) {
      chips.push({
        id: "libre",
        label: "Solo uso libre",
        param: "libre",
        valor: "true",
      });
    }

    return chips;
  }, [filtros]);

  // Manejo de seleccionar opción
  const handleSelectOption = (param: keyof FiltrosGuia, valor: string | number | boolean | undefined) => {
    setHistorialPasos((prev) => [...prev, pasoActivo]);
    setHistorialFiltros((prev) => [...prev, { param, valor }]);

    if (valor === undefined || valor === "all") {
      // Por ejemplo "No sé / varias" en edad
      setPasosOmitidos((prev) => [...prev, pasoActivo]);
      const sig = siguientePaso(filtros, [...pasosOmitidos, pasoActivo]);
      if (sig) setPasoActivo(sig);
      else setPasoActivo("completado");
      return;
    }

    // Aplicar filtro
    const nuevosFiltros: Partial<FiltrosGuia> = { [param]: valor };
    onFilterChange(nuevosFiltros);

    // Calcular siguiente paso tras aplicar este filtro
    const filtrosFuturos = { ...filtros, [param]: valor };
    const sig = siguientePaso(filtrosFuturos, pasosOmitidos);
    if (sig) {
      setPasoActivo(sig);
    } else {
      setPasoActivo("completado");
    }
  };

  // Manejo de "Atrás"
  const handleAtras = () => {
    if (historialPasos.length === 0) return;

    const anteriorPaso = historialPasos[historialPasos.length - 1];
    setHistorialPasos((prev) => prev.slice(0, -1));

    // Si el último paso tenía un filtro asociado, desarmarlo
    if (historialFiltros.length > 0) {
      const ultimo = historialFiltros[historialFiltros.length - 1];
      setHistorialFiltros((prev) => prev.slice(0, -1));
      onClearFilter(ultimo.param);
    }

    setPasoActivo(anteriorPaso);
  };

  // Manejo de "Omitir"
  const handleOmitir = () => {
    setPasosOmitidos((prev) => [...prev, pasoActivo]);
    setHistorialPasos((prev) => [...prev, pasoActivo]);

    const sig = siguientePaso(filtros, [...pasosOmitidos, pasoActivo]);
    if (sig) {
      setPasoActivo(sig);
    } else {
      setPasoActivo("completado");
    }
  };

  // Manejo de recuperación ante combinación vacía
  const ultimoFiltro = historialFiltros[historialFiltros.length - 1];
  const conteoRecuperacion = useMemo(() => {
    if (!ultimoFiltro) return 0;
    const filtrosSinUltimo = { ...filtros, [ultimoFiltro.param]: undefined };
    return contar(filtrosSinUltimo);
  }, [filtros, ultimoFiltro]);

  const handleQuitarUltimo = () => {
    if (ultimoFiltro) {
      onClearFilter(ultimoFiltro.param);
      setHistorialFiltros((prev) => prev.slice(0, -1));
    }
  };

  const handleScrollToLibrary = () => {
    const el = document.getElementById("biblioteca");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Textos y títulos del paso actual
  let preguntaTexto = "";
  if (pasoActivo === "edad") preguntaTexto = guiaConfig.pasos.edad.pregunta;
  else if (pasoActivo === "area" || pasoActivo === "eje") preguntaTexto = guiaConfig.pasos.area.pregunta;
  else if (pasoActivo === "tema") preguntaTexto = guiaConfig.pasos.tema.pregunta;
  else if (pasoActivo === "funcion") preguntaTexto = "¿Qué función clínica priorizas?";
  else if (pasoActivo === "quien") preguntaTexto = "¿Quién responde o qué modalidad de aplicación buscas?";
  else if (pasoActivo === "libre") preguntaTexto = "¿Prefieres restringir a instrumentos de acceso completamente abierto?";
  else if (pasoActivo === "completado") preguntaTexto = "Instrumentos que se ajustan a lo que elegiste";

  return (
    <section
      className="guia-orientacion-container"
      aria-label="Asistente de orientación clínica"
    >
      {/* Encabezado del asistente */}
      <div className="guia-header">
        <div className="guia-title-badge">
          <Sparkles size={16} className="guia-sparkle-icon" aria-hidden="true" />
          <span className="guia-kicker">{guiaConfig.titulo_guia}</span>
        </div>

        {/* Botón Ver N instrumentos siempre visible */}
        <button
          type="button"
          onClick={handleScrollToLibrary}
          className="guia-btn-ver-instrumentos"
          aria-label={`Ver ${totalActual} instrumentos encontrados abajo`}
        >
          <span>Ver {totalActual} instrumentos</span>
          <ChevronRight size={15} aria-hidden="true" />
        </button>
      </div>

      {/* Línea de chips con respuestas previas (escalonados 80ms) */}
      {activeChips.length > 0 && (
        <div className="guia-chips-row" role="region" aria-label="Filtros seleccionados en la guía">
          <span className="guia-chips-label">Seleccionado:</span>
          <div className="guia-chips-list">
            {activeChips.map((chip, idx) => (
              <span
                key={chip.id}
                className="guia-chip"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={() => onClearFilter(chip.param)}
                  aria-label={`Quitar filtro ${chip.label}`}
                  className="guia-chip-remove"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={onResetAll}
              className="guia-chip-reset"
              aria-label="Reiniciar todos los filtros de la guía"
            >
              <RotateCcw size={12} aria-hidden="true" />
              <span>Reiniciar</span>
            </button>
          </div>
        </div>
      )}

      {/* Indicador de "escribiendo" (solo 400ms la primera vez por sesión) */}
      {typing ? (
        <div className="guia-typing-indicator" aria-label="Cargando asistente...">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      ) : totalActual === 0 && ultimoFiltro ? (
        /* Caso sin resultados con botón de escape / recuperación */
        <div className="guia-empty-alert" role="alert">
          <p className="guia-empty-text">
            Sin resultados con los filtros actuales.
          </p>
          <button
            type="button"
            className="guia-btn-recovery"
            onClick={handleQuitarUltimo}
          >
            Quitar &quot;{activeChips.find((c) => c.param === ultimoFiltro.param)?.label || ultimoFiltro.param}&quot; → {conteoRecuperacion} instrumentos
          </button>
        </div>
      ) : pasoActivo === "completado" ? (
        /* Paso completado / resumen */
        <div className="guia-completed-panel" aria-live="polite">
          <div className="guia-completed-msg">
            <Check size={20} className="text-emerald-500" />
            <p>
              Hemos seleccionado <strong>{totalActual} instrumentos</strong> que se ajustan a tu búsqueda.
            </p>
          </div>
          <button
            type="button"
            className="guia-btn-primary"
            onClick={handleScrollToLibrary}
          >
            Explorar {totalActual} instrumentos en el catálogo ↓
          </button>
        </div>
      ) : (
        /* Pregunta activa con desvanecimiento (opacidad, 6px translateY, 4px blur) */
        <div
          key={pasoActivo}
          className="guia-step-card guia-fade-in"
          aria-live="polite"
        >
          <h3 className="guia-step-question">{preguntaTexto}</h3>

          {/* Opciones del paso */}
          <div
            className="guia-options-grid"
            role="radiogroup"
            aria-label={preguntaTexto}
          >
            {opcionesActuales.map((op) => (
              <button
                key={String(op.id)}
                type="button"
                className="guia-option-btn"
                onClick={() => {
                  if (op.param) {
                    handleSelectOption(op.param, op.id === "all" ? undefined : op.id);
                  }
                }}
              >
                <div className="guia-option-content">
                  <span className="guia-option-label">{op.label}</span>
                  {op.subtitulo && (
                    <span className="guia-option-subtitulo">{op.subtitulo}</span>
                  )}
                </div>
                <span className="guia-option-badge">{op.conteo}</span>
              </button>
            ))}
          </div>

          {/* Campo libre especial en el paso tema: "Lo cuento con mis palabras" */}
          {pasoActivo === "tema" && (
            <div className="guia-free-text-section">
              <label className="guia-free-text-label" htmlFor="guia-texto-libre">
                {guiaConfig.pasos.tema.placeholder_libre || "O cuéntalo con tus palabras:"}
              </label>
              <div className="guia-free-text-input-wrap">
                <Search size={16} aria-hidden="true" />
                <input
                  id="guia-texto-libre"
                  type="text"
                  value={textoLibre}
                  onChange={(e) => setTextoLibre(e.target.value)}
                  placeholder="ej. no duerme, pánico, memoria de trabajo, impulsividad..."
                  className="guia-free-input"
                  aria-label="Buscar por palabras libres en el asistente"
                />
                {textoLibre && (
                  <button
                    type="button"
                    onClick={() => setTextoLibre("")}
                    className="guia-clear-text-btn"
                    aria-label="Borrar texto"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Sugerencias detectadas por búsqueda libre */}
              {sugerenciasTexto.length > 0 && (
                <div className="guia-suggestions-box">
                  <span className="guia-suggestions-title">
                    Temas sugeridos según lo que contaste:
                  </span>
                  <div className="guia-suggestions-chips">
                    {sugerenciasTexto.map((sug) => (
                      <button
                        key={sug.id}
                        type="button"
                        className="guia-sug-chip"
                        onClick={() => handleSelectOption("tema", sug.nombre)}
                      >
                        <span>{sug.nombre}</span>
                        <span className="guia-sug-count">({sug.conteo})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Barra inferior de navegación: Atrás y Omitir */}
          <div className="guia-nav-bar">
            {historialPasos.length > 0 ? (
              <button
                type="button"
                className="guia-nav-btn guia-nav-prev"
                onClick={handleAtras}
              >
                <ArrowLeft size={14} aria-hidden="true" />
                <span>Atrás</span>
              </button>
            ) : <div />}

            <button
              type="button"
              className="guia-nav-btn guia-nav-skip"
              onClick={handleOmitir}
            >
              <span>Omitir este paso</span>
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
