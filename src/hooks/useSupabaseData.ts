import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Subject, StudyLog, UserStats } from "../types";
import { useToast } from "../contexts/ToastContext";
import {
  getMissingProfileFields,
  mergeProfileWithMetadata,
} from "../utils/syncProfileFromMetadata";
import {
  SUBJECT_SELECT,
  mapSubjectRow,
} from "../utils/subjectMapper";
import { Subtopic } from "../types";
import { withValidSession } from "../lib/sessionGuard";
import {
  normalizeLogDate,
  getLogDateRangeFilter,
  getCycleStartDateString,
  isLogInCurrentCycle,
} from "../utils/dateUtils";

// ✅ FUNÇÃO DE VALIDAÇÃO - Garante que números nunca sejam negativos
const sanitizeNumber = (
  value: number | undefined | null,
  defaultValue = 0
): number => {
  if (value === undefined || value === null || isNaN(value))
    return defaultValue;
  return Math.max(0, Math.floor(value)); // Nunca negativo, sempre inteiro
};

const mapLogRow = (l: Record<string, unknown>): StudyLog => ({
  id: l.id as string,
  subjectId: l.subject_id as string,
  subtopicId: (l.subtopic_id as string | null) ?? undefined,
  type: l.type as StudyLog["type"],
  date: normalizeLogDate(l.date as string),
  hours: sanitizeNumber(l.hours as number),
  minutes: sanitizeNumber(l.minutes as number),
  seconds: sanitizeNumber(l.seconds as number),
  pages: sanitizeNumber(l.pages as number),
  correct: sanitizeNumber(l.correct as number),
  wrong: sanitizeNumber(l.wrong as number),
  blank: sanitizeNumber(l.blank as number),
  notes: (l.notes as string) ?? "",
  timestamp: (l.timestamp as number) ?? Date.now(),
  subject: (l.subjects as { name?: string } | null)?.name,
  subtopic: (l.subtopics as { name?: string } | null)?.name,
});

// Constante de paginação
const LOGS_PER_PAGE = 20;
const CYCLE_LOGS_LIMIT = 5000;

type SearchStudyLogsRow = {
  id: string;
  subject_id: string | null;
  subtopic_id: string | null;
  type: string;
  hours: number | null;
  minutes: number | null;
  seconds: number | null;
  pages: number | null;
  correct: number | null;
  wrong: number | null;
  blank: number | null;
  notes: string | null;
  date: string;
  timestamp: number | null;
  created_at: string;
  subject_name: string | null;
  subject_color: string | null;
  subtopic_name: string | null;
};

type UserSubscriptionRow = {
  status: "none" | "trial" | "active" | "cancelled" | null;
  plan_type: "monthly" | "lifetime" | null;
  trial_ends_at: string | null;
  next_billing_date: string | null;
};

const applySubscriptionState = (
  subData: UserSubscriptionRow | null,
  setSubscriptionType: (value: "monthly" | "lifetime" | null) => void,
  setSubscriptionStatus: (value: "active" | "cancelled" | "trial" | null) => void,
  setTrialEndsAt: (value: string | null) => void,
  setNextBillingDate: (value: string | null) => void
) => {
  setSubscriptionType(subData?.plan_type || null);
  setSubscriptionStatus(
    subData?.status === "none" ? null : (subData?.status as "active" | "cancelled" | "trial" | null)
  );
  setTrialEndsAt(subData?.trial_ends_at || null);
  setNextBillingDate(subData?.next_billing_date || null);
};

export function useSupabaseData(session: any) {
  const { addToast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [cycleLogs, setCycleLogs] = useState<StudyLog[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [lastStudyDate, setLastStudyDate] = useState<string | null>(null);
  const [cycleStartDate, setCycleStartDate] = useState<number>(Date.now());
  const [dailyGoal, setDailyGoal] = useState<number>(0);
  const [showPerformance, setShowPerformance] = useState<boolean>(true);
  const [welcomeSeen, setWelcomeSeen] = useState<boolean>(true); // Padrão true para não mostrar modal enquanto carrega
  const [subscriptionType, setSubscriptionType] = useState<
    "monthly" | "lifetime" | null
  >(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    "active" | "cancelled" | "trial" | null
  >(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [hasMoreLogs, setHasMoreLogs] = useState<boolean>(true);
  const [loadingMoreLogs, setLoadingMoreLogs] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [daysFilter, setDaysFilter] = useState<number | null>(30); // Padrão: 30 dias
  const daysFilterRef = useRef(daysFilter);
  const cycleStartDateRef = useRef(cycleStartDate);

  // Ref para evitar múltiplas chamadas simultâneas de fetchData
  const isFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    daysFilterRef.current = daysFilter;
  }, [daysFilter]);

  useEffect(() => {
    cycleStartDateRef.current = cycleStartDate;
  }, [cycleStartDate]);

  const subjectsRef = useRef<Subject[]>([]);
  useEffect(() => {
    subjectsRef.current = subjects;
  }, [subjects]);

  const fetchSubjectsOnly = useCallback(async () => {
    if (!session?.user?.id) return;

    const { data: subData, error: subError } = await supabase
      .from("subjects")
      .select(SUBJECT_SELECT)
      .eq("user_id", session.user.id)
      .order("position");

    if (subError) {
      console.error("Erro matérias:", subError);
      addToast(
        "Erro ao carregar matérias. Detalhe: " + subError.message,
        "error"
      );
      return;
    }

    const mappedSubjects = (subData || []).map((s: Record<string, unknown>) =>
      mapSubjectRow(s, sanitizeNumber)
    );
    setSubjects(mappedSubjects);
  }, [session?.user?.id, addToast]);

  const fetchSubscriptionOnly = useCallback(async () => {
    if (!session?.user?.id) return null;

    const { data: subData, error: subError } = await supabase
      .from("user_subscriptions")
      .select("status, plan_type, trial_ends_at, next_billing_date")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .returns<UserSubscriptionRow>();

    if (subError) {
      console.error("Erro assinatura:", subError);
      addToast(
        "Erro ao carregar assinatura. Detalhe: " + subError.message,
        "error"
      );
      return null;
    }

    applySubscriptionState(
      subData ?? null,
      setSubscriptionType,
      setSubscriptionStatus,
      setTrialEndsAt,
      setNextBillingDate
    );

    return subData ?? null;
  }, [session?.user?.id, addToast]);

  const fetchSettingsOnly = useCallback(async () => {
    if (!session?.user?.id) return;

    const { data: settingsData, error: settingsError } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (settingsError) {
      console.error("Erro configurações:", settingsError);
      addToast(
        "Erro ao carregar configurações. Detalhe: " + settingsError.message,
        "error"
      );
      return;
    }

    if (!settingsData) return;

    setCycleStartDate(settingsData.cycle_start_date || Date.now());
    setDailyGoal(sanitizeNumber(settingsData.daily_goal));
    setShowPerformance(settingsData.show_performance ?? true);
    setWelcomeSeen(settingsData.welcome_seen ?? false);

    await fetchSubscriptionOnly();
  }, [session?.user?.id, addToast, fetchSubscriptionOnly]);

  const fetchStatsOnly = useCallback(async () => {
    if (!session?.user?.id) return;

    const { data: statsData, error: statsError } = await supabase.rpc(
      "get_user_stats",
      {
        p_user_id: session.user.id,
      }
    );

    if (statsError) {
      console.error("Erro ao carregar estatísticas:", statsError);
      addToast(
        "Erro ao carregar estatísticas. Detalhe: " + statsError.message,
        "error"
      );
      return;
    }

    if (statsData) {
      setStats(statsData as UserStats);
    }
  }, [session?.user?.id, addToast]);

  /** Todos os logs do ciclo atual (sem paginação — usa log.date). */
  const fetchCycleLogs = useCallback(async () => {
    if (!session?.user?.id) return;

    const fromDate = getCycleStartDateString(cycleStartDateRef.current);

    try {
      const { data, error } = await supabase
        .from("study_logs")
        .select("*, subjects(name, color), subtopics(name)")
        .eq("user_id", session.user.id)
        .gte("date", fromDate)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(CYCLE_LOGS_LIMIT);

      if (error) {
        console.error("Erro ao carregar logs do ciclo:", error);
        return;
      }

      setCycleLogs((data || []).map(mapLogRow));
    } catch (error) {
      console.error("Erro ao carregar logs do ciclo:", error);
    }
  }, [session?.user?.id]);

  const refreshLogsOnly = useCallback(async () => {
    if (!session?.user?.id) return;
    const activeSearch = searchTerm.trim();
    if (activeSearch) {
      await fetchLogs(0, 100, activeSearch, daysFilter);
    } else {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      await fetchLogs(0, LOGS_PER_PAGE, "", daysFilter);
    }
  }, [session?.user?.id, searchTerm, daysFilter]);

  const fetchStreak = useCallback(async () => {
    if (!session?.user?.id) return;

    const { data, error } = await supabase.rpc("get_streak", {
      p_user_id: session.user.id,
    });

    if (error) {
      console.error("Erro ao carregar streak:", error);
      addToast(
        "Erro ao carregar ofensiva. Detalhe: " + error.message,
        "error"
      );
      return;
    }

    if (data) {
      const streakData = data as {
        current_streak: number;
        longest_streak: number;
        last_study_date: string | null;
      };
      setCurrentStreak(streakData.current_streak ?? 0);
      setLongestStreak(streakData.longest_streak ?? 0);
      setLastStudyDate(streakData.last_study_date ?? null);
    }
  }, [session?.user?.id, addToast]);
  // 1. FUNÇÃO DE CARREGAR DADOS (extraída para useCallback)
  const fetchData = useCallback(async () => {
    if (!session?.user?.id) {
      return;
    }

    // Evitar múltiplas chamadas simultâneas
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setLoadingData(true);
    try {
      // --- CARREGAR MATÉRIAS ---
      const { data: subData, error: subError } = await supabase
        .from("subjects")
        .select(SUBJECT_SELECT)
        .order("position");

      if (subError) {
        console.error("Erro matérias:", subError);
        addToast(
          "Erro ao carregar dados. Detalhe: " + subError.message,
          "error"
        );
      }

      const mappedSubjects = (subData || []).map((s: Record<string, unknown>) =>
        mapSubjectRow(s, sanitizeNumber)
      );
      setSubjects(mappedSubjects);

      // --- CARREGAR ESTATÍSTICAS AGREGADAS (Server-Side Aggregation) ---
      // Usa RPC para calcular totais no servidor, evitando transferir todos os logs
      const { data: statsData, error: statsError } = await supabase.rpc(
        "get_user_stats",
        {
          p_user_id: session.user.id,
        }
      );

      if (statsError) {
        console.error("Erro ao carregar estatísticas:", statsError);
        addToast(
          "Erro ao carregar estatísticas. Detalhe: " + statsError.message,
          "error"
        );
      } else if (statsData) {
        setStats(statsData as UserStats);
      }

      // --- CARREGAR STREAK (RPC no servidor) ---
      await fetchStreak();

      // --- CARREGAR LOGS COMPLETOS (Paginação inicial) ---
      // Busca apenas os primeiros 20 registros para carregamento rápido
      // Mais registros podem ser carregados sob demanda via loadMoreLogs
      await fetchLogs(0, LOGS_PER_PAGE, "", daysFilterRef.current);

      // --- CARREGAR CONFIGURAÇÕES ---
      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (settingsError) {
        console.error("Erro configurações:", settingsError);
        addToast(
          "Erro ao carregar dados. Detalhe: " + settingsError.message,
          "error"
        );
      }

      if (settingsData) {
        const metadata = session.user.user_metadata || {};
        const profileBackfill = getMissingProfileFields(settingsData, metadata);

        if (Object.keys(profileBackfill).length > 0) {
          const { error: backfillError } = await supabase
            .from("user_settings")
            .update(profileBackfill)
            .eq("user_id", session.user.id);

          if (backfillError) {
            console.error(
              "Erro ao sincronizar perfil dos metadados:",
              backfillError
            );
          }
        }

        setCycleStartDate(settingsData.cycle_start_date || Date.now());
        setDailyGoal(sanitizeNumber(settingsData.daily_goal));
        setShowPerformance(settingsData.show_performance ?? true);
        setWelcomeSeen(settingsData.welcome_seen ?? false);

        // Assinatura agora vem do cofre novo
        const { data: subData, error: subError } = await supabase
          .from("user_subscriptions")
          .select("status, plan_type, trial_ends_at, next_billing_date")
          .eq("user_id", session.user.id)
          .maybeSingle()
          .returns<UserSubscriptionRow>();

        if (subError) {
          console.error("Erro assinatura:", subError);
          addToast(
            "Erro ao carregar assinatura. Detalhe: " + subError.message,
            "error"
          );
        } else if (subData) {
          applySubscriptionState(
            subData,
            setSubscriptionType,
            setSubscriptionStatus,
            setTrialEndsAt,
            setNextBillingDate
          );

          // Trial de 7 dias: aplicado somente em user_subscriptions
          if (subData.status === "none" && !subData.trial_ends_at) {
            const trialEndDate = new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString();

            supabase
              .from("user_subscriptions")
              .update({
                status: "trial",
                trial_ends_at: trialEndDate,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", session.user.id)
              .then(({ error }) => {
                if (!error) {
                  setSubscriptionStatus("trial");
                  setTrialEndsAt(trialEndDate);
                }
              });
          } else if (subData.status === "none" && subData.trial_ends_at) {
            supabase
              .from("user_subscriptions")
              .update({
                status: "trial",
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", session.user.id)
              .then(({ error }) => {
                if (!error) {
                  setSubscriptionStatus("trial");
                }
              });
          }
        }
      } else {
        // Se não existir, cria agora usando upsert para evitar erro 409
        const trialEndDate = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString();
        const metadata = session.user.user_metadata || {};
        const profileFields = mergeProfileWithMetadata(null, metadata);
        const { error: insertError } = await supabase
          .from("user_settings")
          .upsert(
            [
              {
                user_id: session.user.id,
                first_name: profileFields.first_name || null,
                last_name: profileFields.last_name || null,
                birth_date: profileFields.birth_date || null,
                cpf_cnpj: profileFields.cpf_cnpj || null,
                terms_accepted: profileFields.terms_accepted ?? false,
                terms_accepted_at: profileFields.terms_accepted_at || null,
                cycle_start_date: Date.now(),
                daily_goal: 0,
                show_performance: true,
                tutorial_completed: false,
              },
            ],
            {
              onConflict: "user_id",
            }
          );

        if (insertError) {
          console.error("Erro ao criar configurações:", insertError);
          addToast(
            "Erro ao criar configurações. Detalhe: " + insertError.message,
            "error"
          );
        } else {
          // Se por algum motivo a linha de assinatura não existir, cria aqui.
          const { error: subInsertError } = await supabase
            .from("user_subscriptions")
            .upsert(
              {
                user_id: session.user.id,
                status: "trial",
                trial_ends_at: trialEndDate,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );

          if (subInsertError) {
            console.error("Erro ao criar assinatura:", subInsertError);
            addToast(
              "Erro ao criar assinatura. Detalhe: " + subInsertError.message,
              "error"
            );
          } else {
            setSubscriptionStatus("trial");
            setTrialEndsAt(trialEndDate);
          }
        }
      }
    } catch (error: any) {
      console.error("Erro geral ao carregar dados:", error);
      // Só mostrar toast se não for erro de rede temporário ou se for erro crítico
      const errorMessage = error?.message || "Erro desconhecido";
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError")
      ) {
        // Erro de rede - não mostrar toast para não incomodar o usuário
        console.warn(
          "Erro de rede ao carregar dados. Tentando novamente silenciosamente..."
        );
      } else {
        addToast("Erro ao carregar dados. Detalhe: " + errorMessage, "error");
      }
    } finally {
      setLoadingData(false);
      isFetchingRef.current = false;
    }
  }, [session?.user?.id, fetchStreak]);

  // 2. CARREGAR DADOS INICIAIS
  useEffect(() => {
    if (!session?.user?.id) return;
    fetchData();
  }, [session?.user?.id, fetchData]);

  // Recarregar logs completos do ciclo quando o ciclo inicia/reinicia
  useEffect(() => {
    if (!session?.user?.id || loadingData) return;
    fetchCycleLogs();
  }, [session?.user?.id, cycleStartDate, loadingData, fetchCycleLogs]);

  // 3. REALTIME: sincronizar entre abas/dispositivos via Supabase Realtime
  useEffect(() => {
    if (!session?.user?.id) return;

    let debounceTimer: number | null = null;
    const pending = {
      subjects: false,
      logs: false,
      settings: false,
      stats: false,
      streak: false,
    };

    const scheduleRefresh = (what: keyof typeof pending) => {
      pending[what] = true;
      if (debounceTimer) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(async () => {
        const run = { ...pending };
        pending.subjects = false;
        pending.logs = false;
        pending.settings = false;
        pending.stats = false;
        pending.streak = false;

        // Ordem: manter UI consistente
        if (run.subjects) await fetchSubjectsOnly();
        if (run.settings) await fetchSettingsOnly();
        if (run.logs) {
          await refreshLogsOnly();
          await fetchCycleLogs();
        }
        if (run.stats) await fetchStatsOnly();
        if (run.streak) await fetchStreak();
      }, 300);
    };

    const channel = supabase
      .channel(`studyflow-sync-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "study_logs",
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          scheduleRefresh("logs");
          scheduleRefresh("stats");
          scheduleRefresh("streak");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subjects",
          filter: `user_id=eq.${session.user.id}`,
        },
        () => scheduleRefresh("subjects")
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_settings",
          filter: `user_id=eq.${session.user.id}`,
        },
        () => scheduleRefresh("settings")
      )
      // subtopics não tem user_id — filtrar no client usando subject_id do payload
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subtopics",
        },
        (payload: any) => {
          const subjectId =
            payload?.new?.subject_id ??
            payload?.old?.subject_id ??
            payload?.record?.subject_id ??
            null;

          if (!subjectId) return;
          const belongsToUser = subjectsRef.current.some((s) => s.id === subjectId);
          if (belongsToUser) scheduleRefresh("subjects");
        }
      )
      .subscribe();

    return () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [
    session?.user?.id,
    fetchSubjectsOnly,
    fetchSettingsOnly,
    fetchStatsOnly,
    refreshLogsOnly,
    fetchStreak,
  ]);

  // --- FUNÇÕES DE MATÉRIAS ---
  const addSubject = async (subject: Omit<Subject, "id">) => {
    if (!session?.user) return;
    try {
      // ✅ CORRIGIDO: Removida duplicação de goal_minutes + validação
      const newSubject = {
        user_id: session.user.id,
        name: subject.name,
        goal_minutes: sanitizeNumber(subject.goalMinutes),
        color: subject.color,
        position: subjects.length,
      };

      const { data, error } = await supabase
        .from("subjects")
        .insert([newSubject])
        .select()
        .single();
      if (error) throw error;

      // Adiciona localmente já traduzido
      const mappedSubject = {
        ...data,
        goalMinutes: sanitizeNumber(data.goal_minutes),
        subtopics: [],
      };
      setSubjects([...subjects, mappedSubject]);

    } catch (error: any) {
      console.error("Erro ao adicionar matéria:", error);
      addToast(
        "Erro ao criar matéria. Detalhe: " +
          (error?.message || "Erro desconhecido"),
        "error"
      );
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
      setSubjects(subjects.filter((s) => s.id !== id));

    } catch (error: any) {
      console.error(error);
      addToast(
        "Erro ao excluir matéria. Detalhe: " +
          (error?.message || "Erro desconhecido"),
        "error"
      );
    }
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    try {
      const { subtopics, goalMinutes, ...otherFields } = updates;

      // Prepara objeto para o banco (snake_case) com validação
      const dbUpdates: any = { ...otherFields };
      if (goalMinutes !== undefined) {
        dbUpdates.goal_minutes = sanitizeNumber(goalMinutes);
      }

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from("subjects")
          .update(dbUpdates)
          .eq("id", id);
        if (error) throw error;
      }

      // Se subtópicos foram atualizados, salvar no banco
      if (subtopics !== undefined) {
        // Buscar subtópicos existentes no banco
        const { data: existingSubtopics } = await supabase
          .from("subtopics")
          .select("id")
          .eq("subject_id", id);

        const existingIds = new Set(
          (existingSubtopics || []).map((st: any) => st.id)
        );
        const newIds = new Set(subtopics.map((st) => st.id));

        // Deletar subtópicos que foram removidos
        const toDelete = Array.from(existingIds).filter(
          (id) => !newIds.has(id)
        );
        if (toDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("subtopics")
            .delete()
            .in("id", toDelete);
          if (deleteError) throw deleteError;
        }

        // Inserir/atualizar subtópicos
        const subtopicsToUpsert = subtopics.map((st, index) => ({
          id: st.id,
          subject_id: id,
          name: st.name,
          completed: st.completed || false,
          position: index,
        }));

        if (subtopicsToUpsert.length > 0) {
          const { error: upsertError } = await supabase
            .from("subtopics")
            .upsert(subtopicsToUpsert, { onConflict: "id" });
          if (upsertError) throw upsertError;
        }
      }

      // Atualiza estado local com valor validado
      const validatedUpdates = { ...updates };
      if (goalMinutes !== undefined) {
        validatedUpdates.goalMinutes = sanitizeNumber(goalMinutes);
      }
      setSubjects(
        subjects.map((s) => (s.id === id ? { ...s, ...validatedUpdates } : s))
      );

    } catch (error: any) {
      console.error(error);
      addToast(
        "Erro ao atualizar matéria. Detalhe: " +
          (error?.message || "Erro desconhecido"),
        "error"
      );
    }
  };

  const addSubtopic = async (
    subjectId: string,
    name: string
  ): Promise<Subtopic | null> => {
    if (!session?.user?.id) return null;

    try {
      const subject = subjectsRef.current.find((s) => s.id === subjectId);
      const position = subject?.subtopics.length ?? 0;

      const { data, error } = await supabase
        .from("subtopics")
        .insert({
          subject_id: subjectId,
          name: name.trim(),
          completed: false,
          position,
        })
        .select("id, name, completed")
        .single();

      if (error) throw error;

      const newSubtopic: Subtopic = {
        id: data.id,
        name: data.name,
        completed: data.completed ?? false,
      };

      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId
            ? { ...s, subtopics: [...s.subtopics, newSubtopic] }
            : s
        )
      );

      return newSubtopic;
    } catch (error: any) {
      console.error("Erro ao adicionar subtópico:", error);
      addToast(
        "Erro ao adicionar subtópico. Detalhe: " +
          (error?.message || "Erro desconhecido"),
        "error"
      );
      throw error;
    }
  };

  const reorderSubjects = async (newSubjects: Subject[]) => {
    setSubjects(newSubjects);
    try {
      for (let i = 0; i < newSubjects.length; i++) {
        const { error } = await supabase
          .from("subjects")
          .update({ position: i })
          .eq("id", newSubjects[i].id);
        if (error) throw error;
      }

    } catch (error: any) {
      console.error(error);
      addToast(
        "Erro ao reordenar matérias. Detalhe: " +
          (error?.message || "Erro desconhecido"),
        "error"
      );
    }
  };

  // --- FUNÇÕES DE LOGS ---
  const addLog = async (log: any) => {
    if (!session?.user) return;
    try {
      await withValidSession(async (activeSession) => {
        const dbLog = {
          user_id: activeSession.user.id,
          subject_id: log.subjectId,
          subtopic_id: log.subtopicId || null,
          type: log.type,
          hours: sanitizeNumber(log.hours),
          minutes: sanitizeNumber(log.minutes),
          seconds: sanitizeNumber(log.seconds),
          pages: sanitizeNumber(log.pages),
          correct: sanitizeNumber(log.correct),
          wrong: sanitizeNumber(log.wrong),
          blank: sanitizeNumber(log.blank),
          notes: log.notes,
          date: normalizeLogDate(log.date),
          timestamp: log.timestamp || Date.now(),
        };

        const { data, error } = await supabase
          .from("study_logs")
          .insert([dbLog])
          .select("*, subtopics(name)")
          .single();
        if (error) {
          throw error;
        }

        const newLocalLog = mapLogRow(data as Record<string, unknown>);
        if (log.subtopic && !newLocalLog.subtopic) {
          newLocalLog.subtopic = log.subtopic;
        }
        setLogs([newLocalLog, ...logs]);

        if (isLogInCurrentCycle(newLocalLog, cycleStartDateRef.current)) {
          setCycleLogs((prev) => [newLocalLog, ...prev]);
        }

        const { data: updatedStats } = await supabase.rpc("get_user_stats", {
          p_user_id: activeSession.user.id,
        });
        if (updatedStats) {
          setStats(updatedStats as UserStats);
        }

        await fetchStreak();
      });
    } catch (error: any) {
      console.error("Erro ao salvar log:", error);
      const message = error?.message || "Erro desconhecido";
      addToast(
        message.includes("Sessão expirada")
          ? "Sua sessão expirou. Faça login novamente para salvar o registro."
          : "Erro ao registrar estudo. Detalhe: " + message,
        "error"
      );
    }
  };

  const deleteLog = async (id: string) => {
    if (!session?.user) return;
    try {
      await withValidSession(async (activeSession) => {
        const { error } = await supabase.from("study_logs").delete().eq("id", id);
        if (error) throw error;
        setLogs(logs.filter((l) => l.id !== id));
        setCycleLogs((prev) => prev.filter((l) => l.id !== id));

        const { data: updatedStats } = await supabase.rpc("get_user_stats", {
          p_user_id: activeSession.user.id,
        });
        if (updatedStats) {
          setStats(updatedStats as UserStats);
        }

        await fetchStreak();
      });
    } catch (error: any) {
      console.error(error);
      addToast(
        "Erro ao excluir registro de estudo. Detalhe: " +
          (error?.message || "Erro desconhecido"),
        "error"
      );
    }
  };

  const editLog = async (id: string, updates: Partial<StudyLog>) => {
    if (!session?.user) return;
    try {
      await withValidSession(async (activeSession) => {
        const sanitizedUpdates: any = { ...updates };
        if (updates.hours !== undefined)
          sanitizedUpdates.hours = sanitizeNumber(updates.hours);
        if (updates.minutes !== undefined)
          sanitizedUpdates.minutes = sanitizeNumber(updates.minutes);
        if (updates.seconds !== undefined)
          sanitizedUpdates.seconds = sanitizeNumber(updates.seconds);
        if (updates.pages !== undefined)
          sanitizedUpdates.pages = sanitizeNumber(updates.pages);
        if (updates.correct !== undefined)
          sanitizedUpdates.correct = sanitizeNumber(updates.correct);
        if (updates.wrong !== undefined)
          sanitizedUpdates.wrong = sanitizeNumber(updates.wrong);
        if (updates.blank !== undefined)
          sanitizedUpdates.blank = sanitizeNumber(updates.blank);

        const { error } = await supabase
          .from("study_logs")
          .update(sanitizedUpdates)
          .eq("id", id);
        if (error) throw error;
        setLogs(
          logs.map((l) => (l.id === id ? { ...l, ...sanitizedUpdates } : l))
        );
        await fetchCycleLogs();

        const { data: updatedStats } = await supabase.rpc("get_user_stats", {
          p_user_id: activeSession.user.id,
        });
        if (updatedStats) {
          setStats(updatedStats as UserStats);
        }

        await fetchStreak();
      });
    } catch (error: any) {
      console.error(error);
      addToast(
        "Erro ao editar registro de estudo. Detalhe: " +
          (error?.message || "Erro desconhecido"),
        "error"
      );
    }
  };

  const updateSettings = async (updates: any) => {
    if (!session?.user) return;
    try {
      const dbUpdates: any = {};
      if (updates.cycleStartDate !== undefined)
        dbUpdates.cycle_start_date = updates.cycleStartDate;
      if (updates.dailyGoal !== undefined)
        dbUpdates.daily_goal = sanitizeNumber(updates.dailyGoal);
      if (updates.showPerformance !== undefined)
        dbUpdates.show_performance = updates.showPerformance;
      if (updates.welcomeSeen !== undefined)
        dbUpdates.welcome_seen = updates.welcomeSeen;

      const { error } = await supabase
        .from("user_settings")
        .update(dbUpdates)
        .eq("user_id", session.user.id);
      if (error) throw error;

      if (updates.cycleStartDate !== undefined)
        setCycleStartDate(updates.cycleStartDate);
      if (updates.dailyGoal !== undefined)
        setDailyGoal(sanitizeNumber(updates.dailyGoal));
      if (updates.showPerformance !== undefined)
        setShowPerformance(updates.showPerformance);
      if (updates.welcomeSeen !== undefined)
        setWelcomeSeen(updates.welcomeSeen);

    } catch (error: any) {
      console.error(error);
      addToast(
        "Erro ao atualizar configurações. Detalhe: " +
          (error?.message || "Erro desconhecido"),
        "error"
      );
    }
  };

  // Função central para buscar logs (com suporte a busca, paginação e filtro de data)
  const fetchLogs = async (
    offset: number,
    limit: number,
    term: string,
    days: number | null = null
  ) => {
    if (!session?.user?.id) {
      return;
    }

    const { from: dateFrom, to: dateTo } = getLogDateRangeFilter(days);

    try {
      // CENÁRIO A: Com busca (searchTerm existe)
      if (term && term.trim()) {
        const searchTerm = term.trim();

        const { data: rpcData, error: rpcError } = await supabase
          .rpc("search_study_logs", {
            p_user_id: session.user.id,
            p_term: searchTerm,
            p_days: days,
            p_limit: 100,
            p_offset: 0,
          })
          .returns<SearchStudyLogsRow[]>();

        if (rpcError) {
          console.error("Erro ao buscar logs (RPC):", rpcError);
          addToast(
            "Erro ao buscar registros. Detalhe: " + rpcError.message,
            "error"
          );
          return;
        }

        const rpcRows: SearchStudyLogsRow[] = Array.isArray(rpcData)
          ? rpcData
          : [];

        const mappedLogs = rpcRows.map((l: SearchStudyLogsRow) => ({
          ...l,
          subjectId: l.subject_id ?? "",
          subtopicId: l.subtopic_id ?? undefined,
          date: normalizeLogDate(l.date),
          hours: sanitizeNumber(l.hours ?? 0),
          minutes: sanitizeNumber(l.minutes ?? 0),
          seconds: sanitizeNumber(l.seconds ?? 0),
          pages: sanitizeNumber(l.pages ?? 0),
          correct: sanitizeNumber(l.correct ?? 0),
          wrong: sanitizeNumber(l.wrong ?? 0),
          blank: sanitizeNumber(l.blank ?? 0),
          subject: l.subject_name ?? undefined,
          subtopic: l.subtopic_name ?? undefined,
        })) as unknown as StudyLog[];

        setLogs(mappedLogs);
        setHasMoreLogs(false);
        return;
      }

      // CENÁRIO B: Navegação normal (sem busca)
      let queryNormal = supabase
        .from("study_logs")
        .select("*, subjects(name, color), subtopics(name)")
        .eq("user_id", session.user.id);

      if (dateFrom) {
        queryNormal = queryNormal.gte("date", dateFrom);
      }
      if (dateTo) {
        queryNormal = queryNormal.lte("date", dateTo);
      }

      const { data: logData, error: logError } = await queryNormal
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (logError) {
        console.error("Erro ao buscar logs:", logError);
        addToast(
          "Erro ao buscar registros. Detalhe: " + logError.message,
          "error"
        );
        return;
      }

      // TRADUÇÃO DO BANCO PARA O APP
      const mappedLogs = (logData || []).map(mapLogRow);

      // Atualizar estado baseado no offset
      if (offset === 0) {
        // Substituir logs (carregamento inicial)
        setLogs(mappedLogs);
      } else {
        // Adicionar ao final (paginação)
        setLogs((prev) => [...prev, ...mappedLogs]);
      }

      // Atualizar hasMoreLogs
      setHasMoreLogs(mappedLogs.length === limit);
    } catch (error: any) {
      console.error("Erro ao buscar logs:", error);
      addToast(
        "Erro ao buscar registros. Detalhe: " +
          (error?.message || "Erro desconhecido"),
        "error"
      );
    }
  };

  // Função para carregar mais logs (paginação)
  const loadMoreLogs = async () => {
    if (
      !session?.user?.id ||
      loadingMoreLogs ||
      !hasMoreLogs ||
      searchTerm.trim()
    )
      return;

    setLoadingMoreLogs(true);
    try {
      await fetchLogs(logs.length, LOGS_PER_PAGE, "", daysFilter);
    } finally {
      setLoadingMoreLogs(false);
    }
  };

  // Função para buscar logs (server-side) - estabilizada com useCallback
  const searchLogs = useCallback(
    async (term: string) => {
      // Evitar chamadas desnecessárias quando o termo não mudou
      if (searchTerm === term.trim()) return;

      setSearchTerm(term.trim());
      setLoadingMoreLogs(true);
      try {
        await fetchLogs(0, 100, term.trim(), daysFilter); // Busca retorna até 100 resultados
      } finally {
        setLoadingMoreLogs(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [searchTerm, daysFilter]
  );

  // Função para aplicar filtro de dias (estabilizada com useCallback)
  const applyDaysFilter = useCallback(
    async (days: number | null) => {
      if (daysFilter === days) return; // Evitar chamadas duplicadas
      setDaysFilter(days);
      setLoadingMoreLogs(true);
      try {
        await fetchLogs(0, LOGS_PER_PAGE, searchTerm, days);
      } finally {
        setLoadingMoreLogs(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [daysFilter, searchTerm]
  );

  return {
    subjects,
    logs,
    cycleLogs,
    stats,
    currentStreak,
    longestStreak,
    lastStudyDate,
    cycleStartDate,
    dailyGoal,
    showPerformance,
    welcomeSeen,
    subscriptionType,
    subscriptionStatus,
    trialEndsAt,
    nextBillingDate,
    loadingData,
    hasMoreLogs,
    loadingMoreLogs,
    loadMoreLogs,
    searchLogs,
    searchTerm,
    daysFilter,
    applyDaysFilter,
    addSubject,
    deleteSubject,
    updateSubject,
    addSubtopic,
    reorderSubjects,
    addLog,
    deleteLog,
    editLog,
    updateSettings,
    refreshSubscription: fetchSubscriptionOnly,
  };
}
