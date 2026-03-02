import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        minas: {
          verde: '#C9DF8C',    // Verde Principal
          dark: '#273338',     // Cinza Escuro (Fundo)
          menta: '#4D9773',    // Verde Menta (Ações/Sucesso)
          titulo: '#1E4848',   // Verde Escuro (Títulos)
          chart: '#3D3D3D',    // Fundo de Gráfico/Cards
        },
      },
    },
  },
  plugins: [],
};
export default config;