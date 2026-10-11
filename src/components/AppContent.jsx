import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import routes from "../routes/routes";
import PageNotFound from "../pages/common/PageNotFound";
import UserRoute from "../components/route/UserRoute";
import { getAllowedRoutes } from "../routes/routes-filtered";
import Spinner from "../utils/spinners/Spinner";

const AppContent = () => {

  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { depts } = useSelector(state => state.controlTower);
  const allowedRoutes = React.useMemo(() => getAllowedRoutes(depts), [depts]);
  const location = useLocation();

  const currentPath = location.pathname;
  const isDynamicShopfloor = currentPath.startsWith("/shopfloor") && 
    !["/shopfloor/laser-cutting", "/shopfloor/uv-print-studio"].includes(currentPath);

  if (isAuthenticated && isDynamicShopfloor && depts.length === 0) {
    return <Spinner path="" />;
  }

  return (
    <Routes>
      <Route element={<UserRoute />}>
        {allowedRoutes.map((route, idx) => route.element ? (
          <Route
            key={idx}
            path={route.path}
            exact={route.exact}
            name={route.name}
            element={
              <React.Suspense fallback={<Spinner />}>
                <route.element />
              </React.Suspense>
            }
          />
        ) : null
        )}

        <Route path="/" element={<Navigate to="dashboard" replace />} />

        <Route path="*" element={<PageNotFound />} />


      </Route>


    </Routes>
  );
};

export default React.memo(AppContent);
