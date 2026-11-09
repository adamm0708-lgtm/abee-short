import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ABEE SHORTS & ABEE NEWS | Film, Drama, Berita Bangil",
  description: "ABEE SHORTS untuk film dan drama, ABEE NEWS untuk kabar Bangil, Pasuruan, Jawa Timur, dan berita pilihan."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
