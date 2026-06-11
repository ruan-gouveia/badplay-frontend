import { api } from "@/services/api";
import { Filme, Serie, Genero } from "@/types/conteudo";

const CACHE_TTL = 5 * 60 * 1000;

type CacheKey =
  | "badplay:filmes"
  | "badplay:series"
  | "badplay:generos";

interface CacheItem<T> {
  timestamp: number;
  data: T;
}

interface ConteudoResumo {
  id: number;
  titulo: string;
  descricao?: string;
  anoLancamento?: number;
  capaUrlMinio: string;
  planoMinimo: string;
  generos?: Genero[];
}

const memoryCache = new Map<CacheKey, CacheItem<unknown>>();
const pendingRequests = new Map<CacheKey, Promise<unknown>>();

function cacheValido(timestamp: number) {
  return Date.now() - timestamp < CACHE_TTL;
}

function lerCache<T>(key: CacheKey): T | null {
  const memoria = memoryCache.get(key) as CacheItem<T> | undefined;

  if (memoria && cacheValido(memoria.timestamp)) {
    return memoria.data;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const salvo = sessionStorage.getItem(key);

  if (!salvo) {
    return null;
  }

  try {
    const cache = JSON.parse(salvo) as CacheItem<T>;

    if (cacheValido(cache.timestamp)) {
      memoryCache.set(key, cache as CacheItem<unknown>);
      return cache.data;
    }

    sessionStorage.removeItem(key);
    return null;
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
}

function salvarCache<T>(key: CacheKey, data: T) {
  const cache: CacheItem<T> = {
    timestamp: Date.now(),
    data,
  };

  memoryCache.set(key, cache as CacheItem<unknown>);

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(key, JSON.stringify(cache));
    } catch {
      // Caso o navegador bloqueie o sessionStorage, o cache em memória continua.
    }
  }
}

function ordenarConteudos<T extends { titulo: string }>(lista: T[]) {
  return lista
    .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
    .sort((a, b) => a.titulo.localeCompare(b.titulo));
}

function ordenarGeneros(lista: Genero[]) {
  return lista.sort((a, b) => a.nome.localeCompare(b.nome));
}

function prepararResumo(lista: ConteudoResumo[]) {
  return ordenarConteudos(
    lista.map((item) => ({
      id: item.id,
      titulo: item.titulo,
      descricao: item.descricao || "",
      anoLancamento: item.anoLancamento || 0,
      capaUrlMinio: item.capaUrlMinio,
      planoMinimo: item.planoMinimo || "BASICO",
      generos: item.generos || [],
    }))
  );
}

async function buscarComCache<T>(
  key: CacheKey,
  buscarDados: () => Promise<T>,
  prepararDados: (data: T) => T
): Promise<T> {
  const cache = lerCache<T>(key);

  if (cache) {
    return cache;
  }

  const pendente = pendingRequests.get(key) as Promise<T> | undefined;

  if (pendente) {
    return pendente;
  }

  const request = buscarDados()
    .then((data) => {
      const dados = prepararDados(data);
      salvarCache(key, dados);
      return dados;
    })
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, request);

  return request;
}

export function buscarFilmesCache() {
  return buscarComCache<Filme[]>(
    "badplay:filmes",
    async () => {
      try {
        const resp = await api.get<ConteudoResumo[]>("/filmes/resumo");
        return prepararResumo(resp.data) as Filme[];
      } catch {
        const resp = await api.get<Filme[]>("/filmes");
        return resp.data;
      }
    },
    ordenarConteudos
  );
}

export function buscarSeriesCache() {
  return buscarComCache<Serie[]>(
    "badplay:series",
    async () => {
      try {
        const resp = await api.get<ConteudoResumo[]>("/series/resumo");
        return prepararResumo(resp.data) as Serie[];
      } catch {
        const resp = await api.get<Serie[]>("/series");
        return resp.data;
      }
    },
    ordenarConteudos
  );
}

export function buscarGenerosCache() {
  return buscarComCache<Genero[]>(
    "badplay:generos",
    async () => {
      const resp = await api.get<Genero[]>("/generos");
      return resp.data;
    },
    ordenarGeneros
  );
}

export function limparCatalogoCache() {
  memoryCache.clear();

  if (typeof window !== "undefined") {
    sessionStorage.removeItem("badplay:filmes");
    sessionStorage.removeItem("badplay:series");
    sessionStorage.removeItem("badplay:generos");
  }
}

export function precarregarCatalogoCache() {
  void Promise.allSettled([
    buscarFilmesCache(),
    buscarSeriesCache(),
    buscarGenerosCache(),
  ]);
}