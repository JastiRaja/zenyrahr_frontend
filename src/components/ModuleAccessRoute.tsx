import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import useOrganizationMenuSettings, {
  type ModuleFlag,
} from "../hooks/useOrganizationMenuSettings";

type ModuleAccessRouteProps = {
  children: ReactNode;
  requiredFlags: ModuleFlag[];
  match?: "all" | "any";
  loadingMessage?: string;
  fallbackPath?: string;
};

export default function ModuleAccessRoute({
  children,
  requiredFlags,
  match = "all",
  loadingMessage = "Loading module access...",
  fallbackPath = "/unauthorized",
}: ModuleAccessRouteProps) {
  const { isAuthenticated } = useAuth();
  const { menuSettings, loading } = useOrganizationMenuSettings();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl rounded-md border border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500 shadow-sm">
        {loadingMessage}
      </div>
    );
  }

  if (requiredFlags.length === 0) {
    return <>{children}</>;
  }

  const result =
    match === "any"
      ? requiredFlags.some((flag) => menuSettings[flag])
      : requiredFlags.every((flag) => menuSettings[flag]);

  if (!result) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
