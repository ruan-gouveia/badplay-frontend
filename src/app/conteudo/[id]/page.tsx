"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Filme, Serie, Episodio } from "@/types/conteudo";
import PageWrapper from "@/components/PageWrapper";
import CustomModal from "@/components/shared/CustomModal";
import LoadingButton from "@/components/shared/LoadingButton";
import SecaoAvaliacoes from "@/components/conteudo/SecaoAvaliacoes";
import BotaoMinhaLista from "@/components/conteudo/BotaoMinhaLista";
import { Lock, Play, Clock, ChevronDown } from "lucide-react";

function isSerie(conteudo: Filme | Serie): conteudo is Serie {
  return "temporadas" in conteudo;
}

export default function ConteudoDetalhesPage() {
  const { id } = useParams();
  const router = useRouter();

  const [conteudo, setConteudo] = useState<Filme | Serie | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [temporadaAberta, setTemporadaAberta] = useState<number>(0);
  const [episodioAtivo, setEpisodioAtivo] = useState<Episodio | null>(null);

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
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (carregando) return (
    <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center">
      Carregando conteúdo...
    </div>
  );
  if (!conteudo) return (
    <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center">
      Conteúdo não encontrado.
    </div>
  );

  const planoMinimoReal = conteudo.planoMinimo || "BASICO";
  const ehSerie = isSerie(conteudo);

  // Trailer ativo: episódio selecionado → trailer do ep; senão → trailer da série (ou filme)
  const trailerEpisodio = episodioAtivo?.trailerUrlYoutube ?? null;
  const trailerSerie = ehSerie ? (conteudo as Serie).trailerUrlYoutube ?? null : null;
  const trailerFilme = !ehSerie ? (conteudo as Filme).trailerUrlYoutube : null;
  const urlTrailerAtivo = trailerEpisodio || trailerSerie || trailerFilme;

  const ytId = getYouTubeId(urlTrailerAtivo ?? "");

  // Título do player
  const tituloPlayer = episodioAtivo
    ? `${conteudo.titulo} — ${episodioAtivo.nome}`
    : conteudo.titulo;

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

      {/* Player */}
      <div className="relative w-full h-[60vh] md:h-[80vh] bg-black pt-20">
        {ytId && !showUpgradeModal ? (
          <iframe
            key={ytId}
            className="w-full h-full border-none"
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=0&controls=1&modestbranding=1`}
            title={tituloPlayer}
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900/20">
            <span className="text-4xl mb-2">🎬</span>
            <p>Trailer não disponível.</p>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 w-full pb-20">

        {/* Informações gerais */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-gray-800 pb-10">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{conteudo.titulo}</h1>
            <div className="flex items-center gap-4 text-gray-300 font-medium mb-6">
              <span className="text-green-500 font-bold">98% Relevante</span>
              <span>{conteudo.anoLancamento}</span>
              <span className="border border-gray-500 px-2 py-0.5 rounded text-xs font-bold">
                Plano {planoMinimoReal}
              </span>
              {ehSerie && (
                <span className="text-gray-400 text-sm">
                  {(conteudo as Serie).temporadas?.length ?? 0} temporada(s)
                </span>
              )}
            </div>
            <p className="text-lg text-gray-200 max-w-3xl leading-relaxed">{conteudo.descricao}</p>
          </div>

          <div className="flex-shrink-0 mt-4 md:mt-0 md:pt-4">
            <BotaoMinhaLista conteudoId={id as string} />
          </div>
        </div>

        {/* Temporadas e episódios */}
        {ehSerie && (
          <div className="mt-10 mb-10 border-b border-gray-800 pb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Episódios</h2>
              {episodioAtivo && (
                <button
                  onClick={() => setEpisodioAtivo(null)}
                  className="text-sm text-gray-500 hover:text-white transition"
                >
                  ← Voltar ao trailer da série
                </button>
              )}
            </div>

            {(conteudo as Serie).temporadas?.length > 0 ? (
              <div className="flex flex-col gap-4">
                {(conteudo as Serie).temporadas
                  .slice()
                  .sort((a, b) => a.numeroTemporada - b.numeroTemporada)
                  .map((temporada, idx) => (
                    <div key={temporada.id} className="rounded-xl border border-gray-800 overflow-hidden">

                      <button
                        onClick={() => setTemporadaAberta(temporadaAberta === idx ? -1 : idx)}
                        className="w-full flex items-center justify-between px-6 py-4 bg-[#1a1a1a] hover:bg-[#222] transition-colors text-left"
                      >
                        <span className="text-white font-bold text-lg">
                          Temporada {temporada.numeroTemporada}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 text-sm">
                            {temporada.episodios?.length ?? 0} episódio(s)
                          </span>
                          <ChevronDown
                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${temporadaAberta === idx ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>

                      {temporadaAberta === idx && (
                        <div className="divide-y divide-gray-800/60">
                          {temporada.episodios?.length > 0 ? (
                            temporada.episodios
                              .slice()
                              .sort((a, b) => a.numeroEpisodio - b.numeroEpisodio)
                              .map((ep) => {
                                const ativo = episodioAtivo?.id === ep.id;
                                return (
                                  <div
                                    key={ep.id}
                                    onClick={() => {
                                      setEpisodioAtivo(ativo ? null : ep);
                                      window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    className={`flex items-center gap-5 px-6 py-4 cursor-pointer transition-colors group ${
                                      ativo ? "bg-red-600/10 border-l-4 border-red-600" : "hover:bg-[#1f1f1f]"
                                    }`}
                                  >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm transition-colors ${
                                      ativo ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 group-hover:bg-gray-700"
                                    }`}>
                                      {ativo ? <Play className="w-4 h-4" /> : ep.numeroEpisodio}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <p className={`font-semibold truncate ${ativo ? "text-red-400" : "text-white"}`}>
                                        {ep.nome}
                                      </p>
                                      {ep.duracaoMinutos > 0 && (
                                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
                                          <Clock className="w-3.5 h-3.5" />
                                          {ep.duracaoMinutos} min
                                        </p>
                                      )}
                                    </div>

                                    {ep.trailerUrlYoutube && (
                                      <span className="text-xs text-gray-500 group-hover:text-red-400 transition-colors flex-shrink-0">
                                        {ativo ? "Assistindo trailer" : "Ver trailer"}
                                      </span>
                                    )}
                                  </div>
                                );
                              })
                          ) : (
                            <p className="px-6 py-4 text-gray-500 text-sm">
                              Nenhum episódio cadastrado nesta temporada.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhuma temporada cadastrada para esta série.</p>
            )}
          </div>
        )}

        <SecaoAvaliacoes conteudoId={id as string} />
      </div>
    </PageWrapper>
  );
}