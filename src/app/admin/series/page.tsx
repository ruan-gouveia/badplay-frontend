"use client";

import { useState } from "react";
import useSWR from "swr";
import { api } from "@/services/api";
import { Serie, Genero } from "@/types/conteudo";
import { Plus, Trash2, ListVideo } from "lucide-react";
import LoadingButton from "@/components/shared/LoadingButton";
import CustomModal from "@/components/shared/CustomModal";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import ModalImportarSerie from "@/components/admin/ModalImportarSerie";
import ModalTemporadas from "@/components/admin/ModalTemporadas";

const fetcher = (url: string) => api.get(url).then(res => {
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.content)) return res.data.content;
  return [];
});

export default function AdminSeriesPage() {
  const { data: seriesData, isLoading: carregando, mutate: mutateSeries } = useSWR<Serie[]>("/series", fetcher);
  const { data: generosLocaisCache } = useSWR<Genero[]>("/generos", fetcher);

  const series = seriesData ? [...seriesData].sort((a, b) => b.id - a.id) : [];
  const generosLocais = generosLocaisCache || [];

  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idParaDeletar, setIdParaDeletar] = useState<number | null>(null);
  
  const [showTempModal, setShowTempModal] = useState(false);
  const [serieEditando, setSerieEditando] = useState<Serie | null>(null);

  const confirmarDeletar = async () => {
    if (!idParaDeletar) return;
    try {
      await api.delete(`/series/${idParaDeletar}`);
      mutateSeries(series.filter(s => s.id !== idParaDeletar), false);
      toast.success("Série removida!");
      setShowDeleteModal(false);
    } catch (error) { toast.error("Erro ao deletar."); }
  };

  const handleChangePlano = async (serie: Serie, novoPlano: string) => {
    try {
      const dadosSerie = {
        titulo: serie.titulo, descricao: serie.descricao, anoLancamento: serie.anoLancamento,
        planoMinimo: novoPlano, generosIds: serie.generos.map(g => g.id),
        temporadas: (serie.temporadas || []).map(t => ({
          numeroTemporada: t.numeroTemporada,
          episodios: (t.episodios || []).map(e => ({ nome: e.nome, numeroEpisodio: e.numeroEpisodio, duracaoMinutos: e.duracaoMinutos, trailerUrlYoutube: e.trailerUrlYoutube }))
        }))
      };
      const formData = new FormData();
      formData.append("dados", new Blob([JSON.stringify(dadosSerie)], { type: "application/json" }));
      const resp = await api.put(`/series/${serie.id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      mutateSeries(series.map(s => s.id === serie.id ? resp.data : s), false);
      toast.success(`Plano atualizado!`);
    } catch (error) { toast.error("Erro ao alterar o plano."); }
  };

  return (
    <>
      <ModalImportarSerie 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        onSuccess={(nova) => mutateSeries([nova, ...series], false)} 
        generosLocais={generosLocais} 
      />

      <ModalTemporadas 
        isOpen={showTempModal} 
        onClose={() => setShowTempModal(false)} 
        serie={serieEditando} 
        onSuccess={(atualizada) => mutateSeries(series.map(s => s.id === atualizada.id ? atualizada : s), false)}
      />

      <CustomModal isOpen={showDeleteModal} title="Excluir Série" icon={<Trash2 className="w-8 h-8" />} centerTitle>
        <p className="text-gray-400 mb-8 text-center">Deletar esta série excluirá as temporadas e o histórico dos usuários.</p>
        <div className="flex gap-4"><LoadingButton variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</LoadingButton><LoadingButton onClick={confirmarDeletar}>Sim, Excluir</LoadingButton></div>
      </CustomModal>

      <div>
        <div className="flex justify-between items-center mb-8">
          <div><h2 className="text-3xl font-bold text-white">Gerenciar Séries</h2></div>
          <LoadingButton onClick={() => setShowImportModal(true)} className="!w-auto px-6"><Plus className="w-5 h-5 mr-2" /> Adicionar Série (TMDb)</LoadingButton>
        </div>

        {carregando ? <p className="text-gray-500">Carregando...</p> : (
          <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden shadow-2xl pb-1">
            <Table>
              <TableHeader className="bg-[#1a1a1a]">
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="w-[80px] text-gray-400">ID</TableHead>
                  <TableHead className="text-gray-400">Título</TableHead>
                  <TableHead className="text-gray-400">Temporadas</TableHead>
                  <TableHead className="text-gray-400">Plano Mínimo</TableHead>
                  <TableHead className="text-right text-gray-400">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {series.map((serie) => (
                  <TableRow key={serie.id} className="border-gray-800 hover:bg-gray-900/50">
                    <TableCell className="text-gray-500">#{serie.id}</TableCell>
                    <TableCell className="text-white font-bold">{serie.titulo}</TableCell>
                    <TableCell className="text-gray-400">{(serie.temporadas || []).length} temp.</TableCell>
                    <TableCell>
                      <div className="relative inline-block">
                        <select value={serie.planoMinimo || "BASICO"} onChange={(e) => handleChangePlano(serie, e.target.value)} className={`appearance-none cursor-pointer pr-6 pl-2 py-1 rounded text-[10px] font-extrabold focus:outline-none focus:ring-1 focus:ring-red-600 transition-colors ${serie.planoMinimo === 'PREMIUM' ? 'bg-yellow-500 text-black' : serie.planoMinimo === 'PADRAO' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}>
                          <option value="BASICO" className="bg-[#141414] text-gray-300 font-bold">BÁSICO</option><option value="PADRAO" className="bg-[#141414] text-gray-300 font-bold">PADRÃO</option><option value="PREMIUM" className="bg-[#141414] text-gray-300 font-bold">PREMIUM</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center px-1"><svg className={`fill-current h-3 w-3 ${serie.planoMinimo === 'PREMIUM' ? 'text-black' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-3">
                      <button onClick={() => { setSerieEditando(serie); setShowTempModal(true); }} className="text-gray-500 hover:text-blue-500 p-2 transition" title="Gerenciar Temporadas"><ListVideo className="w-5 h-5" /></button>
                      <button onClick={() => { setIdParaDeletar(serie.id); setShowDeleteModal(true); }} className="text-gray-500 hover:text-red-500 p-2 transition"><Trash2 className="w-5 h-5" /></button>
                    </TableCell>
                  </TableRow>
                ))}
                {series.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-500">Nenhuma série cadastrada no banco.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}