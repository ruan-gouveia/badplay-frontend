"use client";

import { useRef, useState, useEffect, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarrosselSecaoProps {
  titulo: ReactNode;
  children: ReactNode;
}

export default function CarrosselSecao({ titulo, children }: CarrosselSecaoProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [podePrev, setPodePrev] = useState(false);
  const [podeNext, setPodeNext] = useState(true);

  const atualizarSetas = () => {
    const el = scrollRef.current;
    if (!el) return;
    setPodePrev(el.scrollLeft > 10);
    setPodeNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    atualizarSetas();
    el.addEventListener("scroll", atualizarSetas);
    window.addEventListener("resize", atualizarSetas);
    return () => {
      el.removeEventListener("scroll", atualizarSetas);
      window.removeEventListener("resize", atualizarSetas);
    };
  }, []);

  const scroll = (direcao: "prev" | "next") => {
    const el = scrollRef.current;
    if (!el) return;
    const distancia = el.clientWidth * 0.8;
    el.scrollBy({ left: direcao === "next" ? distancia : -distancia, behavior: "smooth" });
  };

  return (
    <div className="pl-6 md:pl-16 relative group/secao">
      <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        {titulo}
      </h3>

      <div className="relative">
        {/* Seta Esquerda */}
        {podePrev && (
          <button
            onClick={() => scroll("prev")}
            className="
              absolute left-0 top-0 z-10 h-full w-14
              flex items-center justify-center
              bg-gradient-to-r from-black/80 to-transparent
              opacity-0 group-hover/secao:opacity-100
              transition-opacity duration-300
              hover:from-black/95
            "
            aria-label="Anterior"
          >
            <div className="
              w-10 h-10 rounded-full border-2 border-white/70
              flex items-center justify-center
              bg-black/60 hover:bg-red-600 hover:border-red-600
              transition-all duration-200 shadow-lg
            ">
              <ChevronLeft className="w-6 h-6 text-white" />
            </div>
          </button>
        )}

        {/* Lista sem scrollbar */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 pr-6 md:pr-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {children}
        </div>

        {/* Seta Direita */}
        {podeNext && (
          <button
            onClick={() => scroll("next")}
            className="
              absolute right-0 top-0 z-10 h-full w-14
              flex items-center justify-center
              bg-gradient-to-l from-black/80 to-transparent
              opacity-0 group-hover/secao:opacity-100
              transition-opacity duration-300
              hover:from-black/95
            "
            aria-label="Próximo"
          >
            <div className="
              w-10 h-10 rounded-full border-2 border-white/70
              flex items-center justify-center
              bg-black/60 hover:bg-red-600 hover:border-red-600
              transition-all duration-200 shadow-lg
            ">
              <ChevronRight className="w-6 h-6 text-white" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}