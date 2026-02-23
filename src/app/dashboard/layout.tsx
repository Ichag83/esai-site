import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-sm">Creative Brain BR</span>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/dashboard/creatives"
                className="text-gray-600 hover:text-gray-900"
              >
                Criativos
              </Link>
              <Link
                href="/dashboard/patterns"
                className="text-gray-600 hover:text-gray-900"
              >
                Patterns
              </Link>
              <Link
                href="/dashboard/generate"
                className="text-gray-600 hover:text-gray-900"
              >
                Gerar
              </Link>
            </nav>
          </div>
          <SignOutButton />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
