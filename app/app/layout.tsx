import type {Metadata} from "next";
import "./globals.css";

export const metadata: Metadata = {
  icons: {
    icon: [
      {url: "/favicon.ico", sizes: "any"},
      {url: "/favicon-512.png", type: "image/png", sizes: "512x512"},
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
