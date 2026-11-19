import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { TabBar } from "@/components/tab-bar";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "Camino con Mushroom",
  description: "Serena's Spanish course: short lessons, then a quiz.",
  appleWebApp: { capable: true, title: "Camino", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fcf9f3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${jakarta.variable} ${inter.variable}`}>
      <body className="antialiased">
        {/* phone-width column; on desktop it sits centred on the plaster */}
        <div className="mx-auto min-h-dvh w-full max-w-[30rem]">{children}</div>
        <TabBar />
      </body>
    </html>
  );
}
