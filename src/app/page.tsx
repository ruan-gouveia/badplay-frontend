"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageWrapper from "@/components/PageWrapper";
import FloatingInput from "@/components/shared/FloatingInput";

export default function Home() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleComecar = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/cadastro?email=${encodeURIComponent(email)}`);
  };

  return (
    <PageWrapper>
      <header className="absolute top-0 left-0 w-full flex justify-between items-center p-6 md:px-12 z-20">
        <h1 className="text-4xl md:text-5xl font-bold text-red-600 tracking-wider drop-shadow-md">
          BADPLAY
        </h1>
        <Link href="/login" className="bg-red-600 text-white px-6 py-2 rounded font-semibold hover:bg-red-700 transition shadow-[0_0_15px_rgba(220,38,38,0.3)]">
          Entrar
        </Link>
      </header>

      <div className="flex-grow flex flex-col items-center justify-center text-center w-full px-4 mt-16">
        <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4 max-w-4xl drop-shadow-lg">
          Assista. Avalie. Compartilhe.<br/>O streaming ideal para você.
        </h2>
        <p className="text-lg md:text-2xl text-gray-300 mb-8 max-w-2xl drop-shadow">
          Explore o catálogo, crie suas listas de desejos e descubra novos conteúdos através da nossa recomendação social.
        </p>
        <p className="text-white mb-6 text-sm md:text-lg">
          Pronto para dar o play? Digite seu e-mail e escolha o plano perfeito para você.
        </p>

        <form onSubmit={handleComecar} className="flex flex-col md:flex-row gap-4 w-full max-w-2xl">
          <FloatingInput 
            id="emailHome" 
            type="email" 
            label="Endereço de email" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-md text-xl md:text-2xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-[0_0_20px_rgba(220,38,38,0.4)]">
            Vamos lá {'>'}
          </button>
        </form>
      </div>
    </PageWrapper>
  );
}