"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

import Button from "../../ui/Button";
import { updateName } from "./userSlice";
import { useNavigationLoading } from "../../ui/NavigationLoadingProvider";

function CreateUser() {
  const [username, setUsername] = useState("");

  const dispatch = useDispatch();
  const router = useRouter();

  const { startNavigation } = useNavigationLoading();

  function handleSubmit(e) {
    e.preventDefault();

    if (!username.trim()) return;

    dispatch(updateName(username.trim()));

    startNavigation();
    router.push("/menu");
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-sm text-stone-600 md:text-base">
        👋 Welcome! Please start by telling us your name:
      </p>

      <input
        type="text"
        placeholder="Your full name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="input mb-8 w-72"
        required
      />

      {username.trim() !== "" && (
        <div>
          <Button type="primary">Start ordering</Button>
        </div>
      )}
    </form>
  );
}

export default CreateUser;
