import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "../utils/awsConfig";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wavelength",
  description: "Time-limited social media platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Geist, sans-serif" }} className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}