import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "../globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Login — App Llamadas Admin",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={geist.className}>{children}</body>
    </html>
  );
}
