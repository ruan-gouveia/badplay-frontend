"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import PageWrapper from "@/components/PageWrapper";

function PagamentoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planoId = searchParams.get("planoId");

  const [numeroCartao, setNumeroCartao] = useState("");
  const [nomeTitular, setNomeTitular] = useState("");
  const [cvv, setCvv] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handlePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const tokenLocal = localStorage.getItem("@BadPlay:token");

      if (tokenLocal) {
        // FLUXO DE UPGRADE: Usuário já está logado! Só assinar.
        await api.post("/assinaturas", {
          planoId: Number(planoId),
          numeroCartao, nomeTitular, cvv,
        });
        router.push("/catalogo");

      } else {
        // FLUXO NOVO: Acabou de criar a conta, vamos fazer login primeiro.
        const email = sessionStorage.getItem("@BadPlay:tempEmail");
        const senha = sessionStorage.getItem("@BadPlay:tempSenha");

        if (!email || !senha || !planoId) {
          setErro("Sessão expirada. Volte para a página inicial e faça o cadastro novamente.");
          setCarregando(false);
          return;
        }

        const respLogin = await api.post("/auth/login", { email, senha });
        const dadosLogin = respLogin.data;

        localStorage.setItem("@BadPlay:token", dadosLogin.token);
        localStorage.setItem("@BadPlay:nome", dadosLogin.nome);
        localStorage.setItem("@BadPlay:perfil", dadosLogin.perfil);

        await api.post("/assinaturas", {
          planoId: Number(planoId),
          numeroCartao, nomeTitular, cvv,
        });

        sessionStorage.removeItem("@BadPlay:tempEmail");
        sessionStorage.removeItem("@BadPlay:tempSenha");
        router.push("/catalogo");
      }
    } catch (err: any) {
      if (err.response?.data?.erro) {
        setErro(err.response.data.erro);
      } else {
        setErro("Erro ao processar pagamento. Verifique os dados.");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-black/80 p-10 rounded-xl shadow-2xl border border-gray-800 backdrop-blur-sm">
      <h1 className="text-3xl font-bold text-white mb-2">Pagamento</h1>
      <p className="text-gray-400 mb-6">Último passo para liberar seu acesso.</p>

      <form onSubmit={handlePagamento} className="flex flex-col gap-4">
        {erro && <div className="bg-red-500/20 border border-red-500 text-red-500 text-sm p-3 rounded">{erro}</div>}
        <input type="text" placeholder="Nome no Cartão" required value={nomeTitular} onChange={(e) => setNomeTitular(e.target.value)} className="w-full bg-[#333333] text-white p-4 rounded focus:outline-none focus:ring-2 focus:ring-red-600" />
        <input type="text" placeholder="Número do Cartão (16 dígitos)" required maxLength={16} minLength={16} value={numeroCartao} onChange={(e) => setNumeroCartao(e.target.value.replace(/\D/g, ''))} className="w-full bg-[#333333] text-white p-4 rounded focus:outline-none focus:ring-2 focus:ring-red-600" />
        <input type="text" placeholder="CVV (3 dígitos)" required maxLength={3} minLength={3} value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))} className="w-full bg-[#333333] text-white p-4 rounded focus:outline-none focus:ring-2 focus:ring-red-600" />
        <button type="submit" disabled={carregando} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded transition-colors mt-4 disabled:opacity-50">
          {carregando ? "Processando..." : "Assinar / Fazer Upgrade"}
        </button>
      </form>
    </div>
  );
}

export default function PagamentoPage() {
  return (
    <PageWrapper className="items-center justify-center p-6">
      <Suspense fallback={<div className="text-white">Carregando formulário...</div>}>
        <PagamentoForm />
      </Suspense>
    </PageWrapper>
  );
}