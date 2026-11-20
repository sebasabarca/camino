import { Mushroom } from "@/components/mushroom";
import { safeNext } from "@/lib/login-guard";
import { LoginForm } from "./form";

export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="flex min-h-dvh flex-col items-center px-5 pt-[max(env(safe-area-inset-top),3rem)]">
      <Mushroom mood="friendly" size={140} priority />
      <h1 className="mt-3 text-[28px] font-extrabold leading-9 tracking-[-0.02em] text-espresso">Camino con Mushroom</h1>
      <p className="mt-1 text-[16px] leading-6 text-pebble">Escribe tu contraseña. Solo la primera vez.</p>
      <LoginForm next={safeNext(next)} />
    </div>
  );
}
