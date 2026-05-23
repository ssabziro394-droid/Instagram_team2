import AuthGuard from "@/components/auth/AuthGuard";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="flex items-center justify-center gap-8 max-w-[800px] w-full animate-fade-in">
          {/* Left Side: Mockup Image (hidden on mobile, visible on desktop) */}
          <div className="hidden md:block relative w-[380px] h-[580px] flex-shrink-0">
              <Image
                src="/instagram_phones_mockup.png"
                alt="Instagram Mockup Phones"
                fill
                sizes="(max-width: 768px) 100vw, 380px"
                className="object-contain"
                priority
              />
          </div>

          {/* Right Side: Form and Swapper */}
          <div className="w-full max-w-[350px] flex flex-col gap-3">
            {children}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
