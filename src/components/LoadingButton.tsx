import type { ButtonHTMLAttributes, ReactNode } from "react";

type LoadingButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
  leadingIcon?: ReactNode;
};

export default function LoadingButton({
  children,
  loading = false,
  loadingText,
  leadingIcon,
  className = "",
  disabled,
  ...rest
}: LoadingButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center ${className}`.trim()}
    >
      {loading ? (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        leadingIcon
      )}
      {loading ? loadingText || children : children}
    </button>
  );
}
