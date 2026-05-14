"use client";

import { motion } from "framer-motion";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col bg-[#141414] overflow-hidden">
      
      {/* Detalhe Vermelho: Canto Superior Esquerdo */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      {/* Detalhe Vermelho: Canto Inferior Direito */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center p-6"
      >
        {children}
      </motion.div>
    </main>
  );
}