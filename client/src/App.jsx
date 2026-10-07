import { Router, useLocation } from "./router";
import { Navbar, Footer } from "./components/Layout";
import { ToastProvider } from "./components/Toast";
import Home from "./pages/Home";
import DonorRegister from "./pages/DonorRegister";
import DonorLogin from "./pages/DonorLogin";
import DonorProfile from "./pages/DonorProfile";
import DonorNotFound from "./pages/DonorNotFound";
import RequestBlood from "./pages/RequestBlood";
import RequestStatus from "./pages/RequestStatus";
import RequestHistory from "./pages/RequestHistory";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const routes = {
  "/": Home,
  "/register": DonorRegister,
  "/login": DonorLogin,
  "/profile": DonorProfile,
  "/donor-not-found": DonorNotFound,
  "/request-blood": RequestBlood,
  "/request-status": RequestStatus,
  "/request-history": RequestHistory,
  "/admin-login": AdminLogin,
  "/admin": Admin,
};

function Pages() {
  const { path } = useLocation();
  const Page = routes[path] || NotFound;
  if (path === "/admin") {
    return (
      <main id="main" tabIndex={-1}>
        <Page />
      </main>
    );
  }
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} key={path}>
        <Page />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <Pages />
      </ToastProvider>
    </Router>
  );
}
