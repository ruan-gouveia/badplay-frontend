"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface DestaqueProps {
  id: number;
  titulo: string;
  descricao: string;
  capaUrlMinio: string;
  anoLancamento: number;
  planoMinimo: string;
  duracaoMinutos?: number;
}

export default function BannerDestaque({ destaque }: { destaque: DestaqueProps }) {
  const router = useRouter();

  const getUrlImagem = (nome: string) => 
    nome ? `${process.env.NEXT_PUBLIC_R2_URL}/${nome}` : "https://via.placeholder.com/300x450?text=Sem+Capa";

  const planoReal = destaque.planoMinimo || "BASICO";

  return (
    <div className="relative w-full h-[75vh] md:h-[85vh] flex items-center">
      <div className="absolute inset-0 z-0">
        <img src={getUrlImagem(destaque.capaUrlMinio)} alt={destaque.titulo} className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent"></div>
      </div>
      
      <div className="relative z-10 pl-6 md:pl-16 max-w-2xl mt-20">
        <h2 className="text-5xl md:text-7xl font-bold mb-4 text-white">{destaque.titulo}</h2>
        
        <div className="flex items-center gap-4 text-sm md:text-base font-semibold text-gray-300 mb-6">
          <span className="text-green-500 font-bold">98% Relevante</span>
          <span>{destaque.anoLancamento}</span>
          <Badge variant="outline" className="text-gray-300 border-gray-500">Plano {planoReal}</Badge>
          <span>{destaque.duracaoMinutos ? `${destaque.duracaoMinutos} min` : 'Série'}</span>
        </div>

        <p className="text-lg text-gray-300 mb-8 line-clamp-3">{destaque.descricao}</p>
        
        {/* Usamos o Button oficial do Shadcn com ícone do Lucide */}
        <Button 
          size="lg"
          onClick={() => router.push(`/conteudo/${destaque.id}`)} 
          className="bg-white text-black hover:bg-gray-300 text-lg font-bold px-8 py-6 rounded-md"
        >
          <Play className="mr-2 w-6 h-6 fill-current" /> Assistir
        </Button>
      </div>
    </div>
  );
}