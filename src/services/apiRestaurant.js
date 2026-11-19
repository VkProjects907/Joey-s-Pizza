const API_URL = "https://react-fast-pizza-api.jonas.io/api";

export async function getMenu() {
  const res = await fetch(`${API_URL}/menu`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed getting menu");
  const { data } = await res.json();
  return data;
}

export async function getOrder(accessToken) {
  const res = await fetch(`/api/orders/${encodeURIComponent(accessToken)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Couldn't find this order");
  const { data } = await res.json();
  return data;
}

export async function createOrder(newOrder) {
  const res = await fetch("/api/orders", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newOrder),
    cache: "no-store",
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Failed creating your order");
  return result;
}

export async function updateOrder(accessToken, updateObj) {
  const res = await fetch(`/api/orders/${encodeURIComponent(accessToken)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateObj),
    cache: "no-store",
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Failed updating your order");
  return result.data;
}
