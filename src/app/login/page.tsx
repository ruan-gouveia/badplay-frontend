"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/services/api";
import { TokenResponse } from "@/types/auth";
import PageWrapper from "@/components/PageWrapper";
import FloatingInput from "@/components/shared/FloatingInput";
import LoadingButton from "@/components/shared/LoadingButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await api.post<TokenResponse>("/auth/login", { email, senha });
      const dados = resposta.data;

      localStorage.setItem("@BadPlay:token", dados.token);
      localStorage.setItem("@BadPlay:nome", dados.nome);
      localStorage.setItem("@BadPlay:perfil", dados.perfil);

      if (dados.perfil === "ROLE_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/catalogo");
      }
    } catch (err: any) {
      setErro("E-mail ou senha incorretos.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <PageWrapper className="items-center justify-center p-6">
      <div className="w-full max-w-md bg-black/80 p-10 rounded-xl shadow-2xl border border-gray-800 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-white mb-8">Entrar</h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {erro && (
            <div className="bg-red-500/20 border border-red-500 text-red-500 text-sm p-3 rounded text-center">
              {erro}
            </div>
          )}

          <FloatingInput id="email" type="email" label="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <FloatingInput id="senha" type="password" label="Senha" required value={senha} onChange={(e) => setSenha(e.target.value)} />

          <LoadingButton type="submit" isLoading={carregando} textLoading="Entrando..." className="mt-4">
            Entrar
          </LoadingButton>
        </form>

        <p className="text-gray-400 mt-6 text-center">
          Novo por aqui?{" "}
          <Link href="/" className="text-white hover:underline">
            Assine agora.
          </Link>
        </p>
      </div>
    </PageWrapper>
  );
}