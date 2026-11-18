import type { Metadata } from "next";

import Providers from "./Providers";
import AppLayout from "../ui/AppLayout";
import NavigationLoadingProvider from "../ui/NavigationLoadingProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Joey's Pizza",
  description: "Fresh pizza, made for you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <NavigationLoadingProvider>
            <AppLayout>{children}</AppLayout>
          </NavigationLoadingProvider>
        </Providers>
      </body>
    </html>
  );
}
