"use client";

import * as React from "react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-2 rounded-lg hover:bg-[#1B2A4A] dark:hover:bg-[#1B2A4A] hover:bg-opacity-80 transition-colors flex items-center justify-center"
      title="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <svg
          className="absolute inset-0 w-5 h-5 text-[#E8EDF5] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <svg
          className="absolute inset-0 w-5 h-5 text-[#E8EDF5] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </div>
    </button>
  )
}
