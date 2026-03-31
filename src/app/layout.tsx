import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FinTech Vault",
  description: "Secure Command Center",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
