import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export const metadata: Metadata = {
  title: 'SHADOW-HUNT | Command Center',
  description: 'Autonomous UEBA & Insider Threat Interceptor',
};

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#050a18',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased text-[#e8edf5] min-h-screen">
        {children}
      </body>
    </html>
  );
}
