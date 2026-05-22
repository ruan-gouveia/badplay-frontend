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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`bg-[#111111] border border-gray-800 p-8 rounded-2xl w-full shadow-2xl ${maxWidth}`}
          >
            {icon && (
              <div className="w-16 h-16 bg-red-900/20 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                {icon}
              </div>
            )}
            {title && (
              <h2 className={`text-2xl font-bold text-white mb-6 ${centerTitle ? 'text-center' : ''}`}>
                {title}
              </h2>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}