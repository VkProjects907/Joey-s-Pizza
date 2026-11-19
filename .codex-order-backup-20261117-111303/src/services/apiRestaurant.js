const API_URL = "https://react-fast-pizza-api.jonas.io/api";

export async function getMenu() {
  const res = await fetch(`${API_URL}/menu`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed getting menu");
  }

  const { data } = await res.json();
  return data;
}

export async function getOrder(id) {
  const res = await fetch(`${API_URL}/order/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Couldn't find order #${id}`);
  }

  const { data } = await res.json();
  return data;
}

export async function createOrder(newOrder) {
  try {
    const res = await fetch(`${API_URL}/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newOrder),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Order creation failed");
    }

    const { data } = await res.json();
    return data;
  } catch {
    throw new Error("Failed creating your order");
  }
}

export async function updateOrder(id, updateObj) {
  try {
    const res = await fetch(`${API_URL}/order/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateObj),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Order update failed");
    }
  } catch {
    throw new Error("Failed updating your order");
  }
}
