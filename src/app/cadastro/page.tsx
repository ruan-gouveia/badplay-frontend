"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { format } from "date-fns";
import PageWrapper from "@/components/PageWrapper";
import FloatingInput from "@/components/shared/FloatingInput";
import LoadingButton from "@/components/shared/LoadingButton";

// Imports do Shadcn
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";

function CadastroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailInicial = searchParams.get("email") || "";

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState(emailInicial);
  const [senha, setSenha] = useState("");
  
  const [dataSelecionada, setDataSelecionada] = useState<Date>();
  
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataSelecionada) {
      setErro("Selecione sua data de nascimento.");
      return;
    }
    
    setErro("");
    setCarregando(true);

    try {
      const dataFormatada = format(dataSelecionada, "yyyy-MM-dd");

      await api.post("/usuarios", { nome, email, senha, dataNascimento: dataFormatada });
      sessionStorage.setItem("@BadPlay:tempEmail", email);
      sessionStorage.setItem("@BadPlay:tempSenha", senha);
      router.push(`/planos`);
    } catch (err: any) {
      if (err.response?.data) setErro(Object.values(err.response.data).join(" | "));
      else setErro("Ocorreu um erro inesperado.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-black/80 p-10 rounded-xl shadow-2xl border border-gray-800 backdrop-blur-sm">
      <h1 className="text-3xl font-bold text-white mb-6">Crie sua conta</h1>
      <form onSubmit={handleCadastro} className="flex flex-col gap-4">
        {erro && <div className="bg-red-500/20 border border-red-500 text-red-500 text-sm p-3 rounded">{erro}</div>}
        
        <FloatingInput id="nome" type="text" label="Nome completo" required value={nome} onChange={(e) => setNome(e.target.value)} />
        <FloatingInput id="email" type="email" label="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <FloatingInput id="senha" type="password" label="Senha" required value={senha} onChange={(e) => setSenha(e.target.value)} />
        
        {/* COMPONENTE CALENDAR REFATORADO */}
        <div className="flex flex-col gap-1 mt-2">
          <label className="text-sm text-gray-400 pl-1">Data de Nascimento</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full bg-black border-gray-600 hover:bg-[#111] hover:text-white justify-start text-left font-normal py-6 px-4 ${!dataSelecionada && "text-gray-500"}`}
              >
                <CalendarIcon className="mr-2 h-5 w-5 text-red-600" />
                {dataSelecionada ? format(dataSelecionada, "dd/MM/yyyy") : "Escolha uma data"}
              </Button>
            </PopoverTrigger>
            
            {/* AGORA SIM: O Popover ganha fundo preto, borda vermelha e arredondamento! */}
            <PopoverContent 
              className="w-auto p-0 !border !border-red-600 bg-black rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.4)] [color-scheme:dark] overflow-hidden !outline-none" 
              align="start"
            >
              <Calendar
                mode="single"
                selected={dataSelecionada}
                onSelect={setDataSelecionada}
                showOutsideDays={true}
                fixedWeeks={true}
                captionLayout="dropdown"
                startMonth={new Date(1920, 0)} 
                endMonth={new Date()} 
              />
            </PopoverContent>
          </Popover>
        </div>

        <LoadingButton type="submit" isLoading={carregando} textLoading="Criando conta..." className="mt-4">
          Próximo
        </LoadingButton>
      </form>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <PageWrapper className="items-center justify-center p-6">
      <Suspense fallback={<div className="text-white">Carregando...</div>}>
        <CadastroForm />
      </Suspense>
    </PageWrapper>
  );
}