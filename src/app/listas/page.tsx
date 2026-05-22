"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { ListaDesejo } from "@/types/conteudo";
import PageWrapper from "@/components/PageWrapper";
import CardConteudo from "@/components/shared/CardConteudo";
import { Trash2, X, Plus, Pencil, ListVideo } from "lucide-react"; 
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ListasPage() {
  const [listas, setListas] = useState<ListaDesejo[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Estados dos Modais de Criação/Edição
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [listaSelecionadaId, setListaSelecionadaId] = useState<number | null>(null);
  const [nomeForm, setNomeForm] = useState("");
  const [processando, setProcessando] = useState(false);

  // Estados do Modal de Exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listaParaDeletar, setListaParaDeletar] = useState<{ id: number; nome: string } | null>(null);

  const buscarListas = async () => {
    try {
      const resp = await api.get<ListaDesejo[]>("/listas/minhas");
      setListas(resp.data);
    } catch (error) { console.error("Erro ao buscar listas", error); }
    finally { setCarregando(false); }
  };

  useEffect(() => { buscarListas(); }, []);

  // ====== AÇÕES DOS MODAIS CRIAR/EDITAR ======

  const abrirModalCriar = () => {
    setIsEditMode(false);
    setNomeForm("");
    setShowModal(true);
  };

  const abrirModalEditar = (id: number, nomeAtual: string) => {
    setIsEditMode(true);
    setListaSelecionadaId(id);
    setNomeForm(nomeAtual);
    setShowModal(true);
  };

  const handleSalvarModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeForm.trim()) return;
    setProcessando(true);

    try {
      if (isEditMode && listaSelecionadaId) {
        const resp = await api.put(`/listas/${listaSelecionadaId}`, { nome: nomeForm });
        setListas(listas.map(l => l.id === listaSelecionadaId ? resp.data : l));
        toast.success("Lista renomeada com sucesso!");
      } else {
        const resp = await api.post("/listas", { nome: nomeForm });
        setListas([...listas, resp.data]);
        toast.success("Nova lista criada!");
      }
      setShowModal(false);
    } catch (error) {
      toast.error("Erro ao processar requisição.");
    } finally {
      setProcessando(false);
    }
  };

  // ====== AÇÕES DE EXCLUSÃO ======

  const abrirModalDeletar = (idLista: number, nomeLista: string) => {
    setListaParaDeletar({ id: idLista, nome: nomeLista });
    setShowDeleteModal(true);
  };

  const handleConfirmarDeletarLista = async () => {
    if (!listaParaDeletar) return;
    setProcessando(true);
    try {
      await api.delete(`/listas/${listaParaDeletar.id}`);
      setListas(listas.filter(l => l.id !== listaParaDeletar.id));
      toast.success("Lista removida!");
      setShowDeleteModal(false);
    } catch (error) { 
      toast.error("Erro ao remover lista."); 
    } finally {
      setProcessando(false);
    }
  };

  const handleRemoverConteudo = async (idLista: number, idConteudo: number) => {
    try {
      const resp = await api.delete(`/listas/${idLista}/remover/${idConteudo}`);
      setListas(listas.map(l => l.id === idLista ? resp.data : l));
      toast.success("Conteúdo removido da lista.");
    } catch (error) {
      toast.error("Erro ao remover conteúdo.");
    }
  };

  return (
    <>
      <AnimatePresence>
        {/* MODAL DE CRIAR / EDITAR LISTA */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-[#111111] border border-gray-800 p-8 rounded-2xl max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                {isEditMode ? "Renomear Lista" : "Criar Nova Lista"}
              </h2>
              
              <form onSubmit={handleSalvarModal}>
                <input required autoFocus value={nomeForm} onChange={(e) => setNomeForm(e.target.value)} placeholder="Nome da lista"
                  className="w-full bg-[#141414] text-white p-4 rounded-md border border-gray-700 focus:border-red-600 focus:outline-none mb-8 placeholder-gray-600"
                />
                <div className="flex gap-4 w-full">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-md font-semibold text-gray-300 bg-transparent border border-gray-700 hover:bg-gray-800 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={processando} className="flex-1 py-3 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50">
                    {processando ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL DE CONFIRMAR EXCLUSÃO DE LISTA */}
        {showDeleteModal && listaParaDeletar && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-[#111111] border border-gray-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-900/20 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Excluir Lista</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Tem certeza que deseja apagar a lista <strong className="text-white">"{listaParaDeletar.nome}"</strong> inteira? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-4 w-full">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-md font-semibold text-gray-300 bg-transparent border border-gray-700 hover:bg-gray-800 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleConfirmarDeletarLista} disabled={processando} className="flex-1 py-3 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-[0_0_15px_rgba(220,38,38,0.4)] disabled:opacity-50">
                  {processando ? "Excluindo..." : "Sim, Excluir"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PageWrapper hasNavbar={true}>
        <div className="w-full min-h-screen pt-24 px-6 md:px-12 pb-20">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Minhas Listas</h2>
            <button 
              onClick={abrirModalCriar}
              className="bg-white text-black hover:bg-gray-300 font-bold px-6 py-2 rounded-md flex items-center justify-center gap-2 transition-colors w-fit"
            >
              <Plus className="w-5 h-5" /> Nova Lista
            </button>
          </div>

          {carregando ? (
            <p className="text-gray-400">Carregando listas...</p>
          ) : listas.length === 0 ? (
            
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-red-600/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <ListVideo className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Sua coleção está vazia</h3>
              <p className="text-gray-400 text-center max-w-md mb-6">
                Você pode criar uma lista vazia agora ou adicionar filmes diretamente pelo catálogo!
              </p>
              <button onClick={abrirModalCriar} className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-md transition-colors">
                Criar Minha Primeira Lista
              </button>
            </div>

          ) : (
            <div className="flex flex-col gap-12">
              {listas.map((lista) => (
                <div key={lista.id} className="bg-[#111111] p-6 rounded-xl border border-gray-800 shadow-xl">
                  
                  {/* Cabeçalho da Lista */}
                  <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-red-600">{lista.nome}</h3>
                      <span className="text-sm font-normal text-gray-500">({lista.conteudos.length} itens)</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button onClick={() => abrirModalEditar(lista.id, lista.nome)} className="text-gray-500 hover:text-white transition-colors p-2" title="Editar nome da lista">
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button onClick={() => abrirModalDeletar(lista.id, lista.nome)} className="text-gray-500 hover:text-red-500 transition-colors p-2" title="Excluir lista inteira">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Conteúdos da Lista */}
                  {lista.conteudos.length === 0 ? (
                    <div className="py-8 px-4 text-center border border-dashed border-gray-800 rounded-lg">
                      <p className="text-gray-500">Esta lista está vazia no momento.</p>
                    </div>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                      {lista.conteudos.map((conteudo) => (
                        <div key={conteudo.id} className="flex flex-col group min-w-[160px] w-[160px] md:min-w-[200px] md:w-[200px]">
                          
                          {/* Capa do Filme (Sem o texto default do componente) */}
                          <CardConteudo 
                            id={conteudo.id} 
                            titulo={conteudo.titulo} 
                            capaUrlMinio={conteudo.capaUrlMinio} 
                            planoMinimo={conteudo.planoMinimo} 
                            mostrarDetalhes={false}
                            className="w-full mb-2"
                          />
                          
                          {/* Rodapé: Título e botão X estilo Netflix */}
                          <div className="flex justify-between items-center px-1 mt-1">
                            <p className="text-sm font-semibold truncate text-white">{conteudo.titulo}</p>
                            <button 
                              onClick={() => handleRemoverConteudo(lista.id, conteudo.id)}
                              className="text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              title="Remover da lista"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </>
  );
}