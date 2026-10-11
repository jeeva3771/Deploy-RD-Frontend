import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppBreadcrumb } from "./index";
import Cookies from "js-cookie";
import { usePriorityColors } from "../context/PriorityColorContext";

const AppHeader = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState("light");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [user, setUser] = useState({
    name: "",
    avatar:
      "https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-portrait-176256935.jpg",
  });
  const wrapperRef = useRef(null);
  const { priorityColors } = usePriorityColors();
  const location = useLocation();
  const [legendOpen, setLegendOpen] = useState(false);

  const visibleRoutes = ["/enquiries", "/designerenquiry", "/accounts", "/sampleorder", "/productionorder", "/quotation", "/dtp-studio", "/operation-planning", "/shopfloor/laser-cutting", "/shopfloor/qc", "/shopfloor/store", "/shopfloor/packing"];

  const showPriorityLegend = visibleRoutes.some((route) =>
    location.pathname.startsWith(route)
  );
  console.log("PATH:", location.pathname);
  console.log("SHOW LEGEND:", showPriorityLegend);

  // Initialize theme and user
  useEffect(() => {
    const initializeTheme = () => {
      const userData = JSON.parse(localStorage.getItem("user"));
      const savedTheme = localStorage.getItem("preferred_theme");
      const userTheme = userData?.preferred_theme;
      const theme = savedTheme || userTheme || "light";

      setCurrentTheme(theme);
      applyTheme(theme);
    };

    initializeTheme();

    const decodeJwt = (token) => {
      if (!token) return null;
      try {
        const [, base64Payload] = token.split(".");
        let base64 = base64Payload.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const decoded = atob(base64);
        return JSON.parse(decoded);
      } catch (err) {
        console.error("Failed to decode JWT:", err);
        return null;
      }
    };

    // const authData = Cookies.get("auth");
    const authData = localStorage.getItem('user')
    if (authData) {
      try {
        // const parsed = JSON.parse(authData);
        const token = localStorage.getItem('token')
        if (token) {
          const decoded = decodeJwt(token);
          if (decoded) {
            setUser({
              name: decoded.name || "User",
              avatar:
                decoded.image ||
                "https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-portrait-176256935.jpg",
            });
          }
        }
      } catch (err) {
        console.error("Auth cookie parse error:", err);
      }
    }
  }, []);

  // Detect click outside dropdown (but not inside)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-bs-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);

    if (theme === "dark") {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
    } else {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
    }

    localStorage.setItem("preferred_theme", theme);
  }

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setLegendOpen(false);
      }
    };

    if (legendOpen) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [legendOpen]);

  const handleThemeToggle = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
    applyTheme(newTheme);
  };

  const logout = (e) => {
    e.stopPropagation();
    localStorage.clear();
    Cookies.remove("auth");
    window.location.href = "/";
  };

  return (
    <header className="app-header" style={{ position: 'relative', zIndex: 49 }}>
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 mr-4 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        aria-label="Toggle Sidebar"
      >
        <i className="fas fa-bars text-xl"></i>
      </button>

      <div className="flex items-center space-x-4">
        {/* <AppBreadcrumb /> */}
      </div>

      <div className="header-actions">
        {/* ===== Priority Legend ===== */}

        {showPriorityLegend && (
          <div className="relative">
            {/* ---------- Trigger Button ---------- */}
            <button
              type="button"
              onClick={() => setLegendOpen((o) => !o)}
              className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium
                  transition-colors duration-200
                  bg-gray-100 dark:bg-gray-800
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-200 dark:hover:bg-gray-700
                  sm:gap-2 sm:px-3 sm:text-sm
                `}
              aria-label="Priority Legend"
            >
              <i className="fas fa-info-circle"></i>
              <span className="hidden sm:inline">Priority Legend</span>
            </button>

            {/* ---------- Dropdown Pop-over ---------- */}
            {legendOpen && (
              <>
                {/* Backdrop (only behind the pop-over) */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLegendOpen(false)}
                />

                {/* Card – always anchored under the button */}
                <div
                  className={`
                      absolute right-0 top-full mt-2 z-50
                      w-64 max-w-[90vw]
                      bg-white dark:bg-gray-900
                      rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700
                      p-4
                      transition-all duration-300 ease-out
                      ${legendOpen
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 -translate-y-2 pointer-events-none"
                    }
                      legend-dropdown-responsive
                    `}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Priority Legend
                    </h3>
                    <button
                      type="button"
                      onClick={() => setLegendOpen(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      aria-label="Close"
                    >
                      <i className="fas fa-times text-lg"></i>
                    </button>
                  </div>

                  {/* Items */}
                  <div className="space-y-2.5">
                    {/* Overdue item */}
                    <div className="flex items-center gap-3 text-xs sm:text-sm">
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: "#dc2626" }}
                      />
                      <span className="font-medium text-gray-700 dark:text-gray-300 italic">
                        Past End Date (Overdue)
                      </span>
                    </div>

                    {priorityColors?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 text-xs sm:text-sm"
                      >
                        <span
                          className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: item.priority.color }}
                        />
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {item.priority.days_from}–{item.priority.days_to === 9999 ? "More " : item.priority.days_to} Days ({item.name})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== Theme Toggle ===== */}
        {/* <div className="theme-toggle-container">
          <div className="theme-toggle-wrapper">
            <div
              className={`theme-toggle-switch ${
                currentTheme === "dark"
                  ? "theme-toggle-dark"
                  : "theme-toggle-light"
              }`}
              onClick={handleThemeToggle}
            >
              <div className="theme-toggle-track">
                <div className="theme-toggle-icons">
                  <div className="theme-icon theme-icon-sun">
                    <i className="fas fa-sun"></i>
                  </div>
                  <div className="theme-icon theme-icon-moon">
                    <i className="fas fa-moon"></i>
                  </div>
                </div>
                <div className="theme-toggle-thumb">
                  <div className="theme-toggle-thumb-icon">
                    {currentTheme === "light" ? (
                      <i className="fas fa-sun">L</i>
                    ) : (
                      <i className="fas fa-moon">D</i>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div> */}

        {/* ===== Profile Section ===== */}
        <div ref={wrapperRef} className="relative">
          <div
            className="profile-section capitalize"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          >
            <img
              src={user.avatar}
              className="profile-avatar"
              alt="User Avatar"
            />
            <div className="profile-info">
              <div className="profile-name">{user.name}</div>
            </div>
            <i className="fa-solid fa-chevron-down profile-chevron"></i>
          </div>

          {profileDropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-content">
                <span
                  className="dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation(); // stay open if needed
                    navigate("/user-profile");
                  }}
                >
                  <i className="fa-solid fa-user dropdown-icon"></i>
                  My Profile
                </span>

                <hr className="dropdown-divider" />

                <span
                  className="dropdown-item"
                  onClick={(e) => {
                    logout(e);
                  }}
                >
                  <i className="fa-solid fa-right-from-bracket dropdown-icon"></i>
                  Logout
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
