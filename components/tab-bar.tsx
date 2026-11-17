"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Footprints, UserRound, type LucideIcon } from "lucide-react";

const TABS: { href: string; label: string; icon: LucideIcon; match: (p: string) => boolean }[] = [
  { href: "/", label: "Camino", icon: Footprints, match: (p) => p === "/" || p.startsWith("/unit/") },
  { href: "/repasar", label: "Repasar", icon: BookOpenText, match: (p) => p.startsWith("/repasar") },
  { href: "/yo", label: "Yo", icon: UserRound, match: (p) => p.startsWith("/yo") },
];

/** Bottom navigation. Hidden inside a lesson and on its summary: those screens own the bottom for their one action. */
export function TabBar() {
  const path = usePathname();
  if (path.startsWith("/learn/") || path.startsWith("/session/")) return null;
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[30rem] border-t border-[rgba(74,52,42,0.08)] bg-crema pb-[max(env(safe-area-inset-bottom),0.5rem)]"
    >
      <ul className="grid grid-cols-3">
        {TABS.map((t) => {
          const on = t.match(path);
          const I = t.icon;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className="group flex min-h-16 flex-col items-center justify-center gap-1 pt-2"
              >
                <span className={`grid h-8 w-14 place-items-center rounded-full transition-colors duration-200 ${on ? "bg-terra-wash" : "group-active:bg-crema-mid"}`}>
                  <I className={`size-[22px] ${on ? "text-terra-deep" : "text-pebble"}`} strokeWidth={on ? 2.4 : 2} aria-hidden />
                </span>
                <span className={`font-label text-[12px] ${on ? "font-bold text-terra-deep" : "font-semibold text-pebble"}`}>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
