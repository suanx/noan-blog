"use client";

import { useState, useEffect } from "react";

export default function Toast({ message, type = "error", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success"
    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800"
    : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";

  return (
    <div className={`fixed bottom-4 right-4 z-50 rounded-lg border px-4 py-3 shadow-lg ${bgColor}`}>
      <p className="text-sm">{message}</p>
    </div>
  );
}
