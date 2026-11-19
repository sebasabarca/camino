"use client";
import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-8 flex w-full flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="password" className="sr-only">Contraseña</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder="Contraseña"
        className="card min-h-16 w-full px-5 text-[19px] font-semibold text-espresso outline-none placeholder:font-normal placeholder:text-pebble focus:border-terra"
      />
      {error && <p role="alert" className="text-[15px] leading-[22px] text-terra-deep">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="pill w-full bg-terra-deep text-white shadow-[inset_0_-3px_0_#7a2a0c] active:translate-y-0.5 active:shadow-none disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
