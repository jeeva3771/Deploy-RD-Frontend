import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import logo from "../../public/logo.svg";
import { getAllowedSidebarRoutes } from "./SidebarRoutes";
import { getAllControlTowerDepts } from "../reducer/controlTowerReducer";
import './sidebar.css';
import Logo from "./Logo";

const normalize = (p) => (typeof p !== "string" ? "" : p.split(/[?#]/)[0].replace(/:([^/]+)/g, "").replace(/\/+$/, ""));
const startsWithSegment = (current, base) => {
  if (!base) return false;
  const c = normalize(current);
  const b = normalize(base);
  return c === b || c.startsWith((b.endsWith("/") ? b : b + "/"));
};
const isActive = (route, currentPath) => {
  const current = normalize(currentPath);
  const matchers = Array.isArray(route?.match) ? route.match : [];
  if (route?.exact) {
    return matchers.length > 0 ? matchers.some((m) => normalize(m) === current) : normalize(route?.path) === current;
  }
  return matchers.length > 0 ? matchers.some((m) => startsWithSegment(current, m)) : startsWithSegment(current, route?.path);
};

const SidebarItem = React.memo(({ route, active, onClick }) => (
  <div
    className={`sidebar-menu-item ${active ? "sidebar-item-active" : ""} ${route.locked ? "sidebar-locked-item" : ""}`}
    onClick={onClick}
  >
    <div className="sidebar-item-content">
      {route.icon && (
        <i className={`${route.icon} sidebar-item-icon`} />
      )}
      <span className="sidebar-item-text">
        {route.label}
        {route.locked && " (Locked)"}
      </span>
    </div>
  </div>
));

const NestedSidebarGroup = React.memo(({ route, currentPath, navigate }) => {
  const parentActive = isActive(route, currentPath) || (route.children || []).some((c) => isActive(c, currentPath));
  const [open, setOpen] = React.useState(parentActive);

  React.useEffect(() => {
    if (parentActive) setOpen(true);
  }, [parentActive]);

  return (
    <div>
      <div
        className={`sidebar-menu-item sidebar-parent-item ${parentActive ? "sidebar-parent-active" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="sidebar-item-content">
          {route.icon && (
            <i className={`${route.icon} sidebar-item-icon`} />
          )}
          <span className="sidebar-item-text">{route.label}</span>
        </div>
        <i className={`fa-solid fa-chevron-down sidebar-chevron ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <div className="sidebar-submenu">
          {(route.children || []).map((child, idx) => {
            const childActive = isActive(child, currentPath);
            return (
              <div
                key={idx}
                className={`sidebar-submenu-item ${childActive ? "sidebar-submenu-active" : ""}`}
                onClick={() => navigate(child.path)}
              >
                {child.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

const SidebarGroup = React.memo(({ route, currentPath, navigate, open, onToggle }) => {
  const checkNestedActive = (children) => {
    if (!children) return false;
    return children.some(child => {
      if (isActive(child, currentPath)) return true;
      if (child.children) return checkNestedActive(child.children);
      return false;
    });
  };

  const parentActive = isActive(route, currentPath) || checkNestedActive(route.children);

  return (
    <div>
      <div
        className={`sidebar-menu-item sidebar-parent-item ${parentActive ? "sidebar-item-active" : ""}`}
        onClick={onToggle}
      >
        <div className="sidebar-item-content">
          {route.icon && (
            <i className={`${route.icon} sidebar-item-icon`} />
          )}
          <span className="sidebar-item-text">{route.label}</span>
        </div>
        <i className={`fa-solid fa-chevron-down sidebar-chevron ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <div className="sidebar-submenu">
          {(route.children || []).map((child, idx) => {
            const childActive = isActive(child, currentPath);
            const hasChildren = Array.isArray(child.children) && child.children.length > 0;
            return hasChildren ? (
              <NestedSidebarGroup
                key={idx}
                route={child}
                currentPath={currentPath}
                navigate={navigate}
              />
            ) : (
              <div
                key={idx}
                className={`sidebar-submenu-item ${childActive ? "sidebar-submenu-active" : ""}`}
                onClick={() => navigate(child.path)}
              >
                {child.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

const AppSidebar = ({ isOpen, toggleSidebar = () => { } }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { depts } = useSelector(state => state.controlTower);

  React.useEffect(() => {
    if (isAuthenticated) {
      dispatch(getAllControlTowerDepts());
    }
  }, [dispatch, isAuthenticated]);

  const sidebarRoutes = React.useMemo(() => getAllowedSidebarRoutes(depts), [depts]);
  const [openParentIndex, setOpenParentIndex] = React.useState(null);

  // Group routes by section if they have a 'section' property
  const groupedRoutes = React.useMemo(() => {
    const groups = {};
    sidebarRoutes.forEach(route => {
      const section = route.section || 'main';
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(route);
    });
    return groups;
  }, [sidebarRoutes]);

  const renderRoutes = (routes, startIndex = 0) => {
    return routes.map((route, index) => {
      const actualIndex = startIndex + index;
      const active = isActive(route, currentPath);
      const hasChildren = Array.isArray(route.children) && route.children.length > 0;

      return hasChildren ? (
        <SidebarGroup
          key={actualIndex}
          route={route}
          currentPath={currentPath}
          navigate={(path) => {
            toggleSidebar();
            navigate(path);
          }}
          open={openParentIndex === actualIndex}
          onToggle={() => setOpenParentIndex(openParentIndex === actualIndex ? null : actualIndex)}
        />
      ) : (
        <SidebarItem
          key={actualIndex}
          route={route}
          active={active}
          onClick={() => {
            if (!route.locked) {
              toggleSidebar();
              navigate(route.path);
            }
          }}
        />
      );
    });
  };

  return (
    <>
      {/* Overlay for mobile - shown when sidebar is open */}
      {isOpen && (
        <div
          className="sidebar-overlay lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar with Gradient */}
      <div
        className={`sidebar-container sidebar-gradient-container ${isOpen ? "translate-x-0" : ""
          }`}
      >
        {/* Logo Section */}
        <div className="sidebar-header">
          {/* Desktop: Centered logo */}
          <div className="hidden lg:flex justify-center items-center" style={{ width: '100%' }}>
            <div className="">
              {/* <img
                src={logo}
                alt="EnquiryPro"
                className="sidebar-logo"
              /> */}
              <Logo />
            </div>
          </div>

          {/* Mobile: Logo with close button */}
          <div className="flex lg:hidden justify-between items-center" style={{ width: '100%' }}>
            <div className="sidebar-logo-wrapper">
              <img
                src={logo}
                alt="EnquiryPro"
                className="sidebar-logo"
              />
            </div>
            <button
              onClick={toggleSidebar}
              className="sidebar-close-btn"
              aria-label="Close Sidebar"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="sidebar-content">
          <div className="sidebar-menu space-y-1">
            {/* Render routes based on sections if available */}
            {groupedRoutes.main && renderRoutes(groupedRoutes.main, 0)}

            {/* Render workflow section if exists */}
            {groupedRoutes.workflow && (
              <>
                <div className="sidebar-section-header">Workflow</div>
                {renderRoutes(groupedRoutes.workflow, groupedRoutes.main?.length || 0)}
              </>
            )}

            {/* Render settings section with divider if exists */}
            {groupedRoutes.settings && (
              <div className="sidebar-divider">
                {renderRoutes(groupedRoutes.settings, (groupedRoutes.main?.length || 0) + (groupedRoutes.workflow?.length || 0))}
              </div>
            )}

            {/* Fallback: render all routes without grouping if no sections defined */}
            {!groupedRoutes.main && !groupedRoutes.workflow && !groupedRoutes.settings &&
              renderRoutes(sidebarRoutes, 0)
            }
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(AppSidebar);