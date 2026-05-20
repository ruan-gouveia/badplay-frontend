"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const navOrder = ["/catalogo", "/filmes", "/series", "/generos", "/listas"];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [busca, setBusca] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");

  const navLinks = [
    { name: "Início", path: "/catalogo" },
    { name: "Filmes", path: "/filmes" },
    { name: "Séries", path: "/series" },
    { name: "Gêneros", path: "/generos" },
    { name: "Minhas Listas", path: "/listas" },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    setNomeUsuario(localStorage.getItem("@BadPlay:nome") || "Usuário");
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSair = () => {
    localStorage.clear();
    router.push("/");
  };

  // Calcula a direção e salva antes de trocar de página
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
    <nav className={`fixed top-0 left-0 w-full z-50 transition-colors duration-500 ${isScrolled ? "bg-[#141414]" : "bg-gradient-to-b from-black/90 to-transparent"}`}>
      <div className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-8">
          <Link href="/catalogo">
            <h1 className="text-2xl md:text-3xl font-bold text-red-600 tracking-wider cursor-pointer">BADPLAY</h1>
          </Link>
          <ul className="hidden md:flex gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a 
                  href={link.path}
                  onClick={(e) => handleNavigation(e, link.path)}
                  className={`transition-colors cursor-pointer hover:text-gray-300 ${pathname === link.path ? "text-white font-bold" : "text-gray-400"}`}
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center bg-black/50 border border-gray-600 rounded px-3 py-1 focus-within:border-white transition-colors">
            <span className="text-gray-400 mr-2">⌕</span>
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={handleBusca}
              className="bg-transparent text-white text-sm focus:outline-none w-32 focus:w-48 transition-all duration-300 placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-red-600 text-white flex items-center justify-center font-bold">
              {nomeUsuario.charAt(0).toUpperCase()}
            </div>
            <button onClick={handleSair} className="text-sm text-gray-400 hover:text-white transition">Sair</button>
          </div>
        </div>
      </div>
    </nav>
  );
}