import AuthGuard from "@/components/auth/AuthGuard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm flex flex-col gap-3">
          <div className="bg-black border border-zinc-800 rounded-lg p-10 flex flex-col items-center">
            <h1 className="font-serif text-3xl font-semibold mb-8 tracking-wider">
              Instagram
            </h1>
            {children}
          </div>

          {/* Simple footer frame for switching auth type */}
          <div className="bg-black border border-zinc-800 rounded-lg p-6 text-center text-sm text-zinc-400">
            Сделано для демонстрации клона Instagram.
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
