"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

// Ordem das páginas para a animação de deslize saber para qual lado ir
const navOrder = ["/catalogo", "/filmes", "/series", "/generos", "/listas"];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [busca, setBusca] = useState("");
  const [mounted, setMounted] = useState(false); // Trava de segurança para a animação inicial

  // O nosso Custom Hook brilha aqui!
  const { nomeUsuario, logout } = useAuth(); 

  const navLinks = [
    { name: "Início", path: "/catalogo" },
    { name: "Filmes", path: "/filmes" },
    { name: "Séries", path: "/series" },
    { name: "Gêneros", path: "/generos" },
    { name: "Minhas Listas", path: "/listas" },
  ];

  useEffect(() => {
    setMounted(true); // Avisa ao React que a página terminou de carregar no navegador
    
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, targetPath: string) => {
    e.preventDefault();
    const currentIndex = navOrder.indexOf(pathname);
    const targetIndex = navOrder.indexOf(targetPath);

    if (currentIndex !== -1 && targetIndex !== -1) {
      if (targetIndex > currentIndex) {
        sessionStorage.setItem("slideDirection", "direita"); 
      } else {
        sessionStorage.setItem("slideDirection", "esquerda");
      }
    } else {
      sessionStorage.setItem("slideDirection", "cima");
    }
    router.push(targetPath);
  };

  const handleBusca = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && busca.trim() !== "") {
      router.push(`/busca?q=${encodeURIComponent(busca)}`);
      setBusca("");
    }
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-colors duration-500 ${isScrolled ? "bg-[#141414] shadow-md shadow-black/50" : "bg-gradient-to-b from-black/90 to-transparent"}`}>
      <div className="flex items-center justify-between px-6 py-4 md:px-12">
        
        {/* LADO ESQUERDO: Logo e Links */}
        <div className="flex items-center gap-8">
          <Link href="/catalogo">
            <h1 className="text-2xl md:text-3xl font-bold text-red-600 tracking-wider cursor-pointer drop-shadow-md">BADPLAY</h1>
          </Link>
          
          <ul className="hidden md:flex gap-6 text-sm font-medium relative h-full items-center">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              
              return (
                <li key={link.name} className="relative py-2">
                  <a 
                    href={link.path}
                    onClick={(e) => handleNavigation(e, link.path)}
                    className={`transition-colors cursor-pointer relative z-10 ${isActive ? "text-white font-bold" : "text-gray-400 hover:text-gray-200"}`}
                  >
                    {link.name}
                  </a>
                  
                  {/* INDICADOR VERMELHO DESLIZANTE */}
                  {isActive && mounted && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-[2px] bg-red-600 rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* LADO DIREITO: Busca, Avatar e Sair */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center bg-black/60 border border-gray-700 rounded-full px-3 py-1.5 focus-within:border-gray-400 transition-colors">
            <span className="text-gray-400 mr-2 font-bold">⌕</span>
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={handleBusca}
              className="bg-transparent text-white text-sm focus:outline-none w-32 focus:w-48 transition-all duration-300 placeholder-gray-500"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Avatar className="w-9 h-9 border border-gray-700 cursor-pointer hover:border-red-600 transition-colors">
              <AvatarFallback className="bg-red-600 text-white font-bold">
                {nomeUsuario.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button onClick={logout} className="text-sm font-semibold text-gray-400 hover:text-white transition">
              Sair
            </button>
          </div>
        </div>
        
      </div>
    </nav>
  );
}