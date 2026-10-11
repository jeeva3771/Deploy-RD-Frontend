import React from "react";
import { useLocation, useNavigate, matchPath } from "react-router-dom";
import routes from "../routes/routes"; // make sure you have entries like: /users, /users/add, /users/:userId

// ---- helpers: prefer static > dynamic, then longer path first
const sortBySpecificity = (list) =>
  [...list].sort((a, b) => {
    const aDyn = a.path.includes(":") ? 1 : 0;
    const bDyn = b.path.includes(":") ? 1 : 0;
    if (aDyn !== bDyn) return aDyn - bDyn; // static first
    return b.path.length - a.path.length;  // longer first
  });

// exact route name first; if none, fallback to non-exact ancestor
const getRouteName = (pathname, allRoutes) => {
  const sorted = sortBySpecificity(allRoutes);

  // exact match first
  for (const r of sorted) {
    if (matchPath({ path: r.path, end: true }, pathname)) return r.name;
  }

  // fallback partial (for ancestors like /users on /users/add)
  for (const r of sorted) {
    if (matchPath({ path: r.path, end: false }, pathname)) return r.name;
  }

  return null;
};

const buildBreadcrumbs = (fullPath, allRoutes) => {
  const segments = fullPath.split("/").filter(Boolean); // remove empty from leading '/'
  const crumbs = [];
  let acc = "";

  segments.forEach((seg, i) => {
    acc += `/${seg}`;
    const name = getRouteName(acc, allRoutes);
    if (name) {
      crumbs.push({
        pathname: acc,
        name,
        active: i === segments.length - 1,
      });
    }
  });

  return crumbs;
};

const AppBreadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const breadcrumbs = React.useMemo(
    () => buildBreadcrumbs(location.pathname, routes),
    [location.pathname]
  );

  const title = breadcrumbs.at(-1)?.name ?? "";

  return (
    <div className="flex flex-col">
      {breadcrumbs.length > 0 && (
        <>
          {/* Page title from last crumb */}
          <div className="text-xl font-bold text-primary-darkGrey">{title}</div>

          {/* Trail */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
            {breadcrumbs.map((bc, idx) => (
              <React.Fragment key={bc.pathname}>
                {idx > 0 && <i className="fa-solid fa-chevron-right text-xs" />}
                <span
                  className={
                    bc.active
                      ? "text-primary-darkGrey font-medium"
                      : "hover:text-primary-blue cursor-pointer"
                  }
                  onClick={!bc.active ? () => navigate(bc.pathname) : undefined}
                >
                  {bc.name}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </>
      )}
    </div>
  );
};

export default React.memo(AppBreadcrumb);
