import { ButtonHTMLAttributes } from "react";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  textLoading?: string;
  variant?: "primary" | "secondary";
}

export default function LoadingButton({ isLoading, textLoading, variant = "primary", children, className = "", ...props }: LoadingButtonProps) {
  const baseClass = "w-full py-3 rounded-md font-semibold transition-colors disabled:opacity-50 flex items-center justify-center";
  
  const variants = {
    primary: "text-white bg-red-600 hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.4)]",
    secondary: "text-gray-300 bg-transparent border border-gray-700 hover:bg-gray-800 hover:text-white"
  };

  return (
    <button disabled={isLoading} className={`${baseClass} ${variants[variant]} ${className}`} {...props}>
      {isLoading ? textLoading : children}
    </button>
  );
}