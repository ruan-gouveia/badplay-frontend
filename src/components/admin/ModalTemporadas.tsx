"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Trash2, ChevronDown, ChevronUp, Search, Loader2 } from "lucide-react";
import CustomModal from "@/components/shared/CustomModal";
import LoadingButton from "@/components/shared/LoadingButton";
import { toast } from "sonner";
import { Serie } from "@/types/conteudo";
import { api } from "@/services/api";

interface EpisodioForm { tempId: number; nome: string; numeroEpisodio: number; duracaoMinutos: number; trailerUrlYoutube: string; }
interface TemporadaForm { tempId: number; numeroTemporada: number; episodios: EpisodioForm[]; expanded: boolean; }
let nextTempId = 1; const novoTempId = () => nextTempId++;

interface Props { isOpen: boolean; onClose: () => void; serie: Serie | null; onSuccess: (serieAtualizada: Serie) => void; }

export default function ModalTemporadas({ isOpen, onClose, serie, onSuccess }: Props) {
  const [temporadasForm, setTemporadasForm] = useState<TemporadaForm[]>([]);
  const [temporadaAberta, setTemporadaAberta] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [buscandoTMDb, setBuscandoTMDb] = useState(false);
  const [trailerGeral, setTrailerGeral] = useState("");

  useEffect(() => {
    if (serie && isOpen) {
      setTrailerGeral(serie.trailerUrlYoutube || "");
      const formsExistentes: TemporadaForm[] = (serie.temporadas || []).slice().sort((a, b) => a.numeroTemporada - b.numeroTemporada).map(t => ({
          tempId: novoTempId(), numeroTemporada: t.numeroTemporada, expanded: false,
          episodios: (t.episodios || []).slice().sort((a, b) => a.numeroEpisodio - b.numeroEpisodio)
            .map(e => ({ tempId: novoTempId(), nome: e.nome, numeroEpisodio: e.numeroEpisodio, duracaoMinutos: e.duracaoMinutos, trailerUrlYoutube: e.trailerUrlYoutube || "" })),
        }));
      setTemporadasForm(formsExistentes);
      setTemporadaAberta(formsExistentes.length > 0 ? formsExistentes[0].tempId : null);
    }
  }, [serie, isOpen]);

  const buscarMelhorTrailer = async (tmdbId: number) => {
    const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    const buscar = async (lang: string) => {
      try {
        const res = await axios.get(`https://api.themoviedb.org/3/tv/${tmdbId}/videos?api_key=${TMDB_KEY}&language=${lang}`);
        const videos = res.data.results || [];
        let vid = videos.find((v: any) => v.site === "YouTube" && v.type === "Trailer");
        if (!vid) vid = videos.find((v: any) => v.site === "YouTube" && v.type === "Teaser");
        if (!vid) vid = videos.find((v: any) => v.site === "YouTube");
        return vid ? `https://www.youtube.com/watch?v=${vid.key}` : null;
      } catch { return null; }
    };
    return (await buscar("pt-BR")) || (await buscar("en-US")) || "";
  };

  const preencherTemporadasTMDb = async () => {
    if (!serie) return;
    setBuscandoTMDb(true);
    try {
      const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      const tmdbSearch = await axios.get(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(serie.titulo)}&language=pt-BR`);
      if (tmdbSearch.data.results.length === 0) throw new Error("Série não encontrada no TMDb.");
      const tmdbId = tmdbSearch.data.results[0].id;
      const trailerSerie = await buscarMelhorTrailer(tmdbId);
      if (trailerSerie) setTrailerGeral(trailerSerie);

      const detalhes = (await axios.get(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_KEY}&language=pt-BR`)).data;
      const temporadasValidas = (detalhes.seasons || []).filter((s: any) => s.season_number > 0);

      const novasTemporadas = await Promise.all(temporadasValidas.map(async (season: any) => {
        const seasonRes = await axios.get(`https://api.themoviedb.org/3/tv/${tmdbId}/season/${season.season_number}?api_key=${TMDB_KEY}&language=pt-BR`);
        const eps = seasonRes.data.episodes || [];
        const episodiosFormatados = eps.map((ep: any) => ({
          tempId: novoTempId(), nome: ep.name || `Episódio ${ep.episode_number}`, numeroEpisodio: ep.episode_number,
          duracaoMinutos: ep.runtime || 45, trailerUrlYoutube: ""
        }));
        return { tempId: novoTempId(), numeroTemporada: season.season_number, episodios: episodiosFormatados, expanded: false };
      }));

      setTemporadasForm(novasTemporadas);
      setTemporadaAberta(novasTemporadas.length > 0 ? novasTemporadas[0].tempId : null);
      toast.success("Trailer, temporadas e episódios importados!");
    } catch (error) { toast.error("Erro ao puxar dados do TMDb."); }
    finally { setBuscandoTMDb(false); }
  };

  const salvarTemporadas = async () => {
    if (!serie) return;
    setSalvando(true);
    try {
      const dadosSerie = {
        titulo: serie.titulo, descricao: serie.descricao, anoLancamento: serie.anoLancamento,
        planoMinimo: serie.planoMinimo, trailerUrlYoutube: trailerGeral,
        generosIds: serie.generos.map(g => g.id),
        temporadas: temporadasForm.map(t => ({
          numeroTemporada: t.numeroTemporada,
          episodios: t.episodios.map(e => ({ nome: e.nome, numeroEpisodio: e.numeroEpisodio, duracaoMinutos: e.duracaoMinutos, trailerUrlYoutube: e.trailerUrlYoutube }))
        }))
      };
      const formData = new FormData();
      formData.append("dados", new Blob([JSON.stringify(dadosSerie)], { type: "application/json" }));
      const resp = await api.put(`/series/${serie.id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      onSuccess(resp.data);
      toast.success("Série atualizada com sucesso!");
      onClose();
    } catch (error) { toast.error("Erro ao salvar."); }
    finally { setSalvando(false); }
  };

  const addTemporada = () => { const num = temporadasForm.length ? Math.max(...temporadasForm.map(t => t.numeroTemporada)) + 1 : 1; const nova = { tempId: novoTempId(), numeroTemporada: num, episodios: [], expanded: true }; setTemporadasForm([...temporadasForm, nova]); setTemporadaAberta(nova.tempId); };
  const addEpisodio = (tId: number) => setTemporadasForm(temporadasForm.map(t => t.tempId === tId ? { ...t, episodios: [...t.episodios, { tempId: novoTempId(), nome: "", numeroEpisodio: t.episodios.length ? Math.max(...t.episodios.map(e => e.numeroEpisodio)) + 1 : 1, duracaoMinutos: 45, trailerUrlYoutube: "" }] } : t));
  const removeEpisodio = (tId: number, eId: number) => setTemporadasForm(temporadasForm.map(t => t.tempId === tId ? { ...t, episodios: t.episodios.filter(e => e.tempId !== eId) } : t));
  const updateEpisodio = (tId: number, eId: number, campo: keyof EpisodioForm, valor: any) => setTemporadasForm(temporadasForm.map(t => t.tempId === tId ? { ...t, episodios: t.episodios.map(e => e.tempId === eId ? { ...e, [campo]: valor } : e) } : t));

  return (
    <CustomModal isOpen={isOpen} title={`Gerenciar — ${serie?.titulo}`} maxWidth="max-w-4xl">
      <div className="flex flex-col gap-6">
        <LoadingButton variant="secondary" onClick={preencherTemporadasTMDb} isLoading={buscandoTMDb} textLoading="Puxando dados..." className="w-full border-blue-600 text-blue-500 hover:bg-blue-600 hover:text-white">
          <Search className="w-5 h-5 mr-2" /> Preencher trailer, temporadas e episódios (TMDb)
        </LoadingButton>

        <div>
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1 block">Trailer da Série (URL YouTube)</label>
          <input type="text" value={trailerGeral} onChange={(e) => setTrailerGeral(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full bg-[#1a1a1a] text-white text-sm p-3 rounded-md border border-gray-800 focus:border-red-600 focus:outline-none" />
        </div>

        <div className="flex flex-col gap-4">
          {temporadasForm.length === 0 && <p className="text-gray-500 text-sm text-center py-6">Nenhuma temporada ainda.</p>}
          {temporadasForm.map((temporada) => (
            <div key={temporada.tempId} className="border border-gray-800 rounded-xl overflow-hidden bg-[#111]">
              <div onClick={() => setTemporadaAberta(temporadaAberta === temporada.tempId ? null : temporada.tempId)} className="flex justify-between items-center p-4 cursor-pointer hover:bg-[#1a1a1a] transition select-none">
                <h3 className="font-bold text-white flex items-center gap-2">
                  {temporadaAberta === temporada.tempId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Temporada {temporada.numeroTemporada} <span className="text-xs text-gray-500 ml-2">{temporada.episodios.length} ep(s)</span>
                </h3>
                <button onClick={(e) => { e.stopPropagation(); setTemporadasForm(temporadasForm.filter(t => t.tempId !== temporada.tempId)); }} className="text-gray-600 hover:text-red-500 transition p-1"><Trash2 className="w-4 h-4" /></button>
              </div>

              {temporadaAberta === temporada.tempId && (
                <div className="p-4 pt-0 flex flex-col gap-4">
                  {temporada.episodios.map((ep) => (
                    <div key={ep.tempId} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-3 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs w-6 text-center font-bold">{ep.numeroEpisodio}</span>
                        <input type="text" value={ep.nome} onChange={(e) => updateEpisodio(temporada.tempId, ep.tempId, "nome", e.target.value)} placeholder="Nome do Ep" className="flex-1 bg-[#111] text-white p-2.5 rounded-md border border-gray-800 focus:border-red-600 focus:outline-none text-sm" />
                        <input type="number" value={ep.duracaoMinutos || ""} onChange={(e) => updateEpisodio(temporada.tempId, ep.tempId, "duracaoMinutos", parseInt(e.target.value) || 0)} className="w-16 bg-[#111] text-white p-2.5 rounded-md border border-gray-800 focus:border-red-600 focus:outline-none text-center text-sm" />
                        <button onClick={() => removeEpisodio(temporada.tempId, ep.tempId)} className="text-gray-600 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="pl-8 pr-10">
                        <input type="text" value={ep.trailerUrlYoutube} onChange={(e) => updateEpisodio(temporada.tempId, ep.tempId, "trailerUrlYoutube", e.target.value)} placeholder="URL do trailer do Episódio (opcional)" className="w-full bg-[#111] text-gray-400 p-2.5 rounded-md border border-gray-800 focus:border-red-600 focus:outline-none text-xs" />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addEpisodio(temporada.tempId)} className="text-sm font-bold text-gray-400 border border-dashed border-gray-700 rounded-lg p-3 hover:bg-gray-800 hover:text-white transition">+ Adicionar Episódio</button>
                </div>
              )}
            </div>
          ))}
          <button onClick={addTemporada} className="w-full py-4 border border-dashed border-gray-700 rounded-xl text-gray-400 font-bold hover:bg-gray-800 hover:text-white transition">+ Adicionar Temporada Vazia</button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-800 flex gap-4">
          <LoadingButton variant="secondary" onClick={onClose}>Cancelar</LoadingButton>
          <LoadingButton onClick={salvarTemporadas} isLoading={salvando} textLoading="Salvando...">Salvar Alterações</LoadingButton>
        </div>
      </div>
    </CustomModal>
  );
}