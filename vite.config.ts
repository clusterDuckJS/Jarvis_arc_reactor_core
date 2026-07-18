import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const normalizeBasePath = (basePath: string): string => {
  const trimmedBasePath = basePath.trim();

  if (!trimmedBasePath || trimmedBasePath === "/") {
    return "/";
  }

  return `/${trimmedBasePath.replace(/^\/+|\/+$/g, "")}/`;
};

const getGitHubPagesBasePath = (): string => {
  const explicitBasePath = process.env.VITE_BASE_PATH;

  if (explicitBasePath) {
    return normalizeBasePath(explicitBasePath);
  }

  const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];

  if (!repositoryName || repositoryName.endsWith(".github.io")) {
    return "/";
  }

  return normalizeBasePath(repositoryName);
};

export default defineConfig({
  base: getGitHubPagesBasePath(),
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
});
