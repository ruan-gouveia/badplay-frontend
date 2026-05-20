"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import PageWrapper from "@/components/PageWrapper";
    
function CadastroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailInicial = searchParams.get("email") || "";

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState(emailInicial);
  const [senha, setSenha] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      await api.post("/usuarios", { nome, email, senha, dataNascimento });

      // SEGURANÇA: Salva temporariamente apenas na aba do navegador!
      sessionStorage.setItem("@BadPlay:tempEmail", email);
      sessionStorage.setItem("@BadPlay:tempSenha", senha);

      // Redireciona sem expor a senha na URL
      router.push(`/planos`);
      
    } catch (err: any) {
      if (err.response?.data) {
        setErro(Object.values(err.response.data).join(" | "));
      } else {
        setErro("Ocorreu um erro inesperado.");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-black/80 p-10 rounded-xl shadow-2xl border border-gray-800 backdrop-blur-sm">
      <h1 className="text-3xl font-bold text-white mb-6">Crie sua conta</h1>
      <form onSubmit={handleCadastro} className="flex flex-col gap-4">
        {erro && <div className="bg-red-500/20 border border-red-500 text-red-500 text-sm p-3 rounded">{erro}</div>}
        <input type="text" placeholder="Nome completo" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-[#333333] text-white p-4 rounded focus:outline-none focus:ring-2 focus:ring-red-600" />
        <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#333333] text-white p-4 rounded focus:outline-none focus:ring-2 focus:ring-red-600" />
        <input type="password" placeholder="Senha" required value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full bg-[#333333] text-white p-4 rounded focus:outline-none focus:ring-2 focus:ring-red-600" />
        <div>
          <label className="text-gray-400 text-sm mb-1 block">Data de Nascimento</label>
          <input type="date" required value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} className="w-full bg-[#333333] text-white p-4 rounded focus:outline-none focus:ring-2 focus:ring-red-600 [color-scheme:dark]" />
        </div>
        <button type="submit" disabled={carregando} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded transition-colors mt-2 disabled:opacity-50">
          {carregando ? "Criando conta..." : "Próximo"}
        </button>
      </form>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <PageWrapper className="items-center justify-center p-6">
      <Suspense fallback={<div className="text-white">Carregando...</div>}>
        <CadastroForm />
      </Suspense>
    </PageWrapper>
  );
}