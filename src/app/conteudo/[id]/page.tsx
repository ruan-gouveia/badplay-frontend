"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Filme, Serie } from "@/types/conteudo";
import PageWrapper from "@/components/PageWrapper";
import CustomModal from "@/components/shared/CustomModal";
import LoadingButton from "@/components/shared/LoadingButton";
import SecaoAvaliacoes from "@/components/conteudo/SecaoAvaliacoes"; // Componente Isolado!
import BotaoMinhaLista from "@/components/conteudo/BotaoMinhaLista"; // Componente Isolado!
import { Lock } from "lucide-react";

export default function ConteudoDetalhesPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [conteudo, setConteudo] = useState<Filme | Serie | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
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
        await api.post("/historico", { conteudoId: Number(id), tempoAssistidoSegundos: 0 });
      } catch (error: any) {
        if (error.response?.status === 400 && error.response?.data?.erro?.includes("Acesso Negado")) {
          setShowUpgradeModal(true);
        }
      } finally {
        setCarregando(false);
      }
    };
    if (id) buscarDetalhes();
  }, [id, router]);

  const getYouTubeId = (url: string) => {
    const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (carregando) return <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center">Carregando conteúdo...</div>;
  if (!conteudo) return <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center">Conteúdo não encontrado.</div>;

  const ytId = getYouTubeId(conteudo.trailerUrlYoutube);
  const planoMinimoReal = conteudo.planoMinimo || "BASICO";

  return (
    <PageWrapper hasNavbar={true} className="p-0">
      
      <CustomModal isOpen={showUpgradeModal} title="Acesso Restrito" icon={<Lock className="w-8 h-8" />} centerTitle>
        <p className="text-gray-400 mb-8 leading-relaxed text-center">
          Conteúdo exclusivo para assinantes <strong className="text-white">{planoMinimoReal}</strong>.
        </p>
        <div className="flex gap-4 w-full">
          <LoadingButton variant="secondary" onClick={() => { setShowUpgradeModal(false); router.push("/catalogo"); }}>Voltar</LoadingButton>
          <LoadingButton onClick={() => router.push("/planos")}>Fazer Upgrade</LoadingButton>
        </div>
      </CustomModal>

      <div className="relative w-full h-[60vh] md:h-[80vh] bg-black pt-20">
        {ytId && !showUpgradeModal ? (
          <iframe className="w-full h-full border-none" src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=0&controls=1&modestbranding=1`} allowFullScreen></iframe>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900/20"><span className="text-4xl mb-2">🎬</span><p>Trailer bloqueado ou não disponível.</p></div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 w-full pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-gray-800 pb-10">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{conteudo.titulo}</h1>
            <div className="flex items-center gap-4 text-gray-300 font-medium mb-6">
              <span className="text-green-500 font-bold">98% Relevante</span>
              <span>{conteudo.anoLancamento}</span>
              <span className="border border-gray-500 px-2 py-0.5 rounded text-xs font-bold">Plano {planoMinimoReal}</span>
            </div>
            <p className="text-lg text-gray-200 max-w-3xl leading-relaxed">{conteudo.descricao}</p>
          </div>

          <div className="flex-shrink-0 mt-4 md:mt-0 md:pt-4">
            <BotaoMinhaLista conteudoId={id as string} />
          </div>
        </div>

        <SecaoAvaliacoes conteudoId={id as string} />
      </div>
    </PageWrapper>
  );
}