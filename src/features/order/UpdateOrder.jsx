"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Button from "../../ui/Button";
import { updateOrder } from "../../services/apiRestaurant";

function UpdateOrder({ orderId }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleUpdate() {
    try {
      setIsLoading(true);

      await updateOrder(orderId, { priority: true });

      router.refresh();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="text-right">
      <Button type="primary" onClick={handleUpdate} disabled={isLoading}>
        {isLoading ? "Updating..." : "Make priority"}
      </Button>
    </div>
  );
}

export default UpdateOrder;
