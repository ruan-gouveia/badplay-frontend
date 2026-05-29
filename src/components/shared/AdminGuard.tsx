"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import LoadingButton from "./LoadingButton";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, carregandoAuth } = useAuth();
  const router = useRouter();

  if (carregandoAuth) {
    return <div className="min-h-screen bg-[#141414] flex items-center justify-center text-white">Verificando credenciais...</div>;
  }

  // Se não for admin, exibe a tela fixa de bloqueio exigindo que ele clique para voltar
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#141414] flex flex-col items-center justify-center text-white p-4">
        <ShieldAlert className="w-24 h-24 text-red-600 mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Acesso Restrito</h1>
        <p className="text-gray-400 text-center mb-10 text-lg max-w-md">
          Você não possui privilégios de administrador para acessar o Centro de Comando.
        </p>
        <LoadingButton onClick={() => router.push("/catalogo")} className="!w-auto px-12 py-4 text-lg">
          Voltar para o Início
        </LoadingButton>
      </div>
    );
  }

  // Se for admin, renderiza o painel
  return <>{children}</>;
}