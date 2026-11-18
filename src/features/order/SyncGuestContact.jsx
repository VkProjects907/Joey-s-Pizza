"use client";

import { useEffect } from "react";
import { saveGuestContact } from "../../utils/guestContact";

export default function SyncGuestContact({ customer }) {
  useEffect(() => {
    if (customer) saveGuestContact(customer);
  }, [customer]);

  return null;
}
