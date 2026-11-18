"use client";

import { useEffect, useState } from "react";

function getSecondsLeft(deliveryAt) {
  return Math.max(0, Math.ceil((new Date(deliveryAt).getTime() - Date.now()) / 1000));
}

export default function LiveCountdown({ deliveryAt }) {
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    const update = () => setSecondsLeft(getSecondsLeft(deliveryAt));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [deliveryAt]);

  if (secondsLeft === null) return <span>Calculating delivery time...</span>;
  if (secondsLeft === 0) return <span>Your order should have arrived</span>;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return <span>About {minutes}:{String(seconds).padStart(2, "0")} left</span>;
}
