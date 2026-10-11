// import { getUserPermissions } from "../utils/permission/auth";
// import allRoutes from "./routes";


// export function getAllowedRoutes() {
//   const permissions = getUserPermissions().map(String);  // e.g. ['6', '5']
//   // console.log("permissions:", permissions);

//   return allRoutes.filter(route => 
//     !route.permission || route.permission.some(p => permissions.includes(p))
//   );
// }


import React from 'react';
import { getpricingspecialist, getUser, getUserPermissions, getUserRole, getDepartmentName } from "../utils/permission/auth";
import allRoutes from "./routes";

const PageNotFoundwork = React.lazy(() => import('../pages/common/wotking'));

const CustomPatternA = React.lazy(() => import('../pages/shopfloor/customShopfloor/patternA.jsx'));
const CustomPatternB = React.lazy(() => import('../pages/shopfloor/customShopfloor/patternB.jsx'));
const CustomPatternC = React.lazy(() => import('../pages/shopfloor/customShopfloor/patternC.jsx'));

export function getAllowedRoutes(depts = []) {
  const permissions = getUserPermissions().map(String);
  const isPricingSpecialist = getpricingspecialist();
  const userRole = getUserRole();
  const userDept = getDepartmentName() || '';
  const userDeptLower = userDept.toLowerCase();
  const userRoleLower = String(userRole?.name || userRole || '').toLowerCase();
  const isAdmin = userRoleLower.includes('admin') || userRoleLower === 'super admin' || userRoleLower === 'superadmin';

  const userDeptSlug = userDept
    ? userDept
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    : '';

  const filtered = allRoutes.filter(route => {
    let hasPermission =
      !route.permission || route.permission.some(p => permissions.includes(p));

    // Restrict Client Servicing Hub page strictly to designated roles
    if (route.path === '/clientservicing') {
      const isAllowedRole = userRoleLower.includes('admin') || 
                            userRoleLower.includes('client servicing') || 
                            userRoleLower.includes('client service');
      if (!isAllowedRole) {
        return false;
      }
      hasPermission = true;
    }

    if (route.pricing_specialist && !isPricingSpecialist) {
      return false;
    }

    if (
      route.restricted_roles &&
      route.restricted_roles.includes(userRole)
    ) {
      return false;
    }

    // Restrict static shopfloor pages if not admin
    if (!isAdmin && route.path?.startsWith('/shopfloor/')) {
      if (route.path === '/shopfloor/laser-cutting' && userDeptLower !== 'laser') {
        return false;
      }
      if (route.path === '/shopfloor/uv-print-studio' && !userDeptLower.includes('uv')) {
        return false;
      }
      if (route.path === '/shopfloor/assembly-bay' && !userDeptLower.includes('assembly')) {
        return false;
      }
    }

    return hasPermission;
  });

  const dynamicRoutes = depts
    .filter(d => {
      if (d.is_active === false) return false;
      const uName = (d.name || '').toUpperCase();
      return !uName.includes('LASER') && !uName.includes('UV') && !uName.includes('DTP') && !uName.includes('ASSEMBLY');
    })
    .map(d => {
      const slug = (d.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      let component = CustomPatternA;

      return {
        path: `/shopfloor/${slug}`,
        name: d.name,
        element: component,
        permission: ['34'],
        supervisors: (d.supervisors || []).filter(Boolean).map(s => String(s.name || s || '').toLowerCase()),
        operators: (d.operators || []).filter(Boolean).map(o => String(o.name || o || '').toLowerCase())
      };
    })
    .filter(route => {
      // Restrict dynamic shopfloor pages if not admin
      if (!isAdmin) {
        const routeSlug = route.path.replace('/shopfloor/', '');
        const hasRoleAccess = route.supervisors.includes(userRoleLower) || route.operators.includes(userRoleLower);
        return hasRoleAccess || routeSlug === userDeptSlug;
      }
      return true;
    });

  return [...filtered, ...dynamicRoutes];
}
