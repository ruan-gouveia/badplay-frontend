"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Serie, Genero } from "@/types/conteudo";
import axios from "axios";
import { Search, Plus, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import LoadingButton from "@/components/shared/LoadingButton";
import CustomModal from "@/components/shared/CustomModal";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TMDBTvResult { id: number; name: string; first_air_date: string; poster_path: string; overview: string; }

export default function AdminSeriesPage() {
  const [series, setSeries] = useState<Serie[]>([]);
  const [generosLocais, setGenerosLocais] = useState<Genero[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [showTmdbModal, setShowTmdbModal] = useState(false);
  const [query, setQuery] = useState("");
  const [resultadosTmdb, setResultadosTmdb] = useState<TMDBTvResult[]>([]);
  const [buscandoTmdb, setBuscandoTmdb] = useState(false);
  const [importandoId, setImportandoId] = useState<number | null>(null);

  // Estados Modal Exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idParaDeletar, setIdParaDeletar] = useState<number | null>(null);
  const [deletando, setDeletando] = useState(false);

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

  const handleImportarSerie = async (tmdbSerie: TMDBTvResult) => {
    setImportandoId(tmdbSerie.id);
    try {
      const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      const detalhesRes = await axios.get(`https://api.themoviedb.org/3/tv/${tmdbSerie.id}?api_key=${TMDB_KEY}&language=pt-BR`);
      const detalhes = detalhesRes.data;

      const videosRes = await axios.get(`https://api.themoviedb.org/3/tv/${tmdbSerie.id}/videos?api_key=${TMDB_KEY}&language=pt-BR`);
      let trailerUrl = "";
      let trailer = videosRes.data.results.find((v: any) => v.site === "YouTube" && v.type === "Trailer");
      if (!trailer) {
        const videosEn = await axios.get(`https://api.themoviedb.org/3/tv/${tmdbSerie.id}/videos?api_key=${TMDB_KEY}&language=en-US`);
        trailer = videosEn.data.results.find((v: any) => v.site === "YouTube" && v.type === "Trailer");
      }
      if (trailer) trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;

      const generosIds: number[] = [];
      if (detalhes.genres) {
        detalhes.genres.forEach((g: any) => {
          const localMatch = generosLocais.find(local => local.nome.toLowerCase() === g.name.toLowerCase());
          if (localMatch) generosIds.push(localMatch.id);
        });
      }

      let imageFile: File | null = null;
      if (tmdbSerie.poster_path) {
        imageFile = await urlToFile(`https://image.tmdb.org/t/p/w500${tmdbSerie.poster_path}`, `tmdb_tv_${tmdbSerie.id}.jpg`, 'image/jpeg');
      }
      if (!imageFile) throw new Error("Série sem capa não pode ser importada.");

      const dadosSerie = {
        titulo: detalhes.name,
        descricao: detalhes.overview || "Sem descrição.",
        anoLancamento: detalhes.first_air_date ? parseInt(detalhes.first_air_date.substring(0, 4)) : new Date().getFullYear(),
        planoMinimo: "BASICO",
        trailerUrlYoutube: trailerUrl,
        generosIds: generosIds,
        temporadas: [] 
      };

      const formData = new FormData();
      formData.append("dados", new Blob([JSON.stringify(dadosSerie)], { type: "application/json" }));
      formData.append("capa", imageFile);

      const resp = await api.post("/series", formData, { headers: { "Content-Type": "multipart/form-data" }});
      setSeries([resp.data, ...series]);
      toast.success(`${detalhes.name} importada com sucesso!`);
    } catch (error: any) { toast.error(error.message || "Erro ao importar."); } 
    finally { setImportandoId(null); }
  };

  const abrirModalDeletar = (id: number) => {
    setIdParaDeletar(id);
    setShowDeleteModal(true);
  };

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
    } finally {
      setDeletando(false);
    }
  };

  const handleChangePlano = async (serie: Serie, novoPlano: string) => {
    try {
      const dadosSerie = {
        titulo: serie.titulo, descricao: serie.descricao, anoLancamento: serie.anoLancamento,
        trailerUrlYoutube: serie.trailerUrlYoutube, planoMinimo: novoPlano, generosIds: serie.generos.map(g => g.id),
        temporadas: []
      };
      const formData = new FormData();
      formData.append("dados", new Blob([JSON.stringify(dadosSerie)], { type: "application/json" }));
      const resp = await api.put(`/series/${serie.id}`, formData, { headers: { "Content-Type": "multipart/form-data" }});
      setSeries(series.map(s => s.id === serie.id ? resp.data : s));
      toast.success(`Plano atualizado para ${novoPlano}!`);
    } catch (error) { toast.error("Erro ao alterar o plano."); }
  };

  return (
    <>
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
                      <p className="text-gray-500 text-xs mb-1">{serie.first_air_date?.substring(0,4)}</p>
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

      <CustomModal isOpen={showDeleteModal} title="Excluir Série" icon={<Trash2 className="w-8 h-8" />} centerTitle>
        <p className="text-gray-400 mb-8 leading-relaxed text-center">
          Tem certeza que deseja deletar esta série do catálogo? Esta ação apagará as temporadas, episódios e o histórico de todos os usuários.
        </p>
        <div className="flex gap-4 w-full">
          <LoadingButton variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</LoadingButton>
          <LoadingButton onClick={confirmarDeletar} isLoading={deletando} textLoading="Excluindo...">Sim, Excluir</LoadingButton>
        </div>
      </CustomModal>

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
                    <TableCell>
                      <div className="relative inline-block">
                        <select value={serie.planoMinimo || "BASICO"} onChange={(e) => handleChangePlano(serie, e.target.value)} className={`appearance-none cursor-pointer pr-6 pl-2 py-1 rounded text-[10px] font-extrabold focus:outline-none focus:ring-1 focus:ring-red-600 transition-colors ${serie.planoMinimo === 'PREMIUM' ? 'bg-yellow-500 text-black' : serie.planoMinimo === 'PADRAO' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}>
                          <option value="BASICO" className="bg-[#141414] text-gray-300 font-bold">BÁSICO</option>
                          <option value="PADRAO" className="bg-[#141414] text-gray-300 font-bold">PADRÃO</option>
                          <option value="PREMIUM" className="bg-[#141414] text-gray-300 font-bold">PREMIUM</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center px-1"><svg className={`fill-current h-3 w-3 ${serie.planoMinimo === 'PREMIUM' ? 'text-black' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => abrirModalDeletar(serie.id)} className="text-gray-500 hover:text-red-500 p-2 transition">
                        <Trash2 className="w-5 h-5" />
                      </button>
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