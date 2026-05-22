"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Filme, Serie, Avaliacao } from "@/types/conteudo";
import Navbar from "@/components/Navbar";
import PageWrapper from "@/components/PageWrapper";
import CustomModal from "@/components/shared/CustomModal";
import LoadingButton from "@/components/shared/LoadingButton";
import { Star, Lock } from "lucide-react";

export default function ConteudoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [conteudo, setConteudo] = useState<Filme | Serie | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [nomeUsuarioLogado, setNomeUsuarioLogado] = useState("");

  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [minhaNota, setMinhaNota] = useState(0); 
  const [meuComentario, setMeuComentario] = useState("");
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNota, setEditNota] = useState(0);
  const [editComentario, setEditComentario] = useState("");

  const buscarDetalhes = async () => {
    try {
      try {
        const resp = await api.get(`/filmes/${id}`);
        setConteudo(resp.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          const respSerie = await api.get(`/series/${id}`);
          setConteudo(respSerie.data);
        } else { throw err; }
      }
      const respAvaliacoes = await api.get(`/avaliacoes/conteudo/${id}`);
      setAvaliacoes(respAvaliacoes.data);
      await api.post("/historico", { conteudoId: Number(id), tempoAssistidoSegundos: 0 });
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.erro?.includes("Acesso Negado")) {
        setShowUpgradeModal(true);
      }
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    setNomeUsuarioLogado(localStorage.getItem("@BadPlay:nome") || "");
    if (id) buscarDetalhes();
  }, [id, router]);

  const minhaAvaliacaoExistente = avaliacoes.find(av => av.nomeUsuario === nomeUsuarioLogado);

  const handleAvaliar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (minhaNota === 0) return;
    if (!meuComentario.trim()) return;
    setEnviandoAvaliacao(true);
    try {
      const resp = await api.post("/avaliacoes", { conteudoId: Number(id), nota: minhaNota, comentarioSocial: meuComentario });
      setAvaliacoes([...avaliacoes, resp.data]);
      setMeuComentario("");
      setMinhaNota(0);
    } catch (error) {} finally { setEnviandoAvaliacao(false); }
  };

  const handleSalvarEdicao = async () => {
    if (editNota === 0) return;
    setEnviandoAvaliacao(true);
    try {
      const resp = await api.post("/avaliacoes", { conteudoId: Number(id), nota: editNota, comentarioSocial: editComentario });
      setAvaliacoes(avaliacoes.map(av => av.id === resp.data.id ? resp.data : av));
      setShowEditModal(false);
    } catch (error) {} finally { setEnviandoAvaliacao(false); }
  };

  const handleDeletarAvaliacao = async (idAvaliacao: number) => {
    if (!confirm("Tem certeza que deseja remover sua avaliação?")) return;
    try {
      await api.delete(`/avaliacoes/${idAvaliacao}`);
      setAvaliacoes(avaliacoes.filter(av => av.id !== idAvaliacao));
    } catch (error) {}
  };

  const abrirModalEdicao = (av: Avaliacao) => {
    setEditNota(av.nota);
    setEditComentario(av.comentarioSocial);
    setShowEditModal(true);
  };

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (carregando) return <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center">Carregando conteúdo...</div>;
  if (!conteudo) return <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center">Conteúdo não encontrado.</div>;

  const ytId = getYouTubeId(conteudo.trailerUrlYoutube);
  const planoMinimoReal = conteudo.planoMinimo || "BASICO";

  return (
    <>
      <CustomModal isOpen={showUpgradeModal} title="Acesso Restrito" icon={<Lock className="w-8 h-8" />} centerTitle>
        <p className="text-gray-400 mb-8 leading-relaxed text-center">
          Este conteúdo é exclusivo para assinantes do plano <strong className="text-white">{planoMinimoReal}</strong>. Faça o upgrade agora para liberar o acesso imediatamente.
        </p>
        <div className="flex gap-4 w-full">
          <LoadingButton variant="secondary" onClick={() => { setShowUpgradeModal(false); router.push("/catalogo"); }}>Voltar</LoadingButton>
          <LoadingButton onClick={() => router.push("/planos")}>Fazer Upgrade</LoadingButton>
        </div>
      </CustomModal>

      <CustomModal isOpen={showEditModal} title="Editar Avaliação">
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} onClick={() => setEditNota(star)} className={`w-8 h-8 cursor-pointer transition-colors ${editNota >= star ? "fill-yellow-500 text-yellow-500" : "text-gray-600 hover:text-gray-400"}`} />
          ))}
          <span className="ml-2 text-white font-bold">{editNota}.0</span>
        </div>
        <textarea required value={editComentario} onChange={(e) => setEditComentario(e.target.value)} className="w-full bg-[#141414] text-white p-4 rounded-md border border-gray-700 focus:border-red-600 focus:outline-none resize-none h-32 mb-8 placeholder-gray-600" />
        <div className="flex gap-4 w-full">
          <LoadingButton variant="secondary" onClick={() => setShowEditModal(false)}>Cancelar</LoadingButton>
          <LoadingButton onClick={handleSalvarEdicao} isLoading={enviandoAvaliacao} textLoading="Salvando...">Salvar</LoadingButton>
        </div>
      </CustomModal>

      <PageWrapper className="p-0">
        <Navbar />

        <div className="relative w-full h-[60vh] md:h-[80vh] bg-black pt-20">
          {ytId && !showUpgradeModal ? (
            <iframe className="w-full h-full border-none" src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=0&controls=1&modestbranding=1`} title="Trailer" allowFullScreen></iframe>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900/20"><span className="text-4xl mb-2">🎬</span><p>Trailer bloqueado ou não disponível.</p></div>
          )}
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8 w-full pb-20">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{conteudo.titulo}</h1>
          <div className="flex items-center gap-4 text-gray-300 font-medium mb-6">
            <span className="text-green-500 font-bold">98% Relevante</span>
            <span>{conteudo.anoLancamento}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${planoMinimoReal === 'PREMIUM' ? 'bg-yellow-500 text-black' : planoMinimoReal === 'PADRAO' ? 'bg-blue-600 text-white' : 'border border-gray-500 text-gray-300'}`}>Plano {planoMinimoReal}</span>
            <span>{'duracaoMinutos' in conteudo ? `${(conteudo as Filme).duracaoMinutos} min` : 'Série'}</span>
          </div>
          <p className="text-lg text-gray-200 mb-8 max-w-3xl leading-relaxed">{conteudo.descricao}</p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Sua Avaliação</h3>
              {minhaAvaliacaoExistente ? (
                <div className="bg-[#111111] rounded-2xl p-8 border border-gray-800 flex flex-col items-center justify-center text-center h-[280px]">
                  <div className="w-16 h-16 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full flex items-center justify-center mb-4 text-2xl">✓</div>
                  <p className="text-gray-200 font-semibold mb-2 text-lg">Você já avaliou este conteúdo!</p>
                  <div className="flex items-center justify-center text-yellow-500 text-xl font-bold mb-4"><Star className="w-5 h-5 fill-current mr-2" /> {minhaAvaliacaoExistente.nota.toFixed(1)}</div>
                </div>
              ) : (
                <form onSubmit={handleAvaliar} className="bg-[#111111] rounded-2xl p-6 border border-gray-800">
                  <div className="flex items-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} onClick={() => setMinhaNota(star)} className={`w-8 h-8 cursor-pointer transition-colors ${minhaNota >= star ? "fill-yellow-500 text-yellow-500" : "text-gray-600 hover:text-gray-400"}`} />
                    ))}
                    <span className="ml-2 text-white font-bold">{minhaNota > 0 ? `${minhaNota}.0` : ""}</span>
                  </div>
                  <textarea required value={meuComentario} onChange={(e) => setMeuComentario(e.target.value)} placeholder="O que você achou deste conteúdo?" className="w-full bg-[#141414] text-white p-4 rounded-md border border-gray-700 focus:border-red-600 focus:outline-none resize-none h-32 mb-4 placeholder-gray-600" />
                  <LoadingButton type="submit" isLoading={enviandoAvaliacao} textLoading="Enviando...">Publicar Avaliação</LoadingButton>
                </form>
              )}
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-6">O que estão achando</h3>
              <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {avaliacoes.length === 0 ? (
                  <p className="text-gray-500 italic bg-[#111111] p-6 rounded-2xl border border-gray-800 text-center py-10">Nenhuma avaliação ainda. Seja o primeiro a opinar!</p>
                ) : (
                  avaliacoes.map((av) => {
                    const isMeuComentario = av.nomeUsuario === nomeUsuarioLogado;
                    return (
                      <div key={av.id} className={`bg-[#111111] rounded-2xl p-6 border transition-colors ${isMeuComentario ? 'border-gray-600' : 'border-gray-800'}`}>
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/30 flex-shrink-0 flex items-center justify-center font-bold text-red-500 text-lg">{av.nomeUsuario.charAt(0).toUpperCase()}</div>
                          <div className="flex-grow">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-white font-bold text-base">{av.nomeUsuario} {isMeuComentario && <span className="text-xs text-gray-500 font-normal ml-2">(Você)</span>}</p>
                              <div className="flex items-center text-yellow-500 text-sm font-bold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20"><Star className="w-3.5 h-3.5 fill-current mr-1" /> {av.nota.toFixed(1)}</div>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">{av.comentarioSocial}</p>
                            {isMeuComentario && (
                              <div className="flex justify-end gap-5 mt-5 pt-4 border-t border-gray-800">
                                <button onClick={() => abrirModalEdicao(av)} className="text-gray-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors">Editar</button>
                                <button onClick={() => handleDeletarAvaliacao(av.id)} className="text-red-500/80 hover:text-red-500 text-xs font-semibold uppercase tracking-wider transition-colors">Remover</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}