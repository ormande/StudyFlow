export type UserSettingsProfile = {
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
  cpf_cnpj?: string | null;
  terms_accepted?: boolean | null;
  terms_accepted_at?: string | null;
};

export type UserMetadataProfile = {
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  cpf_cnpj?: string;
  terms_accepted?: boolean;
  terms_accepted_at?: string;
};

/** Campos de perfil em user_settings que ainda estão vazios mas existem nos metadados do auth. */
export function getMissingProfileFields(
  settings: UserSettingsProfile | null | undefined,
  metadata: UserMetadataProfile | null | undefined
): Partial<UserSettingsProfile> {
  const meta = metadata || {};
  const current = settings || {};
  const updates: Partial<UserSettingsProfile> = {};

  if (!current.first_name?.trim() && meta.first_name?.trim()) {
    updates.first_name = meta.first_name.trim();
  }
  if (!current.last_name?.trim() && meta.last_name?.trim()) {
    updates.last_name = meta.last_name.trim();
  }
  if (!current.birth_date && meta.birth_date) {
    updates.birth_date = meta.birth_date;
  }
  if (!current.cpf_cnpj?.trim() && meta.cpf_cnpj) {
    updates.cpf_cnpj = meta.cpf_cnpj.replace(/\D/g, "");
  }
  if (!current.terms_accepted && meta.terms_accepted) {
    updates.terms_accepted = true;
    updates.terms_accepted_at =
      meta.terms_accepted_at || new Date().toISOString();
  }

  return updates;
}

export function mergeProfileWithMetadata(
  settings: UserSettingsProfile | null | undefined,
  metadata: UserMetadataProfile | null | undefined
): UserSettingsProfile {
  return { ...(settings || {}), ...getMissingProfileFields(settings, metadata) };
}
