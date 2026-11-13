import type { Metadata, Viewport } from "next";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Vores Formue",
  description: "Emil og Frederikkes private økonomi, fra i dag til 2035.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  appleWebApp: { capable: true, title: "Vores Formue", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b1026" },
    { media: "(prefers-color-scheme: light)", color: "#f6f3ec" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Sætter valgt tema før første paint, så siden ikke blinker
const themeScript = `try{var t=localStorage.getItem("vf-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="da" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="relative min-h-dvh">
        <a href="#indhold" className="cta sr-only px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50">
          Spring til indhold
        </a>
        <Providers>
          <Nav />
          <div id="indhold" className="relative z-10 pb-[var(--bottom-nav)]">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
