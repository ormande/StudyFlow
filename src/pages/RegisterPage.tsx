import { useState, useEffect } from "react";
import {
  Save,
  Plus,
  BookOpen,
  Check,
  X,
  HelpCircle,
  RefreshCw,
  Layers,
  Calendar,
  Clock,
  FileText,
} from "lucide-react";
import { Subject, StudyLog } from "../types";
import { useToast } from "../contexts/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/Button";
import { ACCORDION_ANIMATION } from "../utils/animations";
import {
  getLocalDateString,
  getYesterdayDateString,
  getDaysDifference,
} from "../utils/dateUtils";

interface RegisterPageProps {
  subjects: Subject[];
  onAddLog: (log: Omit<StudyLog, "id" | "timestamp">) => void;
  onUpdateSubject?: (subjectId: string, updates: Partial<Subject>) => void;
  prefilledTime?: { hours: number; minutes: number; seconds: number };
  onTimeClear: () => void;
  timerSeconds: number;
  isTimerRunning: boolean;
}

// ✅ FUNÇÃO DE VALIDAÇÃO
const sanitizeNumericInput = (value: string, max?: number): string => {
  if (value === "") return "";
  const num = parseInt(value);
  if (isNaN(num) || num < 0) return "0";
  if (max !== undefined && num > max) return max.toString();
  return num.toString();
};

export default function RegisterPage({
  subjects,
  onAddLog,
  onUpdateSubject,
  prefilledTime,
  onTimeClear,
  timerSeconds,
  isTimerRunning,
}: RegisterPageProps) {
  const { addToast } = useToast();
  const [subjectId, setSubjectId] = useState("");
  const [subtopicId, setSubtopicId] = useState("");
  const [type, setType] = useState<"teoria" | "questoes" | "revisao">("teoria");
  const [dateOption, setDateOption] = useState<"today" | "yesterday" | "other">(
    "today"
  );
  const [date, setDate] = useState(getLocalDateString()); // Armazena sempre YYYY-MM-DD com timezone local
  const [maskedDate, setMaskedDate] = useState(""); // Armazena DD/MM/AAAA para o input desktop
  const [isDateValid, setIsDateValid] = useState(true);
  const [hours, setHours] = useState("");

  // ... (restante do código)

  const validateDateString = (value: string): boolean => {
    if (!value || value.length < 10) return true;
    const [d, m, y] = value.split("/").map(Number);
    const date = new Date(y, m - 1, d);
    const now = new Date();
    const matches =
      date.getDate() === d &&
      date.getMonth() === m - 1 &&
      date.getFullYear() === y;
    const isReasonable = y > 1900 && date <= now;
    return matches && isReasonable;
  };

  const handleMaskedDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length >= 2) {
      const day = parseInt(value.slice(0, 2));
      if (day > 31) value = "31" + value.slice(2);
      if (day === 0 && value.length === 2) value = "01";
    }
    if (value.length >= 4) {
      const month = parseInt(value.slice(2, 4));
      if (month > 12) value = value.slice(0, 2) + "12" + value.slice(4);
      if (month === 0 && value.length === 4) value = value.slice(0, 2) + "01";
    }

    if (value.length > 8) value = value.slice(0, 8);

    if (value.length >= 5) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    } else if (value.length >= 3) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setMaskedDate(value);

    const valid = validateDateString(value);
    setIsDateValid(valid);

    // Se estiver completo e for válido, atualiza o date original
    if (value.length === 10 && valid) {
      const [d, m, y] = value.split("/");
      const isoDate = `${y}-${m}-${d}`;
      handleDateChange(isoDate);
    }
  };
  const [seconds, setSeconds] = useState("");
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");

  const [pages, setPages] = useState("");
  const [correct, setCorrect] = useState("");
  const [wrong, setWrong] = useState("");
  const [blank, setBlank] = useState("");
  const [markSubtopicCompleted, setMarkSubtopicCompleted] = useState(false);

  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const selectedSubtopic = selectedSubject?.subtopics.find(
    (st) => st.id === subtopicId
  );

  useEffect(() => {
    setSubtopicId("");
    setMarkSubtopicCompleted(false);
  }, [subjectId]);

  useEffect(() => {
    // Resetar checkbox quando subtópico muda
    setMarkSubtopicCompleted(false);
  }, [subtopicId]);

  useEffect(() => {
    if (prefilledTime) {
      setHours(prefilledTime.hours > 0 ? prefilledTime.hours.toString() : "");
      setMinutes(
        prefilledTime.minutes > 0 ? prefilledTime.minutes.toString() : ""
      );
      setSeconds(
        prefilledTime.seconds > 0 ? prefilledTime.seconds.toString() : ""
      );
    }
  }, [prefilledTime]);

  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      const h = Math.floor(timerSeconds / 3600);
      const m = Math.floor((timerSeconds % 3600) / 60);
      const s = timerSeconds % 60;
      setHours(h > 0 ? h.toString() : "");
      setMinutes(m > 0 ? m.toString() : "");
      setSeconds(s > 0 ? s.toString() : "");
      setDate(getLocalDateString());
      setDateOption("today");
    }
  }, [timerSeconds, isTimerRunning]);

  // Função para validar data
  const isValidDate = (dateString: string): boolean => {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return selectedDate <= today;
  };

  // Handler para mudança de opção de data
  const handleDateOptionChange = (option: "today" | "yesterday" | "other") => {
    setDateOption(option);

    if (option === "today") {
      const todayDate = getLocalDateString();
      setDate(todayDate);
      // Atualizar maskedDate para desktop
      const [year, month, day] = todayDate.split("-");
      setMaskedDate(`${day}/${month}/${year}`);
    } else if (option === "yesterday") {
      const now = new Date();
      const currentHour = now.getHours();

      // Validação de madrugada (00:00 - 05:59)
      if (currentHour < 6) {
        const confirmMessage = `São ${now
          .getHours()
          .toString()
          .padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}. Você quis dizer o dia anterior mesmo?`;
        if (!window.confirm(confirmMessage)) {
          // Se cancelar, volta para "Hoje"
          setDateOption("today");
          const todayDate = getLocalDateString();
          setDate(todayDate);
          const [year, month, day] = todayDate.split("-");
          setMaskedDate(`${day}/${month}/${year}`);
          return;
        }
      }

      const yesterdayDate = getYesterdayDateString();
      setDate(yesterdayDate);
      // Atualizar maskedDate para desktop
      const [year, month, day] = yesterdayDate.split("-");
      setMaskedDate(`${day}/${month}/${year}`);
    }
    // Se for "other", mantém a data atual e mostra o date picker
  };

  // Handler para mudança direta do date picker
  const handleDateChange = (newDate: string) => {
    if (!isValidDate(newDate)) {
      addToast("Não é possível registrar estudo futuro", "error");
      // Reverter para data válida (hoje)
      setDate(getLocalDateString());
      setDateOption("today");
      return;
    }

    const daysDiff = getDaysDifference(newDate, getLocalDateString());
    if (daysDiff > 30) {
      const confirmMessage = `Este estudo foi há ${daysDiff} dias. Confirma?`;
      if (!window.confirm(confirmMessage)) {
        // Reverter para data anterior válida
        setDate(getYesterdayDateString());
        setDateOption("yesterday");
        return;
      }
    }

    setDate(newDate);
    setDateOption("other");
  };

  const handleHoursChange = (value: string) =>
    setHours(sanitizeNumericInput(value));
  const handleMinutesChange = (value: string) =>
    setMinutes(sanitizeNumericInput(value, 59));
  const handleSecondsChange = (value: string) =>
    setSeconds(sanitizeNumericInput(value, 59));
  const handlePagesChange = (value: string) =>
    setPages(sanitizeNumericInput(value));
  const handleCorrectChange = (value: string) =>
    setCorrect(sanitizeNumericInput(value));
  const handleWrongChange = (value: string) =>
    setWrong(sanitizeNumericInput(value));
  const handleBlankChange = (value: string) =>
    setBlank(sanitizeNumericInput(value));

  const clearSessionFields = () => {
    setHours("");
    setSeconds("");
    setMinutes("");
    setNotes("");
    setPages("");
    setCorrect("");
    setWrong("");
    setBlank("");
    setMarkSubtopicCompleted(false);
    onTimeClear();
  };

  const resetFormFully = () => {
    setSubjectId("");
    setSubtopicId("");
    clearSessionFields();
    const todayDate = getLocalDateString();
    setDate(todayDate);
    const [year, month, day] = todayDate.split("-");
    setMaskedDate(`${day}/${month}/${year}`);
    setDateOption("today");
  };

  const submitLog = (mode: "full" | "continue") => {
    if (!subjectId) {
      addToast("Selecione uma matéria, guerreiro!", "warning");
      return;
    }
    const h = Math.max(0, parseInt(hours) || 0);
    const m = Math.max(0, parseInt(minutes) || 0);
    const s = Math.max(0, parseInt(seconds) || 0);
    if (h === 0 && m === 0 && s === 0) {
      addToast("O tempo de estudo não pode ser zero.", "warning");
      return;
    }
    const subtopicName = selectedSubject?.subtopics.find(
      (st) => st.id === subtopicId
    )?.name;

    const newLog: Omit<StudyLog, "id" | "timestamp"> = {
      subjectId,
      subject: selectedSubject?.name || "Desconhecida",
      subtopicId: subtopicId || undefined,
      subtopic: subtopicName || undefined,
      type,
      hours: h,
      minutes: m,
      seconds: s,
      date: date,
      notes: notes.trim(),
      pages: Math.max(0, parseInt(pages) || 0),
      correct: Math.max(0, parseInt(correct) || 0),
      wrong: Math.max(0, parseInt(wrong) || 0),
      blank: Math.max(0, parseInt(blank) || 0),
    };

    onAddLog(newLog);

    if (
      markSubtopicCompleted &&
      subtopicId &&
      subjectId &&
      onUpdateSubject &&
      selectedSubject
    ) {
      const updatedSubtopics = selectedSubject.subtopics.map((st) =>
        st.id === subtopicId ? { ...st, completed: true } : st
      );
      onUpdateSubject(subjectId, { subtopics: updatedSubtopics });
    }

    if (mode === "continue") {
      clearSessionFields();
      addToast(
        "Registro salvo! Matéria e data mantidas — preencha o próximo.",
        "success"
      );
    } else {
      resetFormFully();
      addToast("Estudo registrado com sucesso!", "success");
    }

    if (navigator.vibrate) navigator.vibrate(200);
  };

  const handleSubmit = () => submitLog("full");
  const handleSubmitAndNew = () => submitLog("continue");

  const typeButtons = [
    { id: "teoria", label: "Teoria", icon: BookOpen },
    { id: "questoes", label: "Questões", icon: HelpCircle },
    { id: "revisao", label: "Revisão", icon: RefreshCw },
  ];

  return (
    <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* OTIMIZAÇÃO MOBILE: Padding lateral reduzido de px-6 para px-4 no mobile para dar mais espaço */}

      {/* Header Fixo */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Save className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-colors">
            Registrar
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base transition-colors">
          Salve sua missão cumprida
        </p>
      </div>

      {/* OTIMIZAÇÃO MOBILE: Gap aumentado de gap-4 para gap-5 no mobile, mantendo gap-6 no desktop para melhor respiração */}
      {/* Grid Flexível - Cards Soltos */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {/* OTIMIZAÇÃO MOBILE: Padding interno mantido p-4 no mobile, md:p-6 no desktop. Gap entre campos aumentado de space-y-4 para space-y-5 */}
        {/* Card 1 - Matéria */}
        <motion.div
          layout
          className="md:col-span-4 lg:col-span-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 lg:p-8 transition-colors duration-300 flex flex-col justify-center"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div>
            <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 md:mb-2 flex items-center gap-1">
              <BookOpen size={14} className="text-emerald-500" /> Matéria
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-500 outline-none text-sm md:text-base text-gray-900 dark:text-white transition-colors"
            >
              <option value="">Selecione a matéria...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* OTIMIZAÇÃO MOBILE: Padding interno mantido p-4 no mobile, md:p-6 no desktop */}
        {/* Card 2 - Data */}
        <motion.div
          layout
          className="md:col-span-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 lg:p-8 transition-colors duration-300 flex flex-col justify-center"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 md:mb-2 flex items-center gap-1">
            <Calendar size={14} className="text-emerald-500" /> Data do Estudo
          </label>

          {/* Seletor de Opções Rápidas */}
          <div className="grid grid-cols-3 gap-2 mb-3 flex-shrink-0">
            <Button
              type="button"
              onClick={() => handleDateOptionChange("today")}
              variant={dateOption === "today" ? "primary" : "secondary"}
              size="md"
              className={`min-h-[44px] ${
                dateOption === "today"
                  ? ""
                  : "border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
              }`}
            >
              Hoje
            </Button>
            <Button
              type="button"
              onClick={() => handleDateOptionChange("yesterday")}
              variant={dateOption === "yesterday" ? "primary" : "secondary"}
              size="md"
              className={`min-h-[44px] ${
                dateOption === "yesterday"
                  ? ""
                  : "border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
              }`}
            >
              Ontem
            </Button>
            <Button
              type="button"
              onClick={() => handleDateOptionChange("other")}
              variant={dateOption === "other" ? "primary" : "secondary"}
              size="md"
              className={`min-h-[44px] ${
                dateOption === "other"
                  ? ""
                  : "border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
              }`}
            >
              Outro
            </Button>
          </div>

          {/* Date Picker - Sempre visível em desktop, editável apenas quando "Outro" está selecionado */}
          <div className="relative min-w-0">
            {/* Input de data customizado (desktop) */}
            <div className="hidden md:block relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 pointer-events-none z-10"
                size={20}
              />
              <input
                type="text"
                inputMode="numeric"
                value={maskedDate}
                onChange={handleMaskedDateChange}
                placeholder="DD/MM/AAAA"
                disabled={dateOption !== "other"}
                className={`w-full px-3 py-3 pl-10 bg-gray-50 dark:bg-gray-700 border ${
                  !isDateValid
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-200 dark:border-gray-600 hover:border-emerald-500 focus:border-emerald-500"
                } rounded-xl outline-none text-sm text-gray-900 dark:text-white transition-colors h-12 text-center disabled:opacity-50 disabled:cursor-not-allowed`}
              />
            </div>
            {!isDateValid && (
              <p className="text-[10px] text-red-500 mt-1 text-center font-bold hidden md:block">
                Data inválida
              </p>
            )}

            {/* Input de data padrão (mobile) - Mantido calendário funcional conforme solicitado */}
            <AnimatePresence>
              {dateOption === "other" && (
                <motion.input
                  {...ACCORDION_ANIMATION}
                  type="date"
                  value={date}
                  max={getLocalDateString()}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full md:hidden px-3 py-3 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-500 outline-none text-sm text-gray-900 dark:text-white transition-colors appearance-none h-12 [color-scheme:light] dark:[color-scheme:dark] min-w-0 text-center cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    backgroundSize: "20px 20px",
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Card 3 - Tipo de Estudo */}
        <motion.div
          layout
          className="md:col-span-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 lg:p-8 transition-colors duration-300 flex flex-col justify-center"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 md:mb-2 flex items-center gap-1 flex-shrink-0">
            <RefreshCw size={14} className="text-emerald-500" /> Tipo de Estudo
          </label>
          {/* OTIMIZAÇÃO MOBILE: Gap aumentado de gap-2 para gap-3 para melhor espaçamento. Altura mínima garantida (py-3.5 = ~44px) para toque fácil */}
          <div className="flex flex-wrap gap-2 sm:gap-3 md:flex-nowrap md:gap-2 flex-shrink-0">
            {typeButtons.map((btn) => {
              return (
                <Button
                  key={btn.id}
                  type="button"
                  onClick={() => setType(btn.id as any)}
                  variant={type === btn.id ? "primary" : "secondary"}
                  size="md"
                  className={`flex-1 min-w-[100px] md:min-w-0 min-h-[44px] ${
                    type === btn.id
                      ? ""
                      : "border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                  }`}
                >
                  <span className="text-sm md:text-base font-semibold truncate">{btn.label}</span>
                </Button>
              );
            })}
          </div>
        </motion.div>

        {/* Card 4 - Subtópico */}
        <motion.div
          layout
          className="md:col-span-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 lg:p-8 transition-colors duration-300"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 md:mb-2 flex items-center gap-1">
            <Layers size={14} className="text-emerald-500" /> Subtópico{" "}
            <span className="text-[10px] font-normal opacity-70 normal-case">
              (Opcional)
            </span>
          </label>
          <select
            value={subtopicId}
            onChange={(e) => setSubtopicId(e.target.value)}
            disabled={
              !selectedSubject || selectedSubject.subtopics.length === 0
            }
            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-500 outline-none text-sm text-gray-900 dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {!selectedSubject
                ? "Selecione uma matéria primeiro"
                : selectedSubject.subtopics.length === 0
                ? "Esta matéria não possui subtópicos"
                : "Geral (Sem subtópico específico)"}
            </option>
            {selectedSubject?.subtopics.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} {st.completed ? "(Concluído)" : ""}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Card 5 - Marcar Concluído */}
        <motion.div
          layout
          className="md:col-span-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 lg:p-8 transition-colors duration-300 flex flex-col justify-center"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 md:mb-2 flex items-center gap-1">
            <Check size={14} className="text-emerald-500" /> Status
          </label>
          <button
            type="button"
            onClick={() =>
              subtopicId &&
              selectedSubtopic &&
              !selectedSubtopic.completed &&
              setMarkSubtopicCompleted(!markSubtopicCompleted)
            }
            disabled={
              !subtopicId || !selectedSubtopic || selectedSubtopic?.completed
            }
            className={`w-full flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              markSubtopicCompleted
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 dark:border-emerald-700"
                : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-700"
            }`}
          >
            <div
              className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                markSubtopicCompleted
                  ? "bg-emerald-500 border-emerald-500"
                  : "bg-transparent border-gray-300 dark:border-gray-500"
              }`}
            >
              {markSubtopicCompleted && (
                <Check size={12} className="text-white" strokeWidth={3} />
              )}
            </div>
            <span
              className={`text-sm font-medium ${
                markSubtopicCompleted
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {selectedSubtopic?.completed
                ? "Já concluído"
                : !subtopicId
                ? "Selecione um subtópico"
                : "Marcar como concluído"}
            </span>
          </button>
        </motion.div>

        {/* Card 6 - Tempo Estudado */}
        <div className="md:col-span-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 lg:p-8 transition-colors duration-300">
          <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 md:mb-2 flex items-center gap-1">
            <Clock size={14} className="text-emerald-500" /> Tempo Estudado
          </label>
          {/* OTIMIZAÇÃO MOBILE: Gap ajustado para gap-3 no mobile (era gap-4), mantendo gap-4 no desktop para melhor respiração */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="flex flex-col items-center">
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => handleHoursChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={isTimerRunning}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 h-12 md:h-14 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl outline-none text-center font-black text-2xl md:text-3xl text-gray-900 dark:text-white focus:border-emerald-500 disabled:opacity-50 transition-colors"
                placeholder="0"
              />
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase">
                Horas
              </span>
            </div>
            <div className="flex flex-col items-center">
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => handleMinutesChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={isTimerRunning}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 h-12 md:h-14 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl outline-none text-center font-black text-2xl md:text-3xl text-gray-900 dark:text-white focus:border-emerald-500 disabled:opacity-50 transition-colors"
                placeholder="0"
              />
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase">
                Minutos
              </span>
            </div>
            <div className="flex flex-col items-center">
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => handleSecondsChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={isTimerRunning}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 h-12 md:h-14 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl outline-none text-center font-black text-2xl md:text-3xl text-gray-900 dark:text-white focus:border-emerald-500 disabled:opacity-50 transition-colors"
                placeholder="0"
              />
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase">
                Segundos
              </span>
            </div>
          </div>
        </div>

        {/* Card 7 - Desempenho */}
        <div className="md:col-span-7 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 lg:p-8 transition-colors duration-300">
          <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 md:mb-2 flex items-center gap-1">
            <FileText size={14} className="text-emerald-500" /> Desempenho
          </label>

          {/* OTIMIZAÇÃO MOBILE: Gap mantido gap-3 (já adequado) */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {/* BLOCO CERTAS */}
            <div className="flex flex-col items-center">
              <div className="relative w-full">
                <div className="absolute left-0 top-0 bottom-0 w-10 md:w-12 bg-emerald-500 rounded-l-2xl flex items-center justify-center">
                  <Check size={16} className="text-white" />
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  value={correct}
                  onChange={(e) => handleCorrectChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  className="w-full pl-10 md:pl-12 px-3 md:px-4 py-2.5 md:py-3 h-12 md:h-14 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-2xl outline-none text-center font-black text-2xl md:text-3xl text-emerald-700 dark:text-emerald-300 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="0"
                />
              </div>
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase">
                Certas
              </span>
            </div>

            {/* BLOCO ERRADAS */}
            <div className="flex flex-col items-center">
              <div className="relative w-full">
                <div className="absolute left-0 top-0 bottom-0 w-10 md:w-12 bg-red-500 rounded-l-2xl flex items-center justify-center">
                  <X size={16} className="text-white" />
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  value={wrong}
                  onChange={(e) => handleWrongChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  className="w-full pl-10 md:pl-12 px-3 md:px-4 py-2.5 md:py-3 h-12 md:h-14 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-2xl outline-none text-center font-black text-2xl md:text-3xl text-red-700 dark:text-red-300 transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  placeholder="0"
                />
              </div>
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase">
                Erradas
              </span>
            </div>

            {/* BLOCO BRANCO */}
            <div className="flex flex-col items-center">
              <div className="relative w-full">
                <div className="absolute left-0 top-0 bottom-0 w-10 md:w-12 bg-blue-500 rounded-l-2xl flex items-center justify-center">
                  <HelpCircle size={16} className="text-white" />
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  value={blank}
                  onChange={(e) => handleBlankChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  className="w-full pl-10 md:pl-12 px-3 md:px-4 py-2.5 md:py-3 h-12 md:h-14 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl outline-none text-center font-black text-2xl md:text-3xl text-blue-700 dark:text-blue-300 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="0"
                />
              </div>
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase">
                Branco
              </span>
            </div>
          </div>
        </div>

        {/* Card 8 - Páginas Lidas */}
        <div className="md:col-span-4 lg:col-span-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 lg:p-8 transition-colors duration-300 flex flex-col">
          <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 md:mb-2 flex items-center gap-1">
            <BookOpen size={14} className="text-emerald-500" /> Páginas Lidas
          </label>
          <div className="relative flex-1 flex items-center">
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              value={pages}
              onChange={(e) => handlePagesChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="w-full px-3 sm:px-4 md:px-3 py-2.5 sm:py-3 md:py-3 h-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-emerald-500 text-sm md:text-base text-gray-900 dark:text-white transition-colors"
              placeholder="Quantidade"
            />
          </div>
        </div>

        {/* Card 9 - Observações */}
        <div className="md:col-span-8 lg:col-span-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 lg:p-8 transition-colors duration-300 flex flex-col">
          <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 md:mb-2 flex items-center gap-1">
            <FileText size={14} className="text-emerald-500" /> Observações
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 sm:px-4 md:px-3 py-2.5 sm:py-3 md:py-3 h-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm md:text-base text-gray-900 dark:text-white focus:border-emerald-500 transition-colors"
            placeholder="Ex: Art. 5º, Inciso XI..."
          />
        </div>

        {/* Ações de salvar — divisão 50/50 */}
        <div className="md:col-span-12 flex justify-center px-0">
          <div className="w-full max-w-2xl flex flex-col gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={handleSubmitAndNew}
                disabled={!isDateValid}
                variant="outline"
                fullWidth
                size="lg"
                leftIcon={<Plus size={20} />}
                className="py-3 md:py-4 px-4 md:px-5 font-bold min-h-[52px] border-2 border-cyan-500 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar e criar novo
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isDateValid}
                variant="primary"
                fullWidth
                size="lg"
                leftIcon={<Save size={20} />}
                className="py-3 md:py-4 px-4 md:px-5 font-bold min-h-[52px] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar registro
              </Button>
            </div>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 px-1">
              <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                Criar novo
              </span>{" "}
              mantém matéria, subtópico, tipo e data.{" "}
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Salvar registro
              </span>{" "}
              limpa o formulário.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
