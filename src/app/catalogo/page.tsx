"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { api } from "@/services/api";
import { Filme, Serie } from "@/types/conteudo";
import PageWrapper from "@/components/PageWrapper";
import CardConteudo from "@/components/shared/CardConteudo";
import BannerDestaque from "@/components/shared/BannerDestaque";
import CarrosselSecao from "@/components/shared/CarrosselSecao";
import { Play, X, StepForward, Film, Clapperboard, Loader2 } from "lucide-react";

interface Historico { id: number; conteudoId: number; conteudoTitulo: string; capaUrlMinio: string; tempoAssistidoSegundos: number; }

const fetcher = (url: string) => api.get(url).then(res => {
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.content)) return res.data.content;
  return [];
});

export default function CatalogoPage() {
  const router = useRouter();

  const { data: filmesData, isLoading: loadFilmes } = useSWR<Filme[]>("/filmes", fetcher);
  const { data: seriesData, isLoading: loadSeries } = useSWR<Serie[]>("/series", fetcher);
  const { data: historicoData, mutate: mutateHistorico } = useSWR<Historico[]>("/historico/meu-historico", fetcher);

  // === TELA DE LOADING CENTRALIZADA ===
  if (loadFilmes || loadSeries) {
    return (
      <PageWrapper hasNavbar={true}>
        <div className="flex flex-col items-center justify-center flex-grow min-h-[80vh]">
          <Loader2 className="w-16 h-16 text-red-600 animate-spin mb-4" />
          <p className="text-gray-400 text-lg font-medium">Carregando catálogo...</p>
        </div>
      </PageWrapper>
    );
  }

  const filmesSeguros = Array.isArray(filmesData) ? filmesData : [];
  const seriesSeguras = Array.isArray(seriesData) ? seriesData : [];
  const historicoSeguro = Array.isArray(historicoData) ? historicoData : [];

  const filmes = filmesSeguros.filter((v, i, a) => a.findIndex(t => t.titulo === v.titulo) === i).sort((a, b) => a.titulo.localeCompare(b.titulo));
  const series = seriesSeguras.filter((v, i, a) => a.findIndex(t => t.titulo === v.titulo) === i).sort((a, b) => a.titulo.localeCompare(b.titulo));
  const historico = historicoSeguro.filter((v, i, a) => a.findIndex(t => t.conteudoTitulo === v.conteudoTitulo) === i);

  const handleRemoverHistorico = async (idHistorico: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/historico/${idHistorico}`);
      mutateHistorico(historico.filter(h => h.id !== idHistorico), false);
    } catch (error) { console.error("Erro ao remover", error); }
  };

  const getUrlImagem = (nome: string) => nome ? `${process.env.NEXT_PUBLIC_R2_URL}/${nome}` : "https://via.placeholder.com/300x450?text=Sem+Capa";
  const destaque = filmes.length > 0 ? filmes[0] : null;

  return (
    <PageWrapper hasNavbar={true}>
      {destaque && <BannerDestaque destaque={destaque} />}

      <div className="relative z-20 pb-20 -mt-20 flex flex-col gap-4">
        {historico.length > 0 && (
          <CarrosselSecao titulo="Continuar Assistindo" icone={<StepForward className="w-7 h-7 text-red-600" />}>
            {historico.map((hist) => (
              <div key={hist.id} onClick={() => router.push(`/conteudo/${hist.conteudoId}`)} className="min-w-[240px] w-[240px] flex-none cursor-pointer group relative transition-transform duration-300 hover:scale-105">
                <div className="relative h-[140px] rounded-md overflow-hidden border border-gray-800 bg-[#222] shadow-lg">
                  <img src={getUrlImagem(hist.capaUrlMinio)} alt={hist.conteudoTitulo} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                    <Play className="w-12 h-12 text-white border-2 border-white rounded-full p-2 bg-black/50 hover:bg-red-600 transition" />
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-600">
                    <div className="h-full bg-red-600" style={{ width: `${Math.min((hist.tempoAssistidoSegundos / 3600) * 100, 100)}%` }}></div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 px-1">
                  <p className="text-sm font-semibold truncate text-white">{hist.conteudoTitulo}</p>
                  <button onClick={(e) => handleRemoverHistorico(hist.id, e)} className="text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Remover do histórico">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </CarrosselSecao>
        )}

        {filmes.length > 0 && (
          <CarrosselSecao titulo="Filmes" icone={<Film className="w-7 h-7 text-red-600" />}>
            {filmes.map((filme) => (
              <CardConteudo key={filme.id} id={filme.id} titulo={filme.titulo} capaUrlMinio={filme.capaUrlMinio} planoMinimo={filme.planoMinimo} mostrarDetalhes={false} className="min-w-[200px] w-[200px]" />
            ))}
          </CarrosselSecao>
        )}

        {series.length > 0 && (
          <CarrosselSecao titulo="Séries" icone={<Clapperboard className="w-7 h-7 text-red-600" />}>
            {series.map((serie) => (
              <CardConteudo key={serie.id} id={serie.id} titulo={serie.titulo} capaUrlMinio={serie.capaUrlMinio} planoMinimo={serie.planoMinimo} mostrarDetalhes={false} className="min-w-[200px] w-[200px]" />
            ))}
          </CarrosselSecao>
        )}
      </div>
    </PageWrapper>
  );
}