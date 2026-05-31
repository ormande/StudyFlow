import { supabase } from "../lib/supabase";

export type UserSubscriptionSnapshot = {
  status: "none" | "trial" | "active" | "cancelled" | null;
  plan_type: "monthly" | "lifetime" | null;
  trial_ends_at: string | null;
  next_billing_date: string | null;
};

export async function fetchUserSubscription(
  userId: string
): Promise<UserSubscriptionSnapshot | null> {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("status, plan_type, trial_ends_at, next_billing_date")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserSubscriptionSnapshot | null;
}

/** Aguarda webhook gravar status active (polling ~1,5s, até ~10s). */
export async function waitForActiveSubscription(
  userId: string,
  options?: { intervalMs?: number; maxAttempts?: number }
): Promise<UserSubscriptionSnapshot | null> {
  const intervalMs = options?.intervalMs ?? 1500;
  const maxAttempts = options?.maxAttempts ?? 7;

  let latest: UserSubscriptionSnapshot | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    latest = await fetchUserSubscription(userId);
    if (latest?.status === "active") {
      return latest;
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  return latest;
}

export async function confirmSubscriptionAfterPayment(
  userId: string | undefined
): Promise<UserSubscriptionSnapshot | null> {
  if (!userId) return null;
  return waitForActiveSubscription(userId);
}
