"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Avaliacao } from "@/types/conteudo";
import { Star, Trash2 } from "lucide-react";
import CustomModal from "@/components/shared/CustomModal";
import LoadingButton from "@/components/shared/LoadingButton";
import { toast } from "sonner";

export default function SecaoAvaliacoes({ conteudoId }: { conteudoId: string }) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [nomeUsuarioLogado, setNomeUsuarioLogado] = useState("");

  const [minhaNota, setMinhaNota] = useState(0); 
  const [meuComentario, setMeuComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNota, setEditNota] = useState(0);
  const [editComentario, setEditComentario] = useState("");

  // NOVO: Estados do Modal de Exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [avaliacaoParaDeletar, setAvaliacaoParaDeletar] = useState<number | null>(null);

  useEffect(() => {
    setNomeUsuarioLogado(localStorage.getItem("@BadPlay:nome") || "");
    api.get(`/avaliacoes/conteudo/${conteudoId}`).then(res => setAvaliacoes(res.data)).catch(console.error);
  }, [conteudoId]);

  const minhaAvaliacaoExistente = avaliacoes.find(av => av.nomeUsuario === nomeUsuarioLogado);

  const handleAvaliar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (minhaNota === 0) { toast.error("Selecione as estrelas da sua nota."); return; }
    if (!meuComentario.trim()) return;
    setEnviando(true);
    try {
      const resp = await api.post("/avaliacoes", { conteudoId: Number(conteudoId), nota: minhaNota, comentarioSocial: meuComentario });
      setAvaliacoes([...avaliacoes, resp.data]);
      setMeuComentario(""); setMinhaNota(0);
      toast.success("Avaliação publicada!");
    } catch (error) { toast.error("Erro ao enviar avaliação."); } 
    finally { setEnviando(false); }
  };

  const handleSalvarEdicao = async () => {
    if (editNota === 0) return;
    setEnviando(true);
    try {
      const resp = await api.post("/avaliacoes", { conteudoId: Number(conteudoId), nota: editNota, comentarioSocial: editComentario });
      setAvaliacoes(avaliacoes.map(av => av.id === resp.data.id ? resp.data : av));
      setShowEditModal(false);
      toast.success("Avaliação atualizada!");
    } catch (error) { toast.error("Erro ao atualizar."); } 
    finally { setEnviando(false); }
  };

  const confirmarExclusao = async () => {
    if (!avaliacaoParaDeletar) return;
    setEnviando(true);
    try {
      await api.delete(`/avaliacoes/${avaliacaoParaDeletar}`);
      setAvaliacoes(avaliacoes.filter(av => av.id !== avaliacaoParaDeletar));
      setShowDeleteModal(false);
      toast.success("Avaliação removida.");
    } catch (error) { toast.error("Erro ao remover."); }
    finally { setEnviando(false); }
  };

  const abrirModalEdicao = (av: Avaliacao) => {
    setEditNota(av.nota); setEditComentario(av.comentarioSocial); setShowEditModal(true);
  };

  return (
    <>
      <CustomModal isOpen={showEditModal} title="Editar Avaliação">
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} onClick={() => setEditNota(star)} className={`w-8 h-8 cursor-pointer transition-colors ${editNota >= star ? "fill-yellow-500 text-yellow-500" : "text-gray-600 hover:text-gray-400"}`} />
          ))}
          <span className="ml-2 text-white font-bold">{editNota}.0</span>
        </div>
        <textarea required value={editComentario} onChange={(e) => setEditComentario(e.target.value)} className="w-full bg-[#141414] text-white p-4 rounded-md border border-gray-700 focus:border-red-600 focus:outline-none resize-none h-32 mb-8" />
        <div className="flex gap-4 w-full">
          <LoadingButton variant="secondary" onClick={() => setShowEditModal(false)}>Cancelar</LoadingButton>
          <LoadingButton onClick={handleSalvarEdicao} isLoading={enviando} textLoading="Salvando...">Salvar</LoadingButton>
        </div>
      </CustomModal>

      {/* NOVO: MODAL DE EXCLUIR AVALIAÇÃO */}
      <CustomModal isOpen={showDeleteModal} title="Excluir Avaliação" icon={<Trash2 className="w-8 h-8" />} centerTitle>
        <p className="text-gray-400 mb-8 leading-relaxed text-center">Tem certeza que deseja apagar sua avaliação? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-4 w-full">
          <LoadingButton variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</LoadingButton>
          <LoadingButton onClick={confirmarExclusao} isLoading={enviando} textLoading="Excluindo...">Sim, Excluir</LoadingButton>
        </div>
      </CustomModal>

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
              <textarea required value={meuComentario} onChange={(e) => setMeuComentario(e.target.value)} placeholder="O que você achou deste conteúdo?" className="w-full bg-[#141414] text-white p-4 rounded-md border border-gray-700 focus:border-red-600 focus:outline-none resize-none h-32 mb-4" />
              <LoadingButton type="submit" isLoading={enviando} textLoading="Enviando...">Publicar Avaliação</LoadingButton>
            </form>
          )}
        </div>

        <div>
          <h3 className="text-2xl font-bold text-white mb-6">O que estão achando</h3>
          <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {avaliacoes.length === 0 ? (
              <p className="text-gray-500 italic bg-[#111111] p-6 rounded-2xl border border-gray-800 text-center py-10">Nenhuma avaliação ainda.</p>
            ) : (
              avaliacoes.map((av) => {
                const isMeuComentario = av.nomeUsuario === nomeUsuarioLogado;
                return (
                  <div key={av.id} className={`bg-[#111111] rounded-2xl p-6 border ${isMeuComentario ? 'border-gray-600' : 'border-gray-800'}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center font-bold text-red-500 text-lg">{av.nomeUsuario.charAt(0).toUpperCase()}</div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white font-bold text-base">{av.nomeUsuario} {isMeuComentario && <span className="text-xs text-gray-500 font-normal ml-2">(Você)</span>}</p>
                          <div className="flex items-center text-yellow-500 text-sm font-bold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20"><Star className="w-3.5 h-3.5 fill-current mr-1" /> {av.nota.toFixed(1)}</div>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{av.comentarioSocial}</p>
                        {isMeuComentario && (
                          <div className="flex justify-end gap-5 mt-5 pt-4 border-t border-gray-800">
                            <button onClick={() => abrirModalEdicao(av)} className="text-gray-400 hover:text-white text-xs font-semibold uppercase transition-colors">Editar</button>
                            <button onClick={() => { setAvaliacaoParaDeletar(av.id); setShowDeleteModal(true); }} className="text-red-500/80 hover:text-red-500 text-xs font-semibold uppercase transition-colors">Remover</button>
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
    </>
  );
}