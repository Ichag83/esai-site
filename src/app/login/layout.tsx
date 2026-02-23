// Force dynamic rendering — login page needs Supabase env vars at runtime
export const dynamic = "force-dynamic";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
