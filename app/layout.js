import localFont from "next/font/local";
import "./globals.css";

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

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${playfairDisplay.variable}`}>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('torch-live-theme');document.documentElement.setAttribute('data-theme',s==='dark'||s==='light'?s:window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}catch(e){}})();` }} />
        {children}
      </body>
    </html>
  );
}
