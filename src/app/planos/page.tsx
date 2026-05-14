"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageWrapper from "@/components/PageWrapper";

const PLANOS_DISPONIVEIS = [
  { id: 1, nome: "Básico", preco: "R$ 19,90/mês", resolucao: "Boa (720p)", vantagens: ["Acesso a conteúdos básicos", "Assista em 1 tela por vez"] },
  { id: 2, nome: "Padrão", preco: "R$ 34,90/mês", resolucao: "Ótima (1080p)", vantagens: ["Acesso a conteúdos Padrão e Básico", "Assista em 2 telas simultâneas"] },
  { id: 3, nome: "Premium", preco: "R$ 55,90/mês", resolucao: "Perfeita (4K + HDR)", vantagens: ["Acesso a TODO o catálogo VIP", "Assista em 4 telas simultâneas", "Áudio espacial"] },
];

export default function PlanosPage() {
  const router = useRouter();
  const [planoSelecionado, setPlanoSelecionado] = useState<number | null>(null);

  const handleProximo = () => {
    if (planoSelecionado) {
      router.push(`/pagamento?planoId=${planoSelecionado}`);
    }
  };

  return (
    <PageWrapper>
      <div className="w-full max-w-5xl flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center">
          Escolha o plano ideal para você
        </h1>
        <p className="text-gray-400 mb-10 text-center">Sem compromisso, cancele quando quiser.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10">
          {PLANOS_DISPONIVEIS.map((plano) => {
            const isSelecionado = planoSelecionado === plano.id;
            return (
              <div key={plano.id} onClick={() => setPlanoSelecionado(plano.id)}
                className={`cursor-pointer rounded-xl p-6 transition-all duration-300 flex flex-col h-full border-2 bg-black/80 backdrop-blur-sm
                  ${isSelecionado ? "border-red-600 bg-red-950/40 scale-105 shadow-[0_0_20px_rgba(220,38,38,0.3)]" : "border-gray-800 hover:border-gray-500"}
                `}
              >
                <h2 className="text-2xl font-bold text-white mb-2">{plano.nome}</h2>
                <p className="text-xl text-red-500 font-semibold mb-6">{plano.preco}</p>
                <div className="flex-grow">
                  <p className="text-sm text-gray-400 mb-1">Qualidade de vídeo</p>
                  <p className="text-white font-medium mb-4">{plano.resolucao}</p>
                  <ul className="flex flex-col gap-3">
                    {plano.vantagens.map((vantagem, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-300">
                        <span className="text-red-500 mr-2">✓</span>{vantagem}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={handleProximo} disabled={!planoSelecionado}
          className="w-full md:w-1/3 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Próximo
        </button>
      </div>
    </PageWrapper>
  );
}