import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatLocalDateDisplay,
  getLocalDateString,
  parseLocalDateString,
} from "../utils/dateUtils";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const BASE_CALENDAR_WIDTH = 300;
const BASE_CALENDAR_HEIGHT = 340;
const VIEWPORT_PADDING = 8;
const GAP = 6;

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  placeholder?: string;
  fullWidth?: boolean;
  size?: "sm" | "md";
  variant?: "default" | "muted";
  className?: string;
  id?: string;
  invalid?: boolean;
  "aria-label"?: string;
}

interface PopoverLayout {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "bottom" | "top";
}

function isInRange(date: string, min?: string, max?: string): boolean {
  if (min && date < min) return false;
  if (max && date > max) return false;
  return true;
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getPageZoom(): number {
  const scale = window.visualViewport?.scale;
  return scale && scale > 0 ? scale : 1;
}

function getViewportMetrics() {
  const vv = window.visualViewport;
  return {
    width: vv?.width ?? window.innerWidth,
    height: vv?.height ?? window.innerHeight,
    offsetTop: vv?.offsetTop ?? 0,
    offsetLeft: vv?.offsetLeft ?? 0,
  };
}

function computePopoverLayout(triggerRect: DOMRect): PopoverLayout {
  const zoom = getPageZoom();
  const { width: vpWidth, height: vpHeight, offsetTop, offsetLeft } =
    getViewportMetrics();

  const width = Math.min(
    BASE_CALENDAR_WIDTH / zoom,
    vpWidth - VIEWPORT_PADDING * 2
  );
  const estimatedHeight = Math.min(
    BASE_CALENDAR_HEIGHT / zoom,
    vpHeight - VIEWPORT_PADDING * 2
  );

  const spaceBelow = offsetTop + vpHeight - triggerRect.bottom - GAP;
  const spaceAbove = triggerRect.top - offsetTop - GAP;
  const placement: "bottom" | "top" =
    spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove
      ? "bottom"
      : "top";

  let top =
    placement === "bottom"
      ? triggerRect.bottom + GAP
      : triggerRect.top - estimatedHeight - GAP;

  let left = triggerRect.left;

  const minLeft = offsetLeft + VIEWPORT_PADDING;
  const maxLeft = offsetLeft + vpWidth - width - VIEWPORT_PADDING;
  left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft));

  const minTop = offsetTop + VIEWPORT_PADDING;
  const maxTop = offsetTop + vpHeight - estimatedHeight - VIEWPORT_PADDING;
  top = Math.min(Math.max(top, minTop), Math.max(minTop, maxTop));

  return {
    top,
    left,
    width,
    maxHeight: estimatedHeight,
    placement,
  };
}

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  disabled = false,
  placeholder = "Selecione uma data",
  fullWidth = true,
  size = "md",
  variant = "default",
  className = "",
  id,
  invalid = false,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverLayout, setPopoverLayout] = useState<PopoverLayout | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const pickerId = id ?? generatedId;
  const calendarId = `${pickerId}-calendar`;
  const today = getLocalDateString();

  const initialView = value ? parseLocalDateString(value) : new Date();
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  const close = useCallback(() => setIsOpen(false), []);

  const updatePopoverLayout = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    setPopoverLayout(computePopoverLayout(trigger.getBoundingClientRect()));
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePopoverLayout();
  }, [isOpen, updatePopoverLayout, viewYear, viewMonth]);

  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => updatePopoverLayout();

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    window.visualViewport?.addEventListener("resize", handleReposition);
    window.visualViewport?.addEventListener("scroll", handleReposition);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
      window.visualViewport?.removeEventListener("resize", handleReposition);
      window.visualViewport?.removeEventListener("scroll", handleReposition);
    };
  }, [isOpen, updatePopoverLayout]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        calendarRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen || !value) return;
    const parsed = parseLocalDateString(value);
    setViewYear(parsed.getFullYear());
    setViewMonth(parsed.getMonth());
  }, [isOpen, value]);

  const sizeClasses = {
    sm: "py-2 text-sm",
    md: "py-2.5 sm:py-3 text-sm md:text-base",
  };

  const variantClasses = {
    default: {
      trigger:
        "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
      triggerOpen: "bg-white dark:bg-gray-800",
    },
    muted: {
      trigger:
        "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500",
      triggerOpen: "bg-gray-50 dark:bg-gray-700",
    },
  };

  const displayValue = value ? formatLocalDateDisplay(value) : placeholder;
  const hasValue = Boolean(value);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{ date: string; day: number; inMonth: boolean }> = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({
        date: toDateString(prevYear, prevMonth, day),
        day,
        inMonth: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        date: toDateString(viewYear, viewMonth, day),
        day,
        inMonth: true,
      });
    }

    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({
        date: toDateString(nextYear, nextMonth, day),
        day,
        inMonth: false,
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (date: string) => {
    if (!isInRange(date, min, max)) return;
    onChange(date);
    close();
  };

  const borderClass = invalid
    ? "border-red-500 focus:ring-red-500"
    : isOpen
    ? "border-emerald-500"
    : "";

  const calendarPanel =
    isOpen && popoverLayout ? (
      <motion.div
        ref={calendarRef}
        id={calendarId}
        role="dialog"
        aria-label="Calendário"
        initial={{
          opacity: 0,
          y: popoverLayout.placement === "bottom" ? -6 : 6,
          scale: 0.98,
        }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{
          opacity: 0,
          y: popoverLayout.placement === "bottom" ? -6 : 6,
          scale: 0.98,
        }}
        transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          position: "fixed",
          top: popoverLayout.top,
          left: popoverLayout.left,
          width: popoverLayout.width,
          maxHeight: popoverLayout.maxHeight,
          zIndex: 250,
        }}
        className="overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-1 text-center text-[10px] font-semibold uppercase text-gray-400 dark:text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((cell) => {
              const isSelected = value === cell.date;
              const isToday = today === cell.date;
              const isDisabled = !isInRange(cell.date, min, max);

              return (
                <button
                  key={cell.date}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDate(cell.date)}
                  className={[
                    "aspect-square rounded-lg text-sm transition-colors",
                    isDisabled
                      ? "cursor-not-allowed text-gray-300 dark:text-gray-600"
                      : isSelected
                      ? "bg-emerald-500 font-bold text-white"
                      : isToday
                      ? "font-bold text-emerald-600 ring-1 ring-emerald-500 dark:text-emerald-400"
                      : cell.inMonth
                      ? "text-gray-700 hover:bg-emerald-50 dark:text-gray-200 dark:hover:bg-emerald-900/20"
                      : "text-gray-400 hover:bg-gray-50 dark:text-gray-500 dark:hover:bg-gray-700/40",
                  ].join(" ")}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {isInRange(today, min, max) && (
            <button
              type="button"
              onClick={() => handleSelectDate(today)}
              className="mt-3 w-full rounded-lg py-2 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
            >
              Hoje
            </button>
          )}
      </motion.div>
    ) : null;

  return (
    <div
      ref={containerRef}
      className={`relative ${fullWidth ? "w-full" : ""} ${className}`}
    >
      <button
        ref={triggerRef}
        type="button"
        id={pickerId}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={calendarId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={[
          "relative flex w-full items-center justify-between gap-2 rounded-xl border pl-10 pr-3 transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900",
          "disabled:cursor-not-allowed disabled:opacity-50",
          sizeClasses[size],
          borderClass ||
            (isOpen
              ? `border-emerald-500 ${variantClasses[variant].triggerOpen}`
              : variantClasses[variant].trigger),
        ].join(" ")}
      >
        <Calendar
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />

        <span
          className={`min-w-0 flex-1 truncate text-left ${
            hasValue
              ? "text-gray-900 dark:text-white"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {displayValue}
        </span>
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>{calendarPanel}</AnimatePresence>,
          document.body
        )}
    </div>
  );
};
