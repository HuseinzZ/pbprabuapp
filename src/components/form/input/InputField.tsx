import React from "react";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: boolean;
  success?: boolean;
  hint?: string;
  icon?: React.ReactNode;
}

export default function InputField({ className = "", error, success, hint, icon, ...props }: InputProps) {
  let borderClass = "border-gray-300 focus:border-brand-500 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-500";
  if (error) borderClass = "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500 dark:focus:border-red-500";
  else if (success) borderClass = "border-green-500 focus:border-green-500 focus:ring-green-500/20 dark:border-green-500 dark:focus:border-green-500";

  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {icon}
        </div>
      )}
      <input
        className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${borderClass} ${icon ? "pl-9" : ""} ${className}`}
        {...props}
      />
      {hint && (
        <p className={`mt-1.5 text-xs ${error ? "text-red-500" : success ? "text-green-500" : "text-gray-500 dark:text-gray-400"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}
