import { headers } from "next/headers";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('torch-live-theme');document.documentElement.setAttribute('data-theme',s==='dark'||s==='light'?s:window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}catch(e){}})();`;

const poppins = localFont({
  variable: "--font-poppins",
  src: [
    {
      path: "./fonts/Poppins-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Poppins-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Poppins-Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],
});

const playfairDisplay = localFont({
  variable: "--font-playfair-display",
  src: [
    {
      path: "./fonts/PlayfairDisplay-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/PlayfairDisplay-Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],
});

export const metadata = {
  title: {
    default: "TORCH Live",
    template: "%s | TORCH Live",
  },
  description: "Torch Leadership Academy live operations app",
  icons: {
    icon: "/icons/torch-icon.png",
    apple: "/icons/torch-icon.png",
  },
};

export default async function RootLayout({ children }) {
  const nonce = (await headers()).get("x-nonce") || undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${playfairDisplay.variable}`}>
        <Script id="theme-init" strategy="beforeInteractive" nonce={nonce}>
          {THEME_INIT_SCRIPT}
        </Script>
        {children}
      </body>
    </html>
  );
}
