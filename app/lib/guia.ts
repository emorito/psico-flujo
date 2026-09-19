import rawCatalog from "../../data/catalog.json";
import rawIndice from "../../data/indice_psicoflujo.json";
import rawCla from "../../data/catalogo_maestro_clasificado.json";
import rawGuia from "../../data/guia.json";
import { crearIndice, buscar } from "../../buscador_indice";

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

export interface IndiceTema {
  id: string;
  nombre: string;
  eje: string;
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

export interface ClaItem {
  id: string;
  sigla: string;
  nombre_espanol: string;
  tipo_instrumento_categoria: string;
  funcion_clinica_categoria: string;
  acceso_categoria: string;
  poblacion?: string;
  franjas_etarias?: string[];
}

export interface GuiaConfig {
  titulo_guia: string;
  descripcion?: string;
  orden_pasos: string[];
  umbral_afinar: number;
  pasos: {
    edad: {
      id: string;
      pregunta: string;
      opciones: { id: string; label: string; franja: string; descripcion?: string }[];
    };
    area: {
      id: string;
      pregunta: string;
      opciones: { id: number; eje: number; label: string; subtitulo?: string }[];
    };
    tema: {
      id: string;
      pregunta: string;
      placeholder_libre?: string;
    };
    afinar: {
      id: string;
      pregunta: string;
      criterios: {
        funcion: {
          id: string;
          label: string;
          opciones: { id: string; label: string }[];
        };
        quien: {
          id: string;
          label: string;
          opciones: { id: string; label: string }[];
        };
        libre: {
          id: string;
          label: string;
          opcion_libre: { id: string; label: string };
        };
      };
    };
  };
}

export interface FiltrosGuia {
  edad?: string; // "niños" | "adolescentes" | "adultos" | "mayores" | "all"
  eje?: number | "all"; // 1..6 | "all"
  tema?: string; // Nombre de tema o ID o "all"
  fn?: string; // funcion_clinica_categoria or "all"
  quien?: string; // tipo_instrumento_categoria or "all"
  libre?: boolean; // true para sólo uso libre (acceso_categoria === "abierto")
  q?: string; // texto libre de búsqueda
}

export interface OpcionGuia {
  id: string | number;
  label: string;
  subtitulo?: string;
  conteo: number;
  param?: keyof FiltrosGuia;
}

export const catalog = rawCatalog as unknown as CatalogItem[];
export const guiaConfig = rawGuia as unknown as GuiaConfig;

export const claItems = rawCla as unknown as ClaItem[];
export const claMap = new Map<string, ClaItem>(claItems.map((c) => [c.id, c]));

export const indiceFamilias = rawIndice.familias as unknown as IndiceFamilia[];
export const indexFamilyMap = new Map<string, IndiceFamilia>(
  indiceFamilias.map((f) => [f.id, f])
);

export const indiceTemas = rawIndice.temas as unknown as IndiceTema[];
export const indexThemeMap = new Map<string, IndiceTema>(
  indiceTemas.map((t) => [t.id, t])
);

// Map by theme name for fast lookup
export const themeNameToIdMap = new Map<string, string>(
  indiceTemas.map((t) => [t.nombre.toLowerCase().trim(), t.id])
);

// Search index memoized once
export const searchIndex = crearIndice(rawIndice);

/**
 * Filtra el catalogo de instrumentos aplicando los filtros proporcionados.
 */
export function filtrarCatalogo(filtros: FiltrosGuia): CatalogItem[] {
  const trimmedQ = (filtros.q || "").trim();
  let searchHitMap: Map<string, { score: number; parcial: boolean }> | null = null;
  if (trimmedQ.length > 0) {
    const results = buscar(searchIndex, trimmedQ, { limite: catalog.length });
    searchHitMap = new Map();
    results.forEach((r: { id: string; score: number; parcial: boolean }) => {
      searchHitMap!.set(r.id, { score: r.score, parcial: r.parcial });
    });
  }

  return catalog.filter((item) => {
    const famIndex = indexFamilyMap.get(item.family_id);
    const claItem = claMap.get(item.family_id);

    // Q search
    if (searchHitMap && !searchHitMap.has(item.family_id)) {
      return false;
    }

    // Edad / Franja
    if (filtros.edad && filtros.edad !== "all" && !item.franjas.includes(filtros.edad)) {
      return false;
    }

    // Eje / Area
    const itemEje = famIndex?.eje ?? item.eje_num;
    if (filtros.eje && filtros.eje !== "all" && itemEje !== filtros.eje) {
      return false;
    }

    // Tema (revisa tema primario y secundarios)
    if (filtros.tema && filtros.tema !== "all") {
      const primaryThemeName = indexThemeMap.get(famIndex?.tema ?? "")?.nombre;
      const secThemeNames = (famIndex?.sec || []).map((s) => indexThemeMap.get(s)?.nombre);
      const allThemeNames = [primaryThemeName, ...secThemeNames].filter(Boolean) as string[];

      const primaryThemeId = famIndex?.tema;
      const secThemeIds = famIndex?.sec || [];
      const allThemeIds = [primaryThemeId, ...secThemeIds].filter(Boolean) as string[];

      const target = filtros.tema.toLowerCase().trim();
      const matches =
        allThemeNames.some((n) => n.toLowerCase().trim() === target) ||
        allThemeIds.some((id) => id.toLowerCase().trim() === target);

      if (!matches) {
        return false;
      }
    }

    // Funcion clinica (fn)
    if (filtros.fn && filtros.fn !== "all") {
      if (claItem?.funcion_clinica_categoria !== filtros.fn) {
        return false;
      }
    }

    // Quien responde / Tipo (quien)
    if (filtros.quien && filtros.quien !== "all") {
      if (claItem?.tipo_instrumento_categoria !== filtros.quien) {
        return false;
      }
    }

    // Solo libre (acceso abierto)
    if (filtros.libre) {
      if (claItem?.acceso_categoria !== "abierto") {
        return false;
      }
    }

    return true;
  });
}

/**
 * Cuenta la cantidad exacta de familias que coinciden con los filtros.
 */
export function contar(filtros: FiltrosGuia): number {
  return filtrarCatalogo(filtros).length;
}

/**
 * Devuelve las opciones válidas con su recuento para un paso determinado.
 * NUNCA devuelve opciones con conteo 0.
 */
export function opciones(paso: string, filtros: FiltrosGuia): OpcionGuia[] {
  const res: OpcionGuia[] = [];

  if (paso === "edad") {
    for (const op of guiaConfig.pasos.edad.opciones) {
      const c =
        op.franja === "all"
          ? contar({ ...filtros, edad: undefined })
          : contar({ ...filtros, edad: op.franja });
      if (c > 0) {
        res.push({
          id: op.id,
          label: op.label,
          subtitulo: op.descripcion,
          conteo: c,
          param: "edad",
        });
      }
    }
  } else if (paso === "area" || paso === "eje") {
    for (const op of guiaConfig.pasos.area.opciones) {
      const c = contar({ ...filtros, eje: op.eje });
      if (c > 0) {
        res.push({
          id: op.id,
          label: op.label,
          subtitulo: op.subtitulo,
          conteo: c,
          param: "eje",
        });
      }
    }
  } else if (paso === "tema") {
    // Si hay un eje seleccionado, mostrar temas correspondientes a ese eje con conteo > 0
    // Si no hay eje, mostrar todos los temas con conteo > 0 ordenados por frecuencia
    const themesForStep: { id: string; nombre: string; ejeNum: number }[] = [];
    for (const t of indiceTemas) {
      const ejeNum = parseInt(t.eje.replace(/\D/g, ""), 10);
      if (!filtros.eje || filtros.eje === "all" || ejeNum === filtros.eje) {
        themesForStep.push({ id: t.id, nombre: t.nombre, ejeNum });
      }
    }

    for (const t of themesForStep) {
      const c = contar({ ...filtros, tema: t.nombre });
      if (c > 0) {
        res.push({
          id: t.nombre,
          label: t.nombre,
          conteo: c,
          param: "tema",
        });
      }
    }

    res.sort((a, b) => b.conteo - a.conteo || a.label.localeCompare(b.label));
  } else if (paso === "funcion") {
    for (const op of guiaConfig.pasos.afinar.criterios.funcion.opciones) {
      const c = contar({ ...filtros, fn: op.id });
      if (c > 0) {
        res.push({
          id: op.id,
          label: op.label,
          conteo: c,
          param: "fn",
        });
      }
    }
    res.sort((a, b) => b.conteo - a.conteo);
  } else if (paso === "quien") {
    for (const op of guiaConfig.pasos.afinar.criterios.quien.opciones) {
      const c = contar({ ...filtros, quien: op.id });
      if (c > 0) {
        res.push({
          id: op.id,
          label: op.label,
          conteo: c,
          param: "quien",
        });
      }
    }
    res.sort((a, b) => b.conteo - a.conteo);
  } else if (paso === "libre") {
    const c = contar({ ...filtros, libre: true });
    if (c > 0) {
      res.push({
        id: "abierto",
        label: guiaConfig.pasos.afinar.criterios.libre.opcion_libre.label,
        conteo: c,
        param: "libre",
      });
    }
  }

  return res;
}

/**
 * Sugiere temas a partir de búsqueda con texto libre ("Lo cuento con mis palabras").
 */
export function sugerirTemasPorTexto(
  texto: string,
  filtros: FiltrosGuia = {}
): { id: string; nombre: string; conteo: number }[] {
  const trimmed = texto.trim();
  if (!trimmed) return [];

  const results = buscar(searchIndex, trimmed, { limite: catalog.length });
  if (results.length === 0) return [];

  const themeCounts = new Map<string, number>();

  for (const r of results) {
    const fam = indexFamilyMap.get(r.id);
    if (!fam) continue;

    // Verificar si el instrumento cumple con los filtros ya seleccionados (edad, eje)
    const item = catalog.find((c) => c.family_id === r.id);
    if (!item) continue;
    if (filtros.edad && filtros.edad !== "all" && !item.franjas.includes(filtros.edad)) {
      continue;
    }
    if (filtros.eje && filtros.eje !== "all" && fam.eje !== filtros.eje) {
      continue;
    }

    const themes = [fam.tema, ...(fam.sec || [])].filter(Boolean);
    for (const th of themes) {
      const tObj = indexThemeMap.get(th);
      const nombre = tObj?.nombre || th;
      themeCounts.set(nombre, (themeCounts.get(nombre) || 0) + 1);
    }
  }

  const suggested: { id: string; nombre: string; conteo: number }[] = [];
  for (const nombre of themeCounts.keys()) {
    // Conteo total en el catálogo con los filtros actuales + este tema
    const realConteo = contar({ ...filtros, tema: nombre });
    if (realConteo > 0) {
      suggested.push({
        id: nombre,
        nombre,
        conteo: realConteo,
      });
    }
  }

  suggested.sort((a, b) => b.conteo - a.conteo || a.nombre.localeCompare(b.nombre));
  return suggested;
}

/**
 * Determina el siguiente paso en el flujo fijo.
 * Orden: edad -> area -> tema -> afinar (funcion -> quien -> libre si total > 8).
 * Si quedan 8 o menos resultados, devuelve null.
 */
export function siguientePaso(
  filtros: FiltrosGuia,
  pasosOmitidos: string[] = []
): string | null {
  const omitidos = new Set(pasosOmitidos);

  // 1. Edad
  const hasEdad = filtros.edad !== undefined && filtros.edad !== "all" && filtros.edad !== "";
  if (!hasEdad && !omitidos.has("edad")) {
    return "edad";
  }

  // 2. Área
  const hasEje = filtros.eje !== undefined && filtros.eje !== "all";
  if (!hasEje && !omitidos.has("area") && !omitidos.has("eje")) {
    return "area";
  }

  // 3. Tema
  const hasTema =
    (filtros.tema !== undefined && filtros.tema !== "all" && filtros.tema !== "") ||
    (filtros.q !== undefined && filtros.q.trim() !== "");
  if (!hasTema && !omitidos.has("tema")) {
    return "tema";
  }

  // 4. Afinar (solo si quedan más de umbral_afinar resultados)
  const remaining = contar(filtros);
  if (remaining <= guiaConfig.umbral_afinar) {
    return null;
  }

  // Afinar: función clínica
  if (
    (filtros.fn === undefined || filtros.fn === "all" || filtros.fn === "") &&
    !omitidos.has("funcion") &&
    opciones("funcion", filtros).length > 1
  ) {
    return "funcion";
  }

  // Afinar: quién responde / modalidad
  if (
    (filtros.quien === undefined || filtros.quien === "all" || filtros.quien === "") &&
    !omitidos.has("quien") &&
    opciones("quien", filtros).length > 1
  ) {
    return "quien";
  }

  // Afinar: sólo uso libre
  if (
    !filtros.libre &&
    !omitidos.has("libre") &&
    opciones("libre", filtros).length > 0
  ) {
    return "libre";
  }

  return null;
}
