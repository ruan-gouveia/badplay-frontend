"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Filme, Genero } from "@/types/conteudo";
import axios from "axios";
import { Search, Plus, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import LoadingButton from "@/components/shared/LoadingButton";
import CustomModal from "@/components/shared/CustomModal";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TMDBResult {
  id: number; title: string; release_date: string; poster_path: string; overview: string;
}

export default function AdminFilmesPage() {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [generosLocais, setGenerosLocais] = useState<Genero[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [showTmdbModal, setShowTmdbModal] = useState(false);
  const [query, setQuery] = useState("");
  const [resultadosTmdb, setResultadosTmdb] = useState<TMDBResult[]>([]);
  const [buscandoTmdb, setBuscandoTmdb] = useState(false);
  const [importandoId, setImportandoId] = useState<number | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idParaDeletar, setIdParaDeletar] = useState<number | null>(null);
  const [deletando, setDeletando] = useState(false);

  const buscarFilmesBanco = async () => {
    try {
      const resp = await api.get<Filme[]>("/filmes");
      setFilmes(resp.data.sort((a, b) => b.id - a.id));
    } catch (error) { toast.error("Erro ao buscar filmes do banco."); }
    finally { setCarregando(false); }
  };

  useEffect(() => {
    const buscarDadosIniciais = async () => {
      try {
        const respGeneros = await api.get<Genero[]>("/generos");
        setGenerosLocais(respGeneros.data);
      } catch (error) {}
      buscarFilmesBanco();
    };
    buscarDadosIniciais();
  }, []);

  const buscarMelhorTrailer = async (tmdbId: string | number, tipo: 'movie' | 'tv', tmdbKey: string) => {
    const buscar = async (lang: string) => {
      try {
        const res = await axios.get(`https://api.themoviedb.org/3/${tipo}/${tmdbId}/videos?api_key=${tmdbKey}&language=${lang}`);
        const videos = res.data.results || [];
        let vid = videos.find((v: any) => v.site === "YouTube" && v.type === "Trailer");
        if (!vid) vid = videos.find((v: any) => v.site === "YouTube" && v.type === "Teaser");
        if (!vid) vid = videos.find((v: any) => v.site === "YouTube"); 
        return vid ? `https://www.youtube.com/watch?v=${vid.key}` : null;
      } catch { return null; }
    };
    return (await buscar("pt-BR")) || (await buscar("en-US")) || "";
  };

  const buscarNoTMDB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setBuscandoTmdb(true);
    try {
      const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      const resp = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`);
      setResultadosTmdb(resp.data.results);
    } catch (error) { toast.error("Erro ao comunicar com o TMDb."); } 
    finally { setBuscandoTmdb(false); }
  };

  const urlToFile = async (url: string, filename: string, mimeType: string): Promise<File> => {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return new File([buf], filename, { type: mimeType });
  };

  const handleImportarFilme = async (tmdbFilme: TMDBResult) => {
    setImportandoId(tmdbFilme.id);
    try {
      const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      if (!TMDB_KEY) throw new Error("API Key não encontrada.");

      const detalhes = (await axios.get(`https://api.themoviedb.org/3/movie/${tmdbFilme.id}?api_key=${TMDB_KEY}&language=pt-BR`)).data;
      const trailerUrl = await buscarMelhorTrailer(tmdbFilme.id, 'movie', TMDB_KEY);

      const generosIds: number[] = [];
      if (detalhes.genres) {
        detalhes.genres.forEach((g: any) => {
          const localMatch = generosLocais.find(local => local.nome.toLowerCase() === g.name.toLowerCase());
          if (localMatch) generosIds.push(localMatch.id);
        });
      }

      let imageFile: File | null = null;
      if (tmdbFilme.poster_path) {
        imageFile = await urlToFile(`https://image.tmdb.org/t/p/w500${tmdbFilme.poster_path}`, `tmdb_${tmdbFilme.id}.jpg`, 'image/jpeg');
      }
      if (!imageFile) throw new Error("Filme sem capa não pode ser importado.");

      const dadosFilme = {
        titulo: detalhes.title,
        descricao: detalhes.overview || "Sem descrição.",
        anoLancamento: detalhes.release_date ? parseInt(detalhes.release_date.substring(0, 4)) : new Date().getFullYear(),
        duracaoMinutos: detalhes.runtime || 120,
        planoMinimo: "BASICO", 
        trailerUrlYoutube: trailerUrl,
        generosIds: generosIds
      };

      const formData = new FormData();
      formData.append("dados", new Blob([JSON.stringify(dadosFilme)], { type: "application/json" }));
      formData.append("capa", imageFile);

      const resp = await api.post("/filmes", formData, { headers: { "Content-Type": "multipart/form-data" }});
      setFilmes([resp.data, ...filmes]);
      toast.success(`${detalhes.title} importado com sucesso!`);
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
      await api.delete(`/filmes/${idParaDeletar}`);
      setFilmes(filmes.filter(f => f.id !== idParaDeletar));
      toast.success("Filme removido do catálogo!");
      setShowDeleteModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.erro || "Erro ao deletar filme.");
    } finally {
      setDeletando(false);
    }
  };

  const handleChangePlano = async (filme: Filme, novoPlano: string) => {
    try {
      const dadosFilme = {
        titulo: filme.titulo, descricao: filme.descricao, anoLancamento: filme.anoLancamento,
        duracaoMinutos: filme.duracaoMinutos, trailerUrlYoutube: filme.trailerUrlYoutube,
        planoMinimo: novoPlano, generosIds: filme.generos.map(g => g.id) 
      };
      const formData = new FormData();
      formData.append("dados", new Blob([JSON.stringify(dadosFilme)], { type: "application/json" }));
      const resp = await api.put(`/filmes/${filme.id}`, formData, { headers: { "Content-Type": "multipart/form-data" }});
      setFilmes(filmes.map(f => f.id === filme.id ? resp.data : f));
      toast.success(`Plano atualizado para ${novoPlano}!`);
    } catch (error) { toast.error("Erro ao alterar o plano."); }
  };

  return (
    <>
      <CustomModal isOpen={showTmdbModal} title="Buscar Filme (TMDb)" maxWidth="max-w-4xl">
        <form onSubmit={buscarNoTMDB} className="flex gap-2 mb-6">
          <input type="text" autoFocus placeholder="Digite o nome (Ex: Vingadores, Matrix)..." value={query} onChange={(e) => setQuery(e.target.value)} className="flex-grow bg-[#141414] text-white p-3 rounded-md border border-gray-700 focus:border-red-600 focus:outline-none" />
          <LoadingButton type="submit" isLoading={buscandoTmdb} textLoading="Buscando..." className="!w-auto px-6"><Search className="w-5 h-5 mr-2" /> Buscar</LoadingButton>
        </form>
        <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {resultadosTmdb.length === 0 && !buscandoTmdb ? (
            <p className="text-gray-500 text-center py-10">Pesquise por um filme para importar.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resultadosTmdb.map(filme => (
                <div key={filme.id} className="bg-[#141414] border border-gray-800 rounded-lg p-3 flex gap-4 hover:border-gray-600 transition">
                  {filme.poster_path ? <img src={`https://image.tmdb.org/t/p/w200${filme.poster_path}`} alt="poster" className="w-20 h-30 object-cover rounded shadow-md" /> : <div className="w-20 h-30 bg-gray-900 rounded flex items-center justify-center text-gray-700"><ImageIcon /></div>}
                  <div className="flex flex-col justify-between flex-grow overflow-hidden">
                    <div>
                      <h4 className="text-white font-bold truncate text-sm">{filme.title}</h4>
                      <p className="text-gray-500 text-xs mb-1">{filme.release_date?.substring(0,4)}</p>
                      <p className="text-gray-400 text-xs line-clamp-3 leading-snug">{filme.overview || "Sem sinopse disponível."}</p>
                    </div>
                    <button onClick={() => handleImportarFilme(filme)} disabled={importandoId === filme.id} className="mt-2 text-xs font-bold text-red-500 hover:text-red-400 text-right uppercase disabled:opacity-50 flex justify-end items-center gap-2">
                      {importandoId === filme.id ? <><Loader2 className="w-3 h-3 animate-spin" /> Importando...</> : "Importar Filme"}
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

      <CustomModal isOpen={showDeleteModal} title="Excluir Filme" icon={<Trash2 className="w-8 h-8" />} centerTitle>
        <p className="text-gray-400 mb-8 leading-relaxed text-center">
          Tem certeza que deseja deletar este filme do catálogo? Esta ação apagará o histórico e as listas de todos os usuários.
        </p>
        <div className="flex gap-4 w-full">
          <LoadingButton variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</LoadingButton>
          <LoadingButton onClick={confirmarDeletar} isLoading={deletando} textLoading="Excluindo...">Sim, Excluir</LoadingButton>
        </div>
      </CustomModal>

      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Gerenciar Filmes</h2>
            <p className="text-gray-400">Adicione, edite ou remova os filmes do catálogo.</p>
          </div>
          <LoadingButton onClick={() => setShowTmdbModal(true)} className="!w-auto px-6">
            <Plus className="w-5 h-5 mr-2" /> Adicionar Filme (TMDb)
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
                {filmes.map((filme) => (
                  <TableRow key={filme.id} className="border-gray-800 hover:bg-gray-900/50">
                    <TableCell className="font-medium text-gray-500">#{filme.id}</TableCell>
                    <TableCell className="text-white font-bold">{filme.titulo}</TableCell>
                    <TableCell className="text-gray-400">{filme.anoLancamento}</TableCell>
                    <TableCell>
                      <div className="relative inline-block">
                        <select value={filme.planoMinimo || "BASICO"} onChange={(e) => handleChangePlano(filme, e.target.value)} className={`appearance-none cursor-pointer pr-6 pl-2 py-1 rounded text-[10px] font-extrabold focus:outline-none focus:ring-1 focus:ring-red-600 transition-colors ${filme.planoMinimo === 'PREMIUM' ? 'bg-yellow-500 text-black' : filme.planoMinimo === 'PADRAO' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}>
                          <option value="BASICO" className="bg-[#141414] text-gray-300 font-bold">BÁSICO</option>
                          <option value="PADRAO" className="bg-[#141414] text-gray-300 font-bold">PADRÃO</option>
                          <option value="PREMIUM" className="bg-[#141414] text-gray-300 font-bold">PREMIUM</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center px-1"><svg className={`fill-current h-3 w-3 ${filme.planoMinimo === 'PREMIUM' ? 'text-black' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => abrirModalDeletar(filme.id)} className="text-gray-500 hover:text-red-500 p-2 transition"><Trash2 className="w-5 h-5" /></button>
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