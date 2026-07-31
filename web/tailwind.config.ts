import type { Config } from "tailwindcss";

// Bảng màu lấy từ Brand Guideline HPU (tr.10): Cobalt Blue.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        hpu: {
          DEFAULT: "var(--hpu-primary)",
          primary: "var(--hpu-primary)",     // #168FCC — chủ đạo
          dark: "var(--hpu-primary-dark)",   // #0087C3 — bổ trợ tối
          light: "var(--hpu-primary-light)", // #94CBEE — bổ trợ sáng
          tint: "var(--hpu-primary-tint)",   // nền bong bóng bot
          bg: "var(--hpu-bg)",               // nền trang
          surface: "var(--hpu-surface)",     // khung trắng (bong bóng bot, thẻ)
          accent: "var(--hpu-accent)",       // đỏ cho hành động phủ định (xóa, 👎)
          ink: "var(--hpu-ink)",
          muted: "var(--hpu-muted)",
          border: "var(--hpu-border)",
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
