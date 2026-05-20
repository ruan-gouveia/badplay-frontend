"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Filme, Serie, Avaliacao } from "@/types/conteudo";
import Navbar from "@/components/Navbar";
import PageWrapper from "@/components/PageWrapper";
import { Star } from "lucide-react";

export default function ConteudoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [conteudo, setConteudo] = useState<Filme | Serie | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [nomeUsuarioLogado, setNomeUsuarioLogado] = useState("");

  // ================= ESTADOS DE AVALIAÇÃO =================
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [minhaNota, setMinhaNota] = useState(0); 
  const [meuComentario, setMeuComentario] = useState("");
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNota, setEditNota] = useState(0);
  const [editComentario, setEditComentario] = useState("");

  useEffect(() => {
    setNomeUsuarioLogado(localStorage.getItem("@BadPlay:nome") || "");

    const carregarDados = async () => {
      try {
        // 1. Busca Filme ou Série
        try {
          const resp = await api.get(`/filmes/${id}`);
          setConteudo(resp.data);
        } catch (err: any) {
          if (err.response?.status === 404) {
            const respSerie = await api.get(`/series/${id}`);
            setConteudo(respSerie.data);
          } else { throw err; }
        }

        // 2. Busca as Avaliações da Comunidade
        const respAvaliacoes = await api.get(`/avaliacoes/conteudo/${id}`);
        setAvaliacoes(respAvaliacoes.data);

        // 3. Registra silenciosamente no Histórico que ele abriu o filme
        await api.post("/historico", { conteudoId: Number(id), tempoAssistidoSegundos: 0 });

      } catch (error: any) {
        if (error.response?.status === 400 && error.response?.data?.erro?.includes("Acesso Negado")) {
          setShowUpgradeModal(true);
        }
      } finally {
        setCarregando(false);
      }
    };

    if (id) carregarDados();
  }, [id, router]);

  // =============== LÓGICA DE AVALIAÇÃO (Reatividade Instantânea) ===============
  
  const minhaAvaliacaoExistente = avaliacoes.find(av => av.nomeUsuario === nomeUsuarioLogado);

  const handleAvaliar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (minhaNota === 0) { alert("Por favor, selecione as estrelas da sua nota."); return; }
    if (!meuComentario.trim()) return;
    
    setEnviandoAvaliacao(true);
    try {
      const resp = await api.post("/avaliacoes", { 
        conteudoId: Number(id), 
        nota: minhaNota, 
        comentarioSocial: meuComentario 
      });
      
      // MÁGICA: Atualiza a tela instantaneamente adicionando a nova avaliação na lista!
      setAvaliacoes([...avaliacoes, resp.data]);
      setMeuComentario("");
      setMinhaNota(0);
    } catch (error) {
      alert("Erro ao enviar avaliação.");
    } finally {
      setEnviandoAvaliacao(false);
    }
  };

  const handleSalvarEdicao = async () => {
    if (editNota === 0) { alert("A nota não pode ser zero."); return; }
    setEnviandoAvaliacao(true);
    try {
      const resp = await api.post("/avaliacoes", { 
        conteudoId: Number(id), 
        nota: editNota, 
        comentarioSocial: editComentario 
      });
      
      // MÁGICA: Troca a avaliação antiga pela nova na tela sem recarregar a página!
      setAvaliacoes(avaliacoes.map(av => av.id === resp.data.id ? resp.data : av));
      setShowEditModal(false);
    } catch (error) {
      alert("Erro ao atualizar avaliação.");
    } finally {
      setEnviandoAvaliacao(false);
    }
  };

  const handleDeletarAvaliacao = async (idAvaliacao: number) => {
    if (!confirm("Tem certeza que deseja remover sua avaliação?")) return;
    try {
      await api.delete(`/avaliacoes/${idAvaliacao}`);
      
      // MÁGICA: Remove da tela instantaneamente!
      setAvaliacoes(avaliacoes.filter(av => av.id !== idAvaliacao));
    } catch (error) {
      alert("Erro ao deletar avaliação.");
    }
  };

  const abrirModalEdicao = (av: Avaliacao) => {
    setEditNota(av.nota);
    setEditComentario(av.comentarioSocial);
    setShowEditModal(true);
  };

  // =============== HELPERS E RENDERIZAÇÃO ===============

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
    <PageWrapper className="p-0">
      <Navbar />

      {/* MODAL DE UPGRADE */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-[#1a1a1a] border border-gray-800 p-8 rounded-xl max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-600/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-2">Plano Insuficiente</h2>
            <p className="text-gray-400 mb-6">Exclusivo para assinantes <strong className="text-white">{planoMinimoReal}</strong>.</p>
            <div className="flex gap-4 w-full">
              <button onClick={() => { setShowUpgradeModal(false); router.push("/catalogo"); }} className="flex-1 py-3 rounded font-bold text-white bg-gray-800 hover:bg-gray-700">Voltar</button>
              <button onClick={() => router.push("/planos")} className="flex-1 py-3 rounded font-bold text-white bg-red-600 hover:bg-red-700">Ver Planos</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE AVALIAÇÃO */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-[#1a1a1a] border border-gray-800 p-8 rounded-xl max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Editar Avaliação</h2>
            
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} onClick={() => setEditNota(star)}
                  className={`w-8 h-8 cursor-pointer transition-colors ${editNota >= star ? "fill-yellow-500 text-yellow-500" : "text-gray-600 hover:text-gray-400"}`} 
                />
              ))}
              <span className="ml-2 text-white font-bold">{editNota}.0</span>
            </div>

            <textarea required value={editComentario} onChange={(e) => setEditComentario(e.target.value)}
              className="w-full bg-[#141414] text-white p-4 rounded border border-gray-700 focus:border-blue-500 focus:outline-none resize-none h-32 mb-6"
            />
            
            <div className="flex gap-4 w-full">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 rounded font-bold text-white bg-gray-800 hover:bg-gray-700">Cancelar</button>
              <button onClick={handleSalvarEdicao} disabled={enviandoAvaliacao} className="flex-1 py-3 rounded font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                {enviandoAvaliacao ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAYER */}
      <div className="relative w-full h-[60vh] md:h-[80vh] bg-black pt-20">
        {ytId && !showUpgradeModal ? (
          <iframe className="w-full h-full border-none" src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=0&controls=1&modestbranding=1`} title="Trailer" allowFullScreen></iframe>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900/20">
            <span className="text-4xl mb-2">🎬</span><p>Trailer bloqueado ou não disponível.</p>
          </div>
        )}
      </div>

      {/* INFORMAÇÕES GERAIS */}
      <div className="max-w-6xl mx-auto px-6 py-8 w-full pb-20">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{conteudo.titulo}</h1>
        <div className="flex items-center gap-4 text-gray-300 font-medium mb-6">
          <span className="text-green-500 font-bold">98% Relevante</span>
          <span>{conteudo.anoLancamento}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${planoMinimoReal === 'PREMIUM' ? 'bg-yellow-500 text-black' : planoMinimoReal === 'PADRAO' ? 'bg-blue-600 text-white' : 'border border-gray-500 text-gray-300'}`}>
            Plano {planoMinimoReal}
          </span>
          <span>{'duracaoMinutos' in conteudo ? `${(conteudo as Filme).duracaoMinutos} min` : 'Série'}</span>
        </div>
        <p className="text-lg text-gray-200 mb-8 max-w-3xl leading-relaxed">{conteudo.descricao}</p>

        {/* BOTOES ADICIONAIS */}
        <div className="flex items-center gap-6 border-b border-gray-800 pb-10">
          <button className="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition">
            <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center text-2xl pb-1">+</div>
            <span className="text-sm font-semibold">Minha Lista</span>
          </button>
        </div>

        {/* MÓDULO DE AVALIAÇÕES */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Coluna Esquerda: Formulário ou Trava de Já Avaliou */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">Sua Avaliação</h3>
            {minhaAvaliacaoExistente ? (
              <div className="bg-[#222222] rounded-lg p-6 border border-gray-800 flex flex-col items-center justify-center text-center h-[280px]">
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4 text-2xl">✓</div>
                <p className="text-gray-300 font-semibold mb-2">Você já avaliou este conteúdo!</p>
                <div className="flex items-center justify-center text-yellow-500 text-xl font-bold mb-4">
                  <Star className="w-5 h-5 fill-current mr-2" /> {minhaAvaliacaoExistente.nota.toFixed(1)}
                </div>
                <p className="text-sm text-gray-500">Para alterar, use o botão de edição no seu comentário ao lado.</p>
              </div>
            ) : (
              <form onSubmit={handleAvaliar} className="bg-[#222222] rounded-lg p-6 border border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} onClick={() => setMinhaNota(star)}
                      className={`w-8 h-8 cursor-pointer transition-colors ${minhaNota >= star ? "fill-yellow-500 text-yellow-500" : "text-gray-600 hover:text-gray-400"}`} 
                    />
                  ))}
                  <span className="ml-2 text-white font-bold">{minhaNota > 0 ? `${minhaNota}.0` : ""}</span>
                </div>

                <textarea required value={meuComentario} onChange={(e) => setMeuComentario(e.target.value)} placeholder="O que você achou deste conteúdo?"
                  className="w-full bg-[#141414] text-white p-4 rounded border border-gray-700 focus:border-red-600 focus:outline-none resize-none h-32 mb-4 placeholder-gray-500"
                />
                <button type="submit" disabled={enviandoAvaliacao} className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded transition-colors disabled:opacity-50">
                  {enviandoAvaliacao ? "Enviando..." : "Publicar Avaliação"}
                </button>
              </form>
            )}
          </div>

          {/* Coluna Direita: Avaliações da Comunidade (Com Rolagem e Botões Exclusivos) */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">O que estão achando</h3>
            <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {avaliacoes.length === 0 ? (
                <p className="text-gray-500 italic bg-[#222222] p-6 rounded-lg border border-gray-800">
                  Nenhuma avaliação ainda. Seja o primeiro a opinar!
                </p>
              ) : (
                avaliacoes.map((av) => {
                  const isMeuComentario = av.nomeUsuario === nomeUsuarioLogado;
                  
                  return (
                    <div key={av.id} className={`bg-[#222222] rounded-lg p-6 border transition-colors ${isMeuComentario ? 'border-gray-500' : 'border-gray-800'}`}>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-600 flex-shrink-0 flex items-center justify-center font-bold text-white text-lg">
                          {av.nomeUsuario.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-white font-bold text-base">{av.nomeUsuario} {isMeuComentario && <span className="text-xs text-gray-500 font-normal ml-2">(Você)</span>}</p>
                            <div className="flex items-center text-yellow-500 text-sm font-bold">
                              <Star className="w-3.5 h-3.5 fill-current mr-1" /> {av.nota.toFixed(1)}
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">{av.comentarioSocial}</p>
                          
                          {/* BOTÕES DE AÇÃO (Apenas pro dono do comentário) */}
                          {isMeuComentario && (
                            <div className="flex justify-end gap-4 mt-4 pt-3 border-t border-gray-700/50">
                              <button onClick={() => abrirModalEdicao(av)} className="text-blue-500 hover:text-blue-400 text-xs font-semibold uppercase tracking-wider transition-colors">
                                Editar
                              </button>
                              <button onClick={() => handleDeletarAvaliacao(av.id)} className="text-red-500 hover:text-red-400 text-xs font-semibold uppercase tracking-wider transition-colors">
                                Remover
                              </button>
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
  );
}