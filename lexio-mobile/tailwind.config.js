/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // HTML 루트
    "./src/**/*.{js,ts,jsx,tsx}", // 모든 JS/TS/JSX/TSX 파일에서 클래스 탐지
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
