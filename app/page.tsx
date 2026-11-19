import { HomePath } from "@/components/home-path";
import { homeData } from "@/lib/home";

export const dynamic = "force-dynamic";

// Home: the sendero (owner's choice, 2026-11-18). One round stop per lesson on a winding path, units as banners,
// Mushroom beside the next lesson. Later lessons show their number, never a lock: she can open any lesson.
export default function Home() {
  return <HomePath d={homeData()} />;
}
