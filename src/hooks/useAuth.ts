"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function useAuth() {
  const router = useRouter();
  const [isLogged, setIsLogged] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  useEffect(() => {
    // Lê os dados do navegador
    const token = localStorage.getItem("@BadPlay:token");
    const perfil = localStorage.getItem("@BadPlay:perfil");
    const nome = localStorage.getItem("@BadPlay:nome");

    if (token) {
      setIsLogged(true);
      setNomeUsuario(nome || "Usuário");
      setIsAdmin(perfil === "ROLE_ADMIN");
    } else {
      setIsLogged(false);
      setIsAdmin(false);
    }
    
    setCarregandoAuth(false);
  }, []);

  const logout = () => {
    localStorage.clear();
    router.push("/");
  };

  return { isLogged, isAdmin, nomeUsuario, carregandoAuth, logout };
}