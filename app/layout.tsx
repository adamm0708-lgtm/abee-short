import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ABEE SHORTS | Short Drama & Film",
  description: "Temukan film pendek dan short drama yang dapat ditonton secara legal."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
