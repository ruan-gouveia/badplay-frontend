"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { ListaDesejo } from "@/types/conteudo";
import CustomModal from "@/components/shared/CustomModal";
import LoadingButton from "@/components/shared/LoadingButton";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function BotaoMinhaLista({ conteudoId }: { conteudoId: string }) {
  const [showListaModal, setShowListaModal] = useState(false);
  const [minhasListas, setMinhasListas] = useState<ListaDesejo[]>([]);
  const [novaListaNome, setNovaListaNome] = useState("");
  const [salvando, setSalvando] = useState(false);

  const abrirModalLista = async () => {
    setShowListaModal(true);
    try {
      const resp = await api.get<ListaDesejo[]>("/listas/minhas");
      setMinhasListas(resp.data);
    } catch (error) { console.error(error); }
  };

  const handleAdicionar = async (listaId: number) => {
    try {
      await api.put(`/listas/${listaId}/adicionar/${conteudoId}`);
      toast.success("Adicionado à lista com sucesso!");
      setShowListaModal(false);
    } catch (error) { toast.error("Erro ao adicionar na lista."); }
  };

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaListaNome.trim()) return;
    setSalvando(true);
    try {
      const resp = await api.post("/listas", { nome: novaListaNome });
      await api.put(`/listas/${resp.data.id}/adicionar/${conteudoId}`);
      toast.success("Lista criada e conteúdo adicionado!");
      setShowListaModal(false);
      setNovaListaNome("");
    } catch (error) { toast.error("Erro ao criar lista."); }
    finally { setSalvando(false); }
  };

  return (
    <>
      <CustomModal isOpen={showListaModal} title="Salvar em...">
        <div className="flex flex-col gap-3 mb-6 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
          {minhasListas.length === 0 ? (
            <p className="text-gray-500 text-sm">Você ainda não tem listas criadas.</p>
          ) : (
            minhasListas.map(lista => (
              <button key={lista.id} onClick={() => handleAdicionar(lista.id)} className="w-full text-left p-4 rounded-lg bg-[#222] hover:bg-red-600/20 border border-gray-700 hover:border-red-500 transition-colors">
                <p className="text-white font-semibold">{lista.nome}</p>
                <p className="text-xs text-gray-500">{lista.conteudos.length} itens</p>
              </button>
            ))
          )}
        </div>
        <div className="border-t border-gray-800 pt-6">
          <form onSubmit={handleCriar} className="flex gap-2">
            <input type="text" placeholder="Nome da nova lista" value={novaListaNome} onChange={(e) => setNovaListaNome(e.target.value)} required className="flex-grow bg-[#141414] text-white p-3 rounded-md border border-gray-700 focus:border-red-600 focus:outline-none text-sm" />
            <LoadingButton type="submit" isLoading={salvando} textLoading="..." className="!w-auto px-6 py-2">Criar</LoadingButton>
          </form>
        </div>
        <div className="mt-4">
          <LoadingButton type="button" variant="secondary" onClick={() => setShowListaModal(false)}>Fechar</LoadingButton>
        </div>
      </CustomModal>

      <button onClick={abrirModalLista} className="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition group">
        <div className="w-14 h-14 rounded-full border-2 border-gray-600 group-hover:border-white flex items-center justify-center bg-[#111] group-hover:bg-gray-800 transition">
          <Plus className="w-7 h-7" />
        </div>
        <span className="text-sm font-semibold uppercase tracking-wider">Minha Lista</span>
      </button>
    </>
  );
}