import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface CustomModalProps {
  isOpen: boolean;
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
  centerTitle?: boolean;
}

export default function CustomModal({ isOpen, title, icon, children, maxWidth = "max-w-md", centerTitle = false }: CustomModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        // Padding (py-6) garante que o modal não grude no topo/fundo da tela
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            // MÁGICA AQUI: max-h-[90vh] impede de vazar da tela. overflow-y-auto cria o scroll interno!
            className={`bg-[#111111] border border-gray-800 p-6 md:p-8 rounded-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative flex flex-col ${maxWidth}`}
          >
            {icon && (
              <div className="w-16 h-16 bg-red-900/20 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 flex-shrink-0">
                {icon}
              </div>
            )}
            {title && (
              <h2 className={`text-2xl font-bold text-white mb-6 flex-shrink-0 ${centerTitle ? 'text-center' : ''}`}>
                {title}
              </h2>
            )}
            
            {/* O conteúdo do Modal */}
            <div className="flex-grow">
              {children}
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}