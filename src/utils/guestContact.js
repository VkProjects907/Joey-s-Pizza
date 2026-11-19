const GUEST_CONTACT_KEY = "joeys-pizza:guest-contact:v1";

export function clearGuestContact() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(GUEST_CONTACT_KEY);
  } catch {
    // Session storage is optional; a storage failure must not block ordering.
  }
}
