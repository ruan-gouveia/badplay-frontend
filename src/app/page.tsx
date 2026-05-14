"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageWrapper from "@/components/PageWrapper";

export default function Home() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleComecar = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/cadastro?email=${encodeURIComponent(email)}`);
  };

  return (
    <PageWrapper>
      {/* Cabeçalho fixado absolutamente no topo */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center p-6 md:px-12 z-20">
        <h1 className="text-4xl md:text-5xl font-bold text-red-600 tracking-wider">
          BADPLAY
        </h1>
        <Link href="/login" className="bg-red-600 text-white px-6 py-2 rounded font-semibold hover:bg-red-700 transition">
          Entrar
        </Link>
      </header>

      {/* Conteúdo Centralizado */}
      <div className="flex flex-col items-center justify-center text-center mt-16">
        <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4 max-w-4xl">
          Assista. Avalie. Compartilhe. O streaming ideal para você.
        </h2>
        <p className="text-lg md:text-2xl text-gray-300 mb-8 max-w-2xl">
          Explore o catálogo, crie suas listas de desejos e descubra novos conteúdos através da nossa recomendação social.
        </p>
        <p className="text-white mb-4 text-sm md:text-lg">
          Pronto para dar o play? Digite seu e-mail e escolha o plano perfeito para você.
        </p>

        <form onSubmit={handleComecar} className="flex flex-col md:flex-row gap-2 w-full max-w-2xl">
          <input
            type="email"
            placeholder="Endereço de email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-grow p-4 rounded bg-black/60 border border-gray-600 text-white focus:outline-none focus:border-white placeholder-gray-400 text-lg"
          />
          <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded text-2xl transition-colors flex items-center justify-center gap-2">
            Vamos lá <span className="text-xl">{'>'}</span>
          </button>
        </form>
      </div>
    </PageWrapper>
  );
}