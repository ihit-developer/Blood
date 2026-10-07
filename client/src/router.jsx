import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/*
  Tiny hash router (#/path?query).
  Hash URLs mean the Express backend needs no catch-all route:
  it keeps serving /public as before, and refreshing any page just works.
*/

const RouterContext = createContext(null);

function readLocation() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const q = raw.indexOf("?");
  const path = q === -1 ? raw : raw.slice(0, q);
  const search = q === -1 ? "" : raw.slice(q + 1);
  return { path: path || "/", query: new URLSearchParams(search) };
}

export function Router({ children }) {
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    const onChange = () => setLocation(readLocation());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.path]);

  const navigate = useCallback((to, options = {}) => {
    if (options.replace) window.location.replace(`#${to}`);
    else window.location.hash = to;
  }, []);

  const value = useMemo(() => ({ ...location, navigate }), [location, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useLocation() {
  return useContext(RouterContext);
}

export function useNavigate() {
  return useContext(RouterContext).navigate;
}

export function Link({ to, children, ...rest }) {
  return (
    <a href={`#${to}`} {...rest}>
      {children}
    </a>
  );
}

export function NavLink({ to, className = "", children, ...rest }) {
  const { path } = useLocation();
  const active = path === to.split("?")[0];
  return (
    <a
      href={`#${to}`}
      className={`${className}${active ? " active" : ""}`.trim()}
      aria-current={active ? "page" : undefined}
      {...rest}
    >
      {children}
    </a>
  );
}
