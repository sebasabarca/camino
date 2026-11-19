"use server";
import { revalidatePath } from "next/cache";
import { setReportStatus } from "@/lib/db";
import { isOwner } from "@/lib/owner";

/** Owner only: a report that needs no course change (her answer was wrong, or a duplicate). */
export async function setReport(id: number, status: "open" | "dismissed") {
  if (!(await isOwner()) || !Number.isInteger(id) || !["open", "dismissed"].includes(status)) return;
  setReportStatus(id, status);
  revalidatePath("/admin");
}
