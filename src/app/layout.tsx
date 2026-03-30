export const dynamic = "force-dynamic";

import "./globals.css";
import AppHeader from "@/components/AppHeader";

export const metadata = {
  title: 'FinTech Vault',
  description: 'Cloud Loan Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white antialiased min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  )
}
