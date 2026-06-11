"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ConteudoTipo } from "@/types/conteudo";

interface CardConteudoProps {
  id: number;
  titulo: string;
  capaUrlMinio: string;
  planoMinimo?: string;
  anoLancamento?: number;
  tipo?: ConteudoTipo;
  className?: string;
  mostrarDetalhes?: boolean;
}

export default function CardConteudo({
  id,
  titulo,
  capaUrlMinio,
  planoMinimo = "BASICO",
  anoLancamento,
  tipo,
  className = "",
  mostrarDetalhes = true,
}: CardConteudoProps) {
  const router = useRouter();

  const getUrlImagem = (nome: string) =>
    nome
      ? `${process.env.NEXT_PUBLIC_R2_URL}/${nome}`
      : "https://via.placeholder.com/300x450?text=Sem+Capa";

  const abrirConteudo = () => {
    const tipoParam = tipo ? `?tipo=${tipo}` : "";
    router.push(`/conteudo/${id}${tipoParam}`);
  };

  return (
    <div
      onClick={abrirConteudo}
      className={`flex flex-col cursor-pointer group flex-none transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md mb-2 shadow-lg border border-gray-800 bg-[#222]">
        {planoMinimo === "PREMIUM" && (
          <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600 text-black text-[10px] font-extrabold px-2 py-0.5 z-10 border-none shadow-lg">
            PREMIUM
          </Badge>
        )}

        {planoMinimo === "PADRAO" && (
          <Badge className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold px-2 py-0.5 z-10 border-none shadow-lg">
            PADRÃO
          </Badge>
        )}

        <img
          src={getUrlImagem(capaUrlMinio)}
          alt={titulo}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {mostrarDetalhes && (
        <div className="mt-1 px-1">
          <h3 className="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition">
            {titulo}
          </h3>

          {anoLancamento ? (
            <p className="text-xs text-gray-500">{anoLancamento}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}