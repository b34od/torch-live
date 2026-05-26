export default function manifest() {
  return {
    name: "TORCH Live",
    short_name: "TORCH Live",
    description: "Live operations app for Torch Leadership Academy",
    start_url: "/login",
    display: "standalone",
    background_color: "#f1f1f1",
    theme_color: "#ed6767",
    icons: [
      {
        src: "/icons/torch-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
