import { Subject, Subtopic } from "../types";

/** Lista explícita de colunas — evita conflito com a coluna jsonb `subtopics` (pré-migration). */
export const SUBJECT_SELECT = `
  id,
  user_id,
  name,
  goal_minutes,
  color,
  position,
  archived,
  created_at,
  subtopics (
    id,
    name,
    completed,
    position
  )
`;

type SanitizeNumber = (
  value: number | undefined | null,
  defaultValue?: number
) => number;

export function mapSubjectRow(
  row: Record<string, unknown>,
  sanitizeNumber: SanitizeNumber
): Subject {
  const rawSubtopics = row.subtopics;
  const subtopics: Subtopic[] = Array.isArray(rawSubtopics)
    ? [...rawSubtopics]
        .sort(
          (a: { position?: number }, b: { position?: number }) =>
            (a.position ?? 0) - (b.position ?? 0)
        )
        .map((st: { id: string; name: string; completed?: boolean }) => ({
          id: st.id,
          name: st.name,
          completed: st.completed ?? false,
        }))
    : [];

  return {
    id: row.id as string,
    name: row.name as string,
    goalMinutes: sanitizeNumber(row.goal_minutes as number | null | undefined),
    color: (row.color as string) || "",
    subtopics,
  };
}

export function subjectsChangedExternally(
  current: Subject[],
  previous: Subject[]
): boolean {
  if (current.length !== previous.length) return true;

  return current.some((subject, index) => {
    const prev = previous[index];
    if (!prev || subject.id !== prev.id) return true;
    if (subject.subtopics.length !== prev.subtopics.length) return true;

    return subject.subtopics.some(
      (st, stIndex) =>
        st.id !== prev.subtopics[stIndex]?.id ||
        st.name !== prev.subtopics[stIndex]?.name ||
        st.completed !== prev.subtopics[stIndex]?.completed
    );
  });
}
