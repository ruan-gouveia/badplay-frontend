"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import PageWrapper from "@/components/PageWrapper";
import FloatingInput from "@/components/shared/FloatingInput";
import LoadingButton from "@/components/shared/LoadingButton";

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
      sessionStorage.setItem("@BadPlay:tempEmail", email);
      sessionStorage.setItem("@BadPlay:tempSenha", senha);
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
        
        <FloatingInput id="nome" type="text" label="Nome completo" required value={nome} onChange={(e) => setNome(e.target.value)} />
        <FloatingInput id="email" type="email" label="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <FloatingInput id="senha" type="password" label="Senha" required value={senha} onChange={(e) => setSenha(e.target.value)} />
        <FloatingInput id="dataNascimento" type="date" label="Data de Nascimento" required value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />

        <LoadingButton type="submit" isLoading={carregando} textLoading="Criando conta..." className="mt-2">
          Próximo
        </LoadingButton>
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