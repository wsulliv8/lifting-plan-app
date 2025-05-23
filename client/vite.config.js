import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync("../server/server.key"),
      cert: fs.readFileSync("../server/server.cert"),
    },
    port: 5173,
  },
});
