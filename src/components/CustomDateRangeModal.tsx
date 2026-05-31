import { useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";
import DatePicker from "./DatePicker";
import { getLocalDateString, parseLocalDateString } from "../utils/dateUtils";

interface CustomDateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (startDate: string, endDate: string) => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

export default function CustomDateRangeModal({
  isOpen,
  onClose,
  onApply,
  initialStartDate = "",
  initialEndDate = "",
}: CustomDateRangeModalProps) {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [error, setError] = useState("");

  // Sincronizar com props quando modal abrir
  useEffect(() => {
    if (isOpen) {
      setStartDate(initialStartDate);
      setEndDate(initialEndDate);
      setError("");
    }
  }, [isOpen, initialStartDate, initialEndDate]);

  const handleApply = () => {
    // Validação
    if (!startDate || !endDate) {
      setError("Selecione ambas as datas");
      return;
    }

    const start = parseLocalDateString(startDate);
    const end = parseLocalDateString(endDate);
    const today = parseLocalDateString(getLocalDateString());
    today.setHours(23, 59, 59, 999);

    if (start > end) {
      setError("Data inicial deve ser anterior à data final");
      return;
    }

    if (end > today) {
      setError("Data final não pode ser no futuro");
      return;
    }

    onApply(startDate, endDate);
    onClose();
  };

  const getTodayDate = () => {
    return getLocalDateString();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 w-full h-full z-[70] flex items-center justify-center p-4 bg-black/50 dark:bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="text-emerald-500" size={24} />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Período Personalizado
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Fechar"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Campos de Data */}
          <div className="space-y-4 mb-6">
            {/* Data Inicial */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Inicial
              </label>
              <DatePicker
                value={startDate}
                onChange={(value) => {
                  setStartDate(value);
                  setError("");
                }}
                max={getTodayDate()}
                variant="muted"
                placeholder="Data inicial"
              />
            </div>

            {/* Data Final */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Final
              </label>
              <DatePicker
                value={endDate}
                onChange={(value) => {
                  setEndDate(value);
                  setError("");
                }}
                min={startDate || undefined}
                max={getTodayDate()}
                variant="muted"
                placeholder="Data final"
              />
            </div>

            {/* Erro */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 dark:text-red-400"
              >
                {error}
              </motion.p>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              fullWidth
              className="border border-gray-300 dark:border-gray-600"
            >
              Cancelar
            </Button>
            <Button onClick={handleApply} variant="primary" fullWidth>
              Aplicar
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

