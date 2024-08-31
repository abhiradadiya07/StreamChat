import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import NavBar from "@/components/layout/NavBar";
import Container from "@/components/layout/Container";
import SocketProvider from "@/provider/SocketProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stream Chat",
  description:
    "A video chat app in which user can video chat with anyone who is online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <SocketProvider>
            <main className="min-h-screen flex flex-col bg-secondary">
              <NavBar />
              <Container>{children}</Container>
            </main>
          </SocketProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
