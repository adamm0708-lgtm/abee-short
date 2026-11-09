import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ABEE SHORTS | Drama & Short Film",
  description: "Katalog film pendek dan drama dari sumber resmi."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
