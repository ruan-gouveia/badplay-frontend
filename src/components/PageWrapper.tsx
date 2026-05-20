"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageWrapper({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const pathname = usePathname();
  const [animConfig, setAnimConfig] = useState({ x: 0, y: 15, opacity: 0 });
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    // Lê a direção gravada pela Navbar
    const dir = sessionStorage.getItem("slideDirection");
    
    if (dir === "direita") {
      setAnimConfig({ x: 100, y: 0, opacity: 0 }); // Vem da direita
    } else if (dir === "esquerda") {
      setAnimConfig({ x: -100, y: 0, opacity: 0 }); // Vem da esquerda
    } else {
      setAnimConfig({ x: 0, y: 15, opacity: 0 }); // Vem de baixo (Padrão para Login/Home)
    }

    setMontado(true); // Libera a tela para aparecer
  }, [pathname]);

  return (
    <main className="relative flex min-h-screen flex-col bg-[#141414] overflow-hidden">
      {/* Luzes de Fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {montado ? (
        <motion.div
          key={pathname}
          initial={animConfig}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`relative z-10 w-full flex-grow flex flex-col ${className}`}
        >
          {children}
        </motion.div>
      ) : (
        <div className={`relative z-10 w-full flex-grow flex flex-col opacity-0 ${className}`}>{children}</div>
      )}
    </main>
  );
}