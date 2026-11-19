import "server-only";
import { courseState } from "./course";
import type { HomeData } from "@/components/home-path";

export function homeData(): HomeData {
  return courseState();
}
