"use client";

import { useState } from "react";
import axios from "axios";
import { Search, Image as ImageIcon, Loader2 } from "lucide-react";
import CustomModal from "@/components/shared/CustomModal";
import LoadingButton from "@/components/shared/LoadingButton";
import { toast } from "sonner";
import { Genero, Serie } from "@/types/conteudo";
import { api } from "@/services/api";

interface TMDBTvResult { id: number; name: string; first_air_date: string; poster_path: string; overview: string; }

interface Props {
  isOpen: boolean; onClose: () => void; onSuccess: (novaSerie: Serie) => void; generosLocais: Genero[];
}

export default function ModalImportarSerie({ isOpen, onClose, onSuccess, generosLocais }: Props) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<TMDBTvResult[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [importandoId, setImportandoId] = useState<number | null>(null);

  const buscarNoTMDB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setBuscando(true);
    try {
      const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      const resp = await axios.get(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`);
      setResultados(resp.data.results);
    } catch (error) { toast.error("Erro ao comunicar com o TMDb."); }
    finally { setBuscando(false); }
  };

  const buscarMelhorTrailer = async (tmdbId: number) => {
    const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    const buscar = async (lang: string) => {
      try {
        const res = await axios.get(`https://api.themoviedb.org/3/tv/${tmdbId}/videos?api_key=${TMDB_KEY}&language=${lang}`);
        const videos = res.data.results || [];
        // Tenta Trailer > Teaser > Clip > Ou pega o 1º vídeo disponível!
        let vid = videos.find((v: any) => v.site === "YouTube" && v.type === "Trailer");
        if (!vid) vid = videos.find((v: any) => v.site === "YouTube" && v.type === "Teaser");
        if (!vid) vid = videos.find((v: any) => v.site === "YouTube"); 
        return vid ? `https://www.youtube.com/watch?v=${vid.key}` : null;
      } catch { return null; }
    };
    return (await buscar("pt-BR")) || (await buscar("en-US")) || "";
  };

  const handleImportar = async (tmdbSerie: TMDBTvResult) => {
    setImportandoId(tmdbSerie.id);
    try {
      const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      const detalhes = (await axios.get(`https://api.themoviedb.org/3/tv/${tmdbSerie.id}?api_key=${TMDB_KEY}&language=pt-BR`)).data;

      const trailerUrl = await buscarMelhorTrailer(tmdbSerie.id);

      const generosIds: number[] = [];
      if (detalhes.genres) {
        detalhes.genres.forEach((g: any) => {
          const match = generosLocais.find(local => local.nome.toLowerCase() === g.name.toLowerCase());
          if (match) generosIds.push(match.id);
        });
      }

      if (!tmdbSerie.poster_path) throw new Error("Série sem capa não pode ser importada.");
      const resCapa = await fetch(`https://image.tmdb.org/t/p/w500${tmdbSerie.poster_path}`);
      const buf = await resCapa.arrayBuffer();
      const imageFile = new File([buf], `tmdb_tv_${tmdbSerie.id}.jpg`, { type: 'image/jpeg' });

      const dadosSerie = {
        titulo: detalhes.name, descricao: detalhes.overview || "Sem descrição.",
        anoLancamento: detalhes.first_air_date ? parseInt(detalhes.first_air_date.substring(0, 4)) : new Date().getFullYear(),
        planoMinimo: "BASICO", trailerUrlYoutube: trailerUrl, generosIds, temporadas: []
      };

      const formData = new FormData();
      formData.append("dados", new Blob([JSON.stringify(dadosSerie)], { type: "application/json" }));
      formData.append("capa", imageFile);

      const resp = await api.post("/series", formData, { headers: { "Content-Type": "multipart/form-data" } });
      onSuccess(resp.data);
      toast.success(`${detalhes.name} importada com sucesso! Gerencie as temporadas a seguir.`);
      onClose();
    } catch (error: any) { toast.error(error.message || "Erro ao importar."); }
    finally { setImportandoId(null); }
  };

  return (
    <CustomModal isOpen={isOpen} title="Buscar Série (TMDb)" maxWidth="max-w-4xl">
      <form onSubmit={buscarNoTMDB} className="flex gap-2 mb-6">
        <input type="text" autoFocus placeholder="Digite o nome da Série..." value={query} onChange={(e) => setQuery(e.target.value)} className="flex-grow bg-[#141414] text-white p-3 rounded-md border border-gray-700 focus:border-red-600 focus:outline-none" />
        <LoadingButton type="submit" isLoading={buscando} textLoading="..." className="!w-auto px-6"><Search className="w-5 h-5 mr-2" /> Buscar</LoadingButton>
      </form>
      <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {resultados.length === 0 && !buscando ? (
          <p className="text-gray-500 text-center py-10">Pesquise por uma série para importar.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resultados.map(serie => (
              <div key={serie.id} className="bg-[#141414] border border-gray-800 rounded-lg p-3 flex gap-4 hover:border-gray-600 transition">
                {serie.poster_path ? <img src={`https://image.tmdb.org/t/p/w200${serie.poster_path}`} alt="poster" className="w-20 h-30 object-cover rounded shadow-md" /> : <div className="w-20 h-30 bg-gray-900 rounded flex items-center justify-center text-gray-700"><ImageIcon /></div>}
                <div className="flex flex-col justify-between flex-grow overflow-hidden">
                  <div>
                    <h4 className="text-white font-bold truncate text-sm">{serie.name}</h4>
                    <p className="text-gray-500 text-xs mb-1">{serie.first_air_date?.substring(0,4)}</p>
                    <p className="text-gray-400 text-xs line-clamp-3 leading-snug">{serie.overview || "Sem sinopse disponível."}</p>
                  </div>
                  <button onClick={() => handleImportar(serie)} disabled={importandoId === serie.id} className="mt-2 text-xs font-bold text-red-500 hover:text-red-400 text-right uppercase disabled:opacity-50">
                    {importandoId === serie.id ? <><Loader2 className="w-3 h-3 animate-spin inline mr-1" /> Importando...</> : "Importar Série"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-6 border-t border-gray-800 pt-4 flex justify-end">
        <LoadingButton variant="secondary" onClick={onClose} className="!w-auto px-8">Fechar</LoadingButton>
      </div>
    </CustomModal>
  );
}