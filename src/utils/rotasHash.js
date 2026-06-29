const normalizePath = (path = "/") => {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
};

export const getHashPath = (path = "/") => `/#${normalizePath(path)}`;

export const getHashUrl = (path = "/") => {
  if (typeof window === "undefined") {
    return getHashPath(path);
  }

  return `${window.location.origin}${getHashPath(path)}`;
};

export const hashMatchesPath = (path = "/") => {
  if (typeof window === "undefined") return false;

  const normalized = normalizePath(path);
  const hash = window.location.hash || "";

  return (
    hash === `#${normalized}` ||
    hash.startsWith(`#${normalized}?`) ||
    hash.startsWith(`#${normalized}/`)
  );
};
