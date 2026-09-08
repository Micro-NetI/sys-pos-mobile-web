//app\layout.tsx
import type {
  Metadata,
} from "next";

import "./globals.css";

import POSMobileToastProvider from
  "@/app/components/pos/mensagens/POSMobileToastProvider";

export const metadata: Metadata = {
  title: {
    default: "SysPOS Mobile",
    template: "%s | SysPOS Mobile",
  },
  description:
    "Sistema POS Mobile MicroNet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body>
        {children}

        <POSMobileToastProvider />
      </body>
    </html>
  );
}