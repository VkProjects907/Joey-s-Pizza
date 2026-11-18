const GUEST_CONTACT_KEY = "joeys-pizza:guest-contact:v1";
const CONTACT_FIELDS = ["name", "phone", "address", "email"];

export function readGuestContact() {
  if (typeof window === "undefined") return null;

  try {
    const value = JSON.parse(window.sessionStorage.getItem(GUEST_CONTACT_KEY) || "null");
    if (!value || typeof value !== "object") return null;
    return Object.fromEntries(
      CONTACT_FIELDS.map((field) => [field, typeof value[field] === "string" ? value[field] : ""]),
    );
  } catch {
    return null;
  }
}

export function saveGuestContact(contact) {
  if (typeof window === "undefined") return;

  try {
    const value = Object.fromEntries(
      CONTACT_FIELDS.map((field) => [field, String(contact?.[field] ?? "")]),
    );
    window.sessionStorage.setItem(GUEST_CONTACT_KEY, JSON.stringify(value));
  } catch {
    // Session-only convenience is optional; order saving must still work if storage is unavailable.
  }
}
