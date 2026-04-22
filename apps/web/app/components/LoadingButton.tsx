"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
};

const LoadingButton = ({
  isLoading = false,
  loadingText,
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}: LoadingButtonProps) => {
  return (
    <button
      type={type}
      className={className}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {isLoading && (
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
            aria-hidden="true"
          />
        )}
        <span>{isLoading ? loadingText ?? children : children}</span>
      </span>
    </button>
  );
};

export default LoadingButton;
