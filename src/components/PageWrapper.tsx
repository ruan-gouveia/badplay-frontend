"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar"; // <-- IMPORTANDO A NAVBAR AQUI

const navOrder = ["/catalogo", "/filmes", "/series", "/generos", "/listas"];

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  hasNavbar?: boolean; // NOVO: Flag para ligar a Navbar fixa
}

export default function PageWrapper({ children, className = "", hasNavbar = false }: PageWrapperProps) {
  const pathname = usePathname();
  const [direction, setDirection] = useState(0);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const prevPath = sessionStorage.getItem("currentPath");
    const prevIndex = navOrder.indexOf(prevPath || "");
    const currIndex = navOrder.indexOf(pathname);

    if (prevIndex !== -1 && currIndex !== -1 && prevIndex !== currIndex) {
      setDirection(currIndex > prevIndex ? 100 : -100);
    } else {
      setDirection(0);
    }
    
    sessionStorage.setItem("currentPath", pathname);
    setMontado(true);
  }, [pathname]);

  return (
    <main className="relative flex min-h-screen flex-col bg-[#141414] overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* A NAVBAR FICA PARADA AQUI (Fora do framer-motion) */}
      {hasNavbar && <Navbar />}

      {montado ? (
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: direction, y: direction === 0 ? 15 : 0 }}
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