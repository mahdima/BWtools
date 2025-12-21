"use client";

import { useEffect } from "react";
import { logout } from "@/app/logout/actions";

const LogoutPage = () => {
  useEffect(() => {
    logout();
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Logging out...</h1>
      <p>Please wait while we sign you out.</p>
    </div>
  );
};

export default LogoutPage;
