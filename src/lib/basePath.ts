const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const basePath =
  !configuredBasePath || configuredBasePath === "/"
    ? ""
    : `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`;

export function withBasePath(path: string): string {
  if (!basePath || !path.startsWith("/") || path.startsWith("//")) {
    return path;
  }

  if (path === basePath || path.startsWith(`${basePath}/`)) {
    return path;
  }

  return `${basePath}${path}`;
}
