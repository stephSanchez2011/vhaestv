import type { Metadata } from "next";
import { Fraunces, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const brand = Fraunces({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const display = Source_Sans_3({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "ShareMyReq — partage de requêtes HTTP pour la formation",
  description:
    "L’apprenant partage un lien. Le formateur voit headers, status et body — avec versions après retex.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${brand.variable} ${display.variable} ${mono.variable} antialiased`}
      >
        <div className="shell">
          <header className="site-header">
            <Link href="/" className="brand">
              Share<span>My</span>Req
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/demo" className="nav-link">
                Démo
              </Link>
              <Link href="/new" className="nav-link">
                Nouveau partage
              </Link>
            </nav>
          </header>
          <main className="pb-16">{children}</main>
        </div>
      </body>
    </html>
  );
}
