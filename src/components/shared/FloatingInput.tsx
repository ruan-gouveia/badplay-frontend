"use client";

import { InputHTMLAttributes } from "react";

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function FloatingInput({ label, id, className = "", type, value, ...props }: FloatingInputProps) {
  const isDate = type === "date";
  // Checa se tem texto digitado para a label não descer e ficar por cima do texto
  const hasValue = value !== undefined && value !== "";

  return (
    <div className={`relative w-full ${className}`}>
      {/* INPUT: Fundo preto, padding igualado, borda fica vermelha no focus */}
      <input
        id={id}
        type={type}
        value={value}
        placeholder=" "
        className={`block w-full px-4 py-4 text-base text-white bg-black rounded-md border border-gray-600 appearance-none focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 peer transition-all ${isDate ? 'min-h-[58px]' : ''}`}
        {...props}
      />
      
      {/* LABEL: Sobe exatamente para a linha da borda (top-0 -translate-y-1/2), ganha fundo preto e fica vermelha no focus */}
      <label
        htmlFor={id}
        className={`absolute text-base duration-300 transform z-10 origin-[0] left-3 px-1 cursor-text pointer-events-none transition-all
          ${(hasValue || isDate) 
            ? 'top-0 -translate-y-1/2 scale-75 bg-black text-white' 
            : 'top-1/2 -translate-y-1/2 scale-100 bg-transparent text-white'}
          peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-75 peer-focus:bg-black peer-focus:text-red-600
        `}
      >
        {label}
      </label>
    </div>
  );
}