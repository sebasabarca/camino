import Image from "next/image";

export type Mood = "friendly" | "teaching" | "thinking" | "curious" | "excited" | "proud" | "oops" | "listening";

const ALT: Record<Mood, string> = {
  friendly: "Mushroom waves",
  teaching: "Mushroom explains",
  thinking: "Mushroom thinks",
  curious: "Mushroom looks curious",
  excited: "Mushroom cheers",
  proud: "Mushroom looks proud",
  oops: "Mushroom flops down, unbothered",
  listening: "Mushroom listens",
};

/** The cut-out dachshund. Sits on the plaster with no frame; size is the rendered square. */
export function Mushroom({ mood = "friendly", size = 88, className = "", priority, style }: { mood?: Mood; size?: number; className?: string; priority?: boolean; style?: React.CSSProperties }) {
  return (
    <Image
      src={`/mushroom/${mood}.png`}
      alt={ALT[mood]}
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 select-none drop-shadow-[0_6px_10px_rgba(44,34,30,0.12)] ${className}`}
      draggable={false}
      style={style}
    />
  );
}

/** Mushroom with his speech balloon; the tail points back at him. */
export function MushroomSays({ mood = "friendly", children, size = 84 }: { mood?: Mood; children: React.ReactNode; size?: number }) {
  return (
    <div className="flex items-end gap-2">
      <Mushroom mood={mood} size={size} />
      <div className="relative mb-3 min-w-0 flex-1 rounded-[1.25rem] bg-white px-4 py-3 text-[15px] leading-[22px] text-espresso shadow-[var(--shadow-lift)]">
        <span
          aria-hidden
          className="absolute -left-[7px] bottom-4 h-4 w-4 rotate-45 rounded-[3px] bg-white"
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
