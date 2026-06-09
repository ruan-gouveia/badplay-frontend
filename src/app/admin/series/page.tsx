"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Serie, Genero, Temporada, Episodio } from "@/types/conteudo";
import axios from "axios";
import { Search, Plus, Trash2, Image as ImageIcon, Loader2, ListVideo, ChevronDown, ChevronUp } from "lucide-react";
import LoadingButton from "@/components/shared/LoadingButton";
import CustomModal from "@/components/shared/CustomModal";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TMDBTvResult { id: number; name: string; first_air_date: string; poster_path: string; overview: string; }

// Tipos locais para o formulário de episódio (sem id, pois são novos)
interface EpisodioForm {
  tempId: number; // id local apenas para controle do React
  nome: string;
  numeroEpisodio: number;
  duracaoMinutos: number;
  trailerUrlYoutube: string;
}

interface TemporadaForm {
  tempId: number;
  numeroTemporada: number;
  episodios: EpisodioForm[];
}

let nextTempId = 1;
const novoTempId = () => nextTempId++;

export default function AdminSeriesPage() {
  const [series, setSeries] = useState<Serie[]>([]);
  const [generosLocais, setGenerosLocais] = useState<Genero[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Modal TMDB
  const [showTmdbModal, setShowTmdbModal] = useState(false);
  const [query, setQuery] = useState("");
  const [resultadosTmdb, setResultadosTmdb] = useState<TMDBTvResult[]>([]);
  const [buscandoTmdb, setBuscandoTmdb] = useState(false);
  const [importandoId, setImportandoId] = useState<number | null>(null);

  // Modal Exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idParaDeletar, setIdParaDeletar] = useState<number | null>(null);
  const [deletando, setDeletando] = useState(false);

  // Modal Temporadas
  const [showTemporadasModal, setShowTemporadasModal] = useState(false);
  const [serieEditando, setSerieEditando] = useState<Serie | null>(null);
  const [temporadasForm, setTemporadasForm] = useState<TemporadaForm[]>([]);
  const [salvandoTemporadas, setSalvandoTemporadas] = useState(false);
  const [temporadaAberta, setTemporadaAberta] = useState<number | null>(null);

  // Reimportar temporadas do TMDB dentro do modal
  const [showReimportarBusca, setShowReimportarBusca] = useState(false);
  const [queryReimportar, setQueryReimportar] = useState("");
  const [resultadosReimportar, setResultadosReimportar] = useState<TMDBTvResult[]>([]);
  const [buscandoReimportar, setBuscandoReimportar] = useState(false);
  const [reimportandoId, setReimportandoId] = useState<number | null>(null);

  const buscarSeriesBanco = async () => {
    try {
      const resp = await api.get<Serie[]>("/series");
      setSeries(resp.data.sort((a, b) => b.id - a.id));
    } catch (error) { toast.error("Erro ao buscar séries do banco."); }
    finally { setCarregando(false); }
  };

  useEffect(() => {
    const buscarDadosIniciais = async () => {
      try {
        const respGeneros = await api.get<Genero[]>("/generos");
        setGenerosLocais(respGeneros.data);
      } catch (error) { console.error("Erro ao carregar gêneros."); }
      buscarSeriesBanco();
    };
    buscarDadosIniciais();
  }, []);

  // ── TMDB ──────────────────────────────────────────────────────────────────

  const buscarNoTMDB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setBuscandoTmdb(true);
    try {
      const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      const resp = await axios.get(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`);
      setResultadosTmdb(resp.data.results);
    } catch (error) { toast.error("Erro ao comunicar com o TMDb."); }
    finally { setBuscandoTmdb(false); }
  };

  const urlToFile = async (url: string, filename: string, mimeType: string): Promise<File> => {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return new File([buf], filename, { type: mimeType });
  };

  const buscarTrailerEpisodio = async (tmdbSerieId: number, numeroTemporada: number, numeroEpisodio: number, tmdbKey: string): Promise<string> => {
    try {
      // Tenta pt-BR primeiro, depois en-US
      for (const lang of ["pt-BR", "en-US"]) {
        const res = await axios.get(
          `https://api.themoviedb.org/3/tv/${tmdbSerieId}/season/${numeroTemporada}/episode/${numeroEpisodio}/videos?api_key=${tmdbKey}&language=${lang}`
        );
        const trailer = res.data.results?.find((v: any) => v.site === "YouTube" && v.type === "Trailer");
        if (trailer) return `https://www.youtube.com/watch?v=${trailer.key}`;
      }
    } catch { /* episódio sem trailer, não é erro crítico */ }
    return "";
  };

  const handleImportarSerie = async (tmdbSerie: TMDBTvResult) => {
    setImportandoId(tmdbSerie.id);
    try {
      const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

      // 1. Detalhes gerais da série
      const detalhesRes = await axios.get(`https://api.themoviedb.org/3/tv/${tmdbSerie.id}?api_key=${TMDB_KEY}&language=pt-BR`);
      const detalhes = detalhesRes.data;

      // 2. Gêneros
      const generosIds: number[] = [];
      if (detalhes.genres) {
        detalhes.genres.forEach((g: any) => {
          const localMatch = generosLocais.find(local => local.nome.toLowerCase() === g.name.toLowerCase());
          if (localMatch) generosIds.push(localMatch.id);
        });
      }

      // 3. Capa
      let imageFile: File | null = null;
      if (tmdbSerie.poster_path) {
        imageFile = await urlToFile(`https://image.tmdb.org/t/p/w500${tmdbSerie.poster_path}`, `tmdb_tv_${tmdbSerie.id}.jpg`, "image/jpeg");
      }
      if (!imageFile) throw new Error("Série sem capa não pode ser importada.");

      // 4. Temporadas e episódios — ignora temporadas especiais (número 0)
      const temporadasValidas: any[] = (detalhes.seasons || []).filter((s: any) => s.season_number > 0);

      const temporadas = await Promise.all(
        temporadasValidas.map(async (season: any) => {
          // Busca episódios da temporada
          const seasonRes = await axios.get(
            `https://api.themoviedb.org/3/tv/${tmdbSerie.id}/season/${season.season_number}?api_key=${TMDB_KEY}&language=pt-BR`
          );
          const episodiosTMDB: any[] = seasonRes.data.episodes || [];

          // Busca trailers de cada episódio em paralelo (limitado a 5 por vez para não sobrecarregar)
          const episodios = [];
          for (let i = 0; i < episodiosTMDB.length; i += 5) {
            const lote = episodiosTMDB.slice(i, i + 5);
            const resultados = await Promise.all(
              lote.map(async (ep: any) => {
                const trailerUrl = await buscarTrailerEpisodio(tmdbSerie.id, season.season_number, ep.episode_number, TMDB_KEY!);
                return {
                  nome: ep.name || `Episódio ${ep.episode_number}`,
                  numeroEpisodio: ep.episode_number,
                  duracaoMinutos: ep.runtime || 0,
                  trailerUrlYoutube: trailerUrl,
                };
              })
            );
            episodios.push(...resultados);
          }

          return {
            numeroTemporada: season.season_number,
            episodios,
          };
        })
      );

      const dadosSerie = {
        titulo: detalhes.name,
        descricao: detalhes.overview || "Sem descrição.",
        anoLancamento: detalhes.first_air_date ? parseInt(detalhes.first_air_date.substring(0, 4)) : new Date().getFullYear(),
        planoMinimo: "BASICO",
        generosIds,
        temporadas,
      };

      const formData = new FormData();
      formData.append("dados", new Blob([JSON.stringify(dadosSerie)], { type: "application/json" }));
      formData.append("capa", imageFile);

      const resp = await api.post("/series", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setSeries([resp.data, ...series]);

      const totalEps = temporadas.reduce((acc, t) => acc + t.episodios.length, 0);
      toast.success(`${detalhes.name} importada com ${temporadas.length} temporada(s) e ${totalEps} episódio(s)!`);
      setShowTmdbModal(false);
    } catch (error: any) { toast.error(error.message || "Erro ao importar."); }
    finally { setImportandoId(null); }
  };

  // ── PLANO ─────────────────────────────────────────────────────────────────

  const handleChangePlano = async (serie: Serie, novoPlano: string) => {
    try {
      const dadosSerie = {
        titulo: serie.titulo, descricao: serie.descricao, anoLancamento: serie.anoLancamento,
        planoMinimo: novoPlano, generosIds: serie.generos.map(g => g.id),
        temporadas: (serie.temporadas || []).map(t => ({
          numeroTemporada: t.numeroTemporada,
          episodios: (t.episodios || []).map(e => ({
            nome: e.nome, numeroEpisodio: e.numeroEpisodio,
            duracaoMinutos: e.duracaoMinutos, trailerUrlYoutube: e.trailerUrlYoutube,
          })),
        })),
      };
      const formData = new FormData();
      formData.append("dados", new Blob([JSON.stringify(dadosSerie)], { type: "application/json" }));
      const resp = await api.put(`/series/${serie.id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setSeries(series.map(s => s.id === serie.id ? resp.data : s));
      toast.success(`Plano atualizado para ${novoPlano}!`);
    } catch (error) { toast.error("Erro ao alterar o plano."); }
  };

  // ── EXCLUSÃO ──────────────────────────────────────────────────────────────

  const abrirModalDeletar = (id: number) => { setIdParaDeletar(id); setShowDeleteModal(true); };

  const confirmarDeletar = async () => {
    if (!idParaDeletar) return;
    setDeletando(true);
    try {
      await api.delete(`/series/${idParaDeletar}`);
      setSeries(series.filter(s => s.id !== idParaDeletar));
      toast.success("Série removida do catálogo!");
      setShowDeleteModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.erro || "Erro ao deletar série.");
    } finally { setDeletando(false); }
  };

  // ── REIMPORTAR TEMPORADAS DO TMDB ───────────────────────────────────────────

  const buscarParaReimportar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryReimportar.trim()) return;
    setBuscandoReimportar(true);
    try {
      const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      const resp = await axios.get(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(queryReimportar)}&language=pt-BR`);
      setResultadosReimportar(resp.data.results);
    } catch { toast.error("Erro ao buscar no TMDb."); }
    finally { setBuscandoReimportar(false); }
  };

  const handleReimportarTemporadas = async (tmdbSerie: TMDBTvResult) => {
    if (!serieEditando) return;
    setReimportandoId(tmdbSerie.id);
    try {
      const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      const detalhesRes = await axios.get(`https://api.themoviedb.org/3/tv/${tmdbSerie.id}?api_key=${TMDB_KEY}&language=pt-BR`);
      const detalhes = detalhesRes.data;
      const temporadasValidas = (detalhes.seasons || []).filter((s: any) => s.season_number > 0);

      const temporadas: TemporadaForm[] = await Promise.all(
        temporadasValidas.map(async (season: any) => {
          const seasonRes = await axios.get(
            `https://api.themoviedb.org/3/tv/${tmdbSerie.id}/season/${season.season_number}?api_key=${TMDB_KEY}&language=pt-BR`
          );
          const episodiosTMDB: any[] = seasonRes.data.episodes || [];
          const episodios: EpisodioForm[] = [];
          for (let i = 0; i < episodiosTMDB.length; i += 5) {
            const lote = episodiosTMDB.slice(i, i + 5);
            const resultados = await Promise.all(
              lote.map(async (ep: any) => {
                const trailerUrl = await buscarTrailerEpisodio(tmdbSerie.id, season.season_number, ep.episode_number, TMDB_KEY!);
                return {
                  tempId: novoTempId(),
                  nome: ep.name || `Episódio ${ep.episode_number}`,
                  numeroEpisodio: ep.episode_number,
                  duracaoMinutos: ep.runtime || 0,
                  trailerUrlYoutube: trailerUrl,
                };
              })
            );
            episodios.push(...resultados);
          }
          return { tempId: novoTempId(), numeroTemporada: season.season_number, episodios };
        })
      );

      // Buscar trailer da série
      let trailerSerie = "";
      for (const lang of ["pt-BR", "en-US"]) {
        try {
          const videosRes = await axios.get(`https://api.themoviedb.org/3/tv/${tmdbSerie.id}/videos?api_key=${TMDB_KEY}&language=${lang}`);
          const trailer = videosRes.data.results?.find((v: any) => v.site === "YouTube" && v.type === "Trailer");
          if (trailer) { trailerSerie = `https://www.youtube.com/watch?v=${trailer.key}`; break; }
        } catch { /* sem trailer */ }
      }

      // Atualiza serieEditando com o trailer encontrado
      if (trailerSerie) {
        setSerieEditando(prev => prev ? { ...prev, trailerUrlYoutube: trailerSerie } : prev);
      }

      setTemporadasForm(temporadas);
      setTemporadaAberta(temporadas.length > 0 ? temporadas[0].tempId : null);
      setShowReimportarBusca(false);
      setQueryReimportar("");
      setResultadosReimportar([]);
      const totalEps = temporadas.reduce((acc, t) => acc + t.episodios.length, 0);
      toast.success(`${temporadas.length} temporada(s) e ${totalEps} episódio(s) carregados! Clique em Salvar para confirmar.`);
    } catch { toast.error("Erro ao reimportar do TMDb."); }
    finally { setReimportandoId(null); }
  };

  // ── TEMPORADAS MODAL ──────────────────────────────────────────────────────

  const abrirModalTemporadas = (serie: Serie) => {
    setSerieEditando(serie);
    // Converte temporadas existentes para o formato do formulário
    const formsExistentes: TemporadaForm[] = (serie.temporadas || [])
      .slice()
      .sort((a, b) => a.numeroTemporada - b.numeroTemporada)
      .map(t => ({
        tempId: novoTempId(),
        numeroTemporada: t.numeroTemporada,
        episodios: (t.episodios || [])
          .slice()
          .sort((a, b) => a.numeroEpisodio - b.numeroEpisodio)
          .map(e => ({
            tempId: novoTempId(),
            nome: e.nome,
            numeroEpisodio: e.numeroEpisodio,
            duracaoMinutos: e.duracaoMinutos,
            trailerUrlYoutube: e.trailerUrlYoutube || "",
          })),
      }));
    setTemporadasForm(formsExistentes);
    setTemporadaAberta(formsExistentes.length > 0 ? formsExistentes[0].tempId : null);
    setShowTemporadasModal(true);
  };

  const adicionarTemporada = () => {
    const proximoNumero = temporadasForm.length > 0
      ? Math.max(...temporadasForm.map(t => t.numeroTemporada)) + 1
      : 1;
    const nova: TemporadaForm = { tempId: novoTempId(), numeroTemporada: proximoNumero, episodios: [] };
    setTemporadasForm([...temporadasForm, nova]);
    setTemporadaAberta(nova.tempId);
  };

  const removerTemporada = (tempId: number) => {
    setTemporadasForm(temporadasForm.filter(t => t.tempId !== tempId));
  };

  const adicionarEpisodio = (tempIdTemporada: number) => {
    setTemporadasForm(temporadasForm.map(t => {
      if (t.tempId !== tempIdTemporada) return t;
      const proximoNum = t.episodios.length > 0
        ? Math.max(...t.episodios.map(e => e.numeroEpisodio)) + 1
        : 1;
      return {
        ...t,
        episodios: [...t.episodios, {
          tempId: novoTempId(),
          nome: "",
          numeroEpisodio: proximoNum,
          duracaoMinutos: 0,
          trailerUrlYoutube: "",
        }],
      };
    }));
  };

  const removerEpisodio = (tempIdTemporada: number, tempIdEpisodio: number) => {
    setTemporadasForm(temporadasForm.map(t => {
      if (t.tempId !== tempIdTemporada) return t;
      return { ...t, episodios: t.episodios.filter(e => e.tempId !== tempIdEpisodio) };
    }));
  };

  const atualizarEpisodio = (tempIdTemporada: number, tempIdEpisodio: number, campo: keyof EpisodioForm, valor: string | number) => {
    setTemporadasForm(temporadasForm.map(t => {
      if (t.tempId !== tempIdTemporada) return t;
      return {
        ...t,
        episodios: t.episodios.map(e => {
          if (e.tempId !== tempIdEpisodio) return e;
          return { ...e, [campo]: valor };
        }),
      };
    }));
  };

  const salvarTemporadas = async () => {
    if (!serieEditando) return;

    // Validação básica
    for (const t of temporadasForm) {
      for (const e of t.episodios) {
        if (!e.nome.trim()) {
          toast.error(`Episódio ${e.numeroEpisodio} da Temporada ${t.numeroTemporada} está sem nome.`);
          return;
        }
      }
    }

    setSalvandoTemporadas(true);
    try {
      const dadosSerie = {
        titulo: serieEditando.titulo,
        descricao: serieEditando.descricao,
        anoLancamento: serieEditando.anoLancamento,
        planoMinimo: serieEditando.planoMinimo,
        trailerUrlYoutube: serieEditando.trailerUrlYoutube ?? "",
        generosIds: serieEditando.generos.map(g => g.id),
        temporadas: temporadasForm.map(t => ({
          numeroTemporada: t.numeroTemporada,
          episodios: t.episodios.map(e => ({
            nome: e.nome,
            numeroEpisodio: e.numeroEpisodio,
            duracaoMinutos: e.duracaoMinutos,
            trailerUrlYoutube: e.trailerUrlYoutube,
          })),
        })),
      };

      const formData = new FormData();
      formData.append("dados", new Blob([JSON.stringify(dadosSerie)], { type: "application/json" }));
      const resp = await api.put(`/series/${serieEditando.id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });

      setSeries(series.map(s => s.id === serieEditando.id ? resp.data : s));
      toast.success("Temporadas salvas com sucesso!");
      setShowTemporadasModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.erro || "Erro ao salvar temporadas.");
    } finally {
      setSalvandoTemporadas(false);
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Modal TMDB */}
      <CustomModal isOpen={showTmdbModal} title="Buscar Série (TMDb)" maxWidth="max-w-4xl">
        <form onSubmit={buscarNoTMDB} className="flex gap-2 mb-6">
          <input type="text" autoFocus placeholder="Digite o nome da Série (Ex: Breaking Bad, Dark)..." value={query} onChange={(e) => setQuery(e.target.value)} className="flex-grow bg-[#141414] text-white p-3 rounded-md border border-gray-700 focus:border-red-600 focus:outline-none" />
          <LoadingButton type="submit" isLoading={buscandoTmdb} textLoading="Buscando..." className="!w-auto px-6"><Search className="w-5 h-5 mr-2" /> Buscar</LoadingButton>
        </form>
        <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
          {resultadosTmdb.length === 0 && !buscandoTmdb ? (
            <p className="text-gray-500 text-center py-10">Pesquise por uma série para importar para o BadPlay.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resultadosTmdb.map(serie => (
                <div key={serie.id} className="bg-[#141414] border border-gray-800 rounded-lg p-3 flex gap-4 hover:border-gray-600 transition">
                  {serie.poster_path ? <img src={`https://image.tmdb.org/t/p/w200${serie.poster_path}`} alt="poster" className="w-20 h-30 object-cover rounded shadow-md" /> : <div className="w-20 h-30 bg-gray-900 rounded flex items-center justify-center text-gray-700"><ImageIcon /></div>}
                  <div className="flex flex-col justify-between flex-grow overflow-hidden">
                    <div>
                      <h4 className="text-white font-bold truncate text-sm">{serie.name}</h4>
                      <p className="text-gray-500 text-xs mb-1">{serie.first_air_date?.substring(0, 4)}</p>
                      <p className="text-gray-400 text-xs line-clamp-3 leading-snug">{serie.overview || "Sem sinopse disponível."}</p>
                    </div>
                    <button onClick={() => handleImportarSerie(serie)} disabled={importandoId === serie.id} className="mt-2 text-xs font-bold text-red-500 hover:text-red-400 text-right uppercase disabled:opacity-50 flex justify-end items-center gap-2">
                      {importandoId === serie.id ? <><Loader2 className="w-3 h-3 animate-spin" /> Importando...</> : "Importar Série"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-6 border-t border-gray-800 pt-4 flex justify-end">
          <LoadingButton variant="secondary" onClick={() => setShowTmdbModal(false)} className="!w-auto px-8">Fechar</LoadingButton>
        </div>
      </CustomModal>

      {/* Modal Exclusão */}
      <CustomModal isOpen={showDeleteModal} title="Excluir Série" icon={<Trash2 className="w-8 h-8" />} centerTitle>
        <p className="text-gray-400 mb-8 leading-relaxed text-center">
          Tem certeza que deseja deletar esta série do catálogo? Esta ação apagará as temporadas, episódios e o histórico de todos os usuários.
        </p>
        <div className="flex gap-4 w-full">
          <LoadingButton variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</LoadingButton>
          <LoadingButton onClick={confirmarDeletar} isLoading={deletando} textLoading="Excluindo...">Sim, Excluir</LoadingButton>
        </div>
      </CustomModal>

      {/* Modal Temporadas */}
      <CustomModal isOpen={showTemporadasModal} title={`Temporadas — ${serieEditando?.titulo}`} maxWidth="max-w-3xl">
        {/* Painel de reimportação do TMDB */}
        {showReimportarBusca ? (
          <div className="mb-4">
            <form onSubmit={buscarParaReimportar} className="flex gap-2 mb-3">
              <input
                type="text" autoFocus
                placeholder={`Buscar "${serieEditando?.titulo}" no TMDb...`}
                value={queryReimportar}
                onChange={(e) => setQueryReimportar(e.target.value)}
                className="flex-1 bg-[#141414] text-white text-sm p-2 rounded border border-gray-700 focus:border-red-600 focus:outline-none"
              />
              <button type="submit" disabled={buscandoReimportar} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded font-bold disabled:opacity-50 flex items-center gap-1">
                {buscandoReimportar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
              <button type="button" onClick={() => { setShowReimportarBusca(false); setResultadosReimportar([]); setQueryReimportar(""); }} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded">
                Cancelar
              </button>
            </form>
            <div className="max-h-52 overflow-y-auto flex flex-col gap-2">
              {resultadosReimportar.map(r => (
                <div key={r.id} className="flex items-center gap-3 bg-[#141414] border border-gray-800 rounded-lg p-2 hover:border-gray-600 transition">
                  {r.poster_path && <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} alt="" className="w-10 h-14 object-cover rounded" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{r.name}</p>
                    <p className="text-gray-500 text-xs">{r.first_air_date?.substring(0, 4)}</p>
                  </div>
                  <button
                    onClick={() => handleReimportarTemporadas(r)}
                    disabled={reimportandoId === r.id}
                    className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1 disabled:opacity-50 flex-shrink-0"
                  >
                    {reimportandoId === r.id ? <><Loader2 className="w-3 h-3 animate-spin" /> Importando...</> : "Usar esta"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setShowReimportarBusca(true); setQueryReimportar(serieEditando?.titulo || ""); }}
            className="w-full py-2 mb-4 border border-dashed border-blue-800 rounded-xl text-blue-400 hover:text-blue-300 hover:border-blue-600 transition text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" /> Preencher temporadas automaticamente pelo TMDb
          </button>
        )}

        {/* Campo de trailer da série */}
        <div className="mb-4">
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1 block">
            Trailer da Série (URL do YouTube)
          </label>
          <input
            type="text"
            placeholder="https://www.youtube.com/watch?v=..."
            value={serieEditando?.trailerUrlYoutube ?? ""}
            onChange={(e) => setSerieEditando(prev => prev ? { ...prev, trailerUrlYoutube: e.target.value } : prev)}
            className="w-full bg-[#141414] text-white text-sm p-2 rounded border border-gray-700 focus:border-red-600 focus:outline-none"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-1 flex flex-col gap-4 mb-6">
          {temporadasForm.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-6">Nenhuma temporada ainda. Clique em "Adicionar Temporada" ou use o botão acima.</p>
          )}

          {temporadasForm.map((temporada) => (
            <div key={temporada.tempId} className="border border-gray-800 rounded-xl overflow-hidden">

              {/* Cabeçalho da temporada */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a]">
                <button
                  onClick={() => setTemporadaAberta(temporadaAberta === temporada.tempId ? null : temporada.tempId)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  {temporadaAberta === temporada.tempId ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  <span className="text-white font-bold">Temporada {temporada.numeroTemporada}</span>
                  <span className="text-gray-500 text-xs">{temporada.episodios.length} episódio(s)</span>
                </button>
                <button onClick={() => removerTemporada(temporada.tempId)} className="text-gray-600 hover:text-red-500 transition p-1 ml-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Episódios */}
              {temporadaAberta === temporada.tempId && (
                <div className="p-4 flex flex-col gap-3">
                  {temporada.episodios.map((ep) => (
                    <div key={ep.tempId} className="bg-[#111] border border-gray-800 rounded-lg p-3 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs w-6 text-center font-bold">{ep.numeroEpisodio}</span>
                        <input
                          type="text"
                          placeholder="Nome do episódio"
                          value={ep.nome}
                          onChange={(e) => atualizarEpisodio(temporada.tempId, ep.tempId, "nome", e.target.value)}
                          className="flex-1 bg-[#1a1a1a] text-white text-sm p-2 rounded border border-gray-700 focus:border-red-600 focus:outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Min"
                          value={ep.duracaoMinutos || ""}
                          onChange={(e) => atualizarEpisodio(temporada.tempId, ep.tempId, "duracaoMinutos", parseInt(e.target.value) || 0)}
                          className="w-16 bg-[#1a1a1a] text-white text-sm p-2 rounded border border-gray-700 focus:border-red-600 focus:outline-none text-center"
                        />
                        <button onClick={() => removerEpisodio(temporada.tempId, ep.tempId)} className="text-gray-600 hover:text-red-500 transition p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="URL do trailer no YouTube (opcional)"
                        value={ep.trailerUrlYoutube}
                        onChange={(e) => atualizarEpisodio(temporada.tempId, ep.tempId, "trailerUrlYoutube", e.target.value)}
                        className="w-full bg-[#1a1a1a] text-white text-sm p-2 rounded border border-gray-700 focus:border-red-600 focus:outline-none ml-8"
                      />
                    </div>
                  ))}

                  <button
                    onClick={() => adicionarEpisodio(temporada.tempId)}
                    className="mt-1 text-sm text-red-500 hover:text-red-400 font-semibold flex items-center gap-1 transition"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Episódio
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={adicionarTemporada}
          className="w-full py-3 border border-dashed border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-gray-500 transition text-sm font-semibold flex items-center justify-center gap-2 mb-4"
        >
          <Plus className="w-4 h-4" /> Adicionar Temporada
        </button>

        <div className="flex gap-4">
          <LoadingButton variant="secondary" onClick={() => setShowTemporadasModal(false)}>Cancelar</LoadingButton>
          <LoadingButton onClick={salvarTemporadas} isLoading={salvandoTemporadas} textLoading="Salvando...">Salvar Temporadas</LoadingButton>
        </div>
      </CustomModal>

      {/* Página principal */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Gerenciar Séries</h2>
            <p className="text-gray-400">Adicione, edite ou remova as séries do catálogo.</p>
          </div>
          <LoadingButton onClick={() => setShowTmdbModal(true)} className="!w-auto px-6">
            <Plus className="w-5 h-5 mr-2" /> Adicionar Série (TMDb)
          </LoadingButton>
        </div>

        {carregando ? (
          <p className="text-gray-500">Carregando banco de dados...</p>
        ) : (
          <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden shadow-2xl pb-1">
            <Table>
              <TableHeader className="bg-[#1a1a1a]">
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="w-[80px] text-gray-400">ID</TableHead>
                  <TableHead className="text-gray-400">Título</TableHead>
                  <TableHead className="text-gray-400">Ano</TableHead>
                  <TableHead className="text-gray-400">Temporadas</TableHead>
                  <TableHead className="text-gray-400">Plano Mínimo</TableHead>
                  <TableHead className="text-right text-gray-400">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {series.map((serie) => (
                  <TableRow key={serie.id} className="border-gray-800 hover:bg-gray-900/50">
                    <TableCell className="font-medium text-gray-500">#{serie.id}</TableCell>
                    <TableCell className="text-white font-bold">{serie.titulo}</TableCell>
                    <TableCell className="text-gray-400">{serie.anoLancamento}</TableCell>
                    <TableCell className="text-gray-400">{(serie.temporadas || []).length} temp.</TableCell>
                    <TableCell>
                      <div className="relative inline-block">
                        <select value={serie.planoMinimo || "BASICO"} onChange={(e) => handleChangePlano(serie, e.target.value)} className={`appearance-none cursor-pointer pr-6 pl-2 py-1 rounded text-[10px] font-extrabold focus:outline-none focus:ring-1 focus:ring-red-600 transition-colors ${serie.planoMinimo === "PREMIUM" ? "bg-yellow-500 text-black" : serie.planoMinimo === "PADRAO" ? "bg-blue-600 text-white" : "bg-gray-700 text-white"}`}>
                          <option value="BASICO" className="bg-[#141414] text-gray-300 font-bold">BÁSICO</option>
                          <option value="PADRAO" className="bg-[#141414] text-gray-300 font-bold">PADRÃO</option>
                          <option value="PREMIUM" className="bg-[#141414] text-gray-300 font-bold">PREMIUM</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center px-1"><svg className={`fill-current h-3 w-3 ${serie.planoMinimo === "PREMIUM" ? "text-black" : "text-white"}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => abrirModalTemporadas(serie)} className="text-gray-500 hover:text-blue-400 p-2 transition" title="Gerenciar Temporadas">
                          <ListVideo className="w-5 h-5" />
                        </button>
                        <button onClick={() => abrirModalDeletar(serie.id)} className="text-gray-500 hover:text-red-500 p-2 transition" title="Excluir Série">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}