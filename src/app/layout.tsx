import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BadPlay",
  description: "O streaming para quem tem opinião.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-[#141414] text-white`}>
        {children}
        <Toaster theme="dark" richColors />
      </body>
    </html>
  );
}