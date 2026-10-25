import { AuthFlowProvider } from "@/features/auth/state/AuthFlowContext";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthFlowProvider>{children}</AuthFlowProvider>;
}
