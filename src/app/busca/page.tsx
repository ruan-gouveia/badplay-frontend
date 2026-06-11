"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import PageWrapper from "@/components/PageWrapper";
import CardConteudo from "@/components/shared/CardConteudo";

interface ConteudoBusca {
  id: number;
  titulo: string;
  descricao?: string;
  anoLancamento?: number;
  capaUrlMinio: string;
  planoMinimo: string;
  tipo: "FILME" | "SERIE" | "CONTEUDO";
}

function BuscaContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [resultados, setResultados] = useState<ConteudoBusca[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const realizarBusca = async () => {
      const termo = query.trim();

      if (termo.length < 2) {
        setResultados([]);
        setCarregando(false);
        return;
      }

      setCarregando(true);

      try {
        const resp = await api.get<ConteudoBusca[]>("/conteudos/buscar", {
          params: {
            q: termo,
            limite: 30,
          },
          signal: controller.signal,
        });

        setResultados(resp.data);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Erro na busca", error);
          setResultados([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      }
    };

    realizarBusca();

    return () => controller.abort();
  }, [query]);

  return (
    <div className="w-full min-h-screen pt-24 px-6 md:px-12">
      <h2 className="text-2xl font-bold text-gray-400 mb-8">
        Resultados para: <span className="text-white">&quot;{query}&quot;</span>
      </h2>

      {carregando ? (
        <p className="text-gray-500">Buscando...</p>
      ) : resultados.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-8 pb-20">
          {resultados.map((item) => (
            <CardConteudo
              key={`${item.tipo}-${item.id}`}
              id={item.id}
              titulo={item.titulo}
              capaUrlMinio={item.capaUrlMinio}
              planoMinimo={item.planoMinimo}
              anoLancamento={item.anoLancamento}
              mostrarDetalhes={true}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">
          Nenhum conteúdo encontrado para esta busca.
        </p>
      )}
    </div>
  );
}

export default function BuscaPage() {
  return (
    <PageWrapper hasNavbar={true}>
      <Suspense fallback={<div className="text-white mt-32">Carregando...</div>}>
        <BuscaContent />
      </Suspense>
    </PageWrapper>
  );
}