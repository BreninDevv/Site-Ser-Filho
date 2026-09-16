import type { Metadata, Viewport } from "next";
import { Montserrat, Open_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ser Filho",
  description:
    "Site da igreja Ser Filho — células, testemunhos e Encontro De Volta ao Jardim.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  appleWebApp: {
    title: "Ser Filho",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${openSans.variable} ${montserrat.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full min-w-0 flex-col overflow-x-clip">
        {children}
      </body>
    </html>
  );
}