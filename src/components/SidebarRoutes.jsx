import {
  getUserPermissions,
  getpricingspecialist,
  getOnlyProfile,
  getUser,
  getDepartmentName,
} from "../utils/permission/auth.jsx";

const sidebarRoutes = [
  {
    label: "Dashboard",
    icon: "fa-solid fa-home",
    path: "/dashboard",
    permission: ["1"],
  },
  {
    label: "Masters",
    icon: "fa-solid fa-cogs",
    permission: [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "18",
      "22",
      "30",
      "38",
      "39",
    ],
    children: [
      {
        label: "Bank Master",
        icon: "fa-solid fa-building-columns",
        path: "/bank-master",
        match: ["/bank-master"],
        permission: ["49"],
      },
      {
        label: "Process",
        icon: "fa-solid fa-project-diagram",
        path: "/process",
        match: ["/process", "/process/add", "/process/edit/:processId"],
        permission: ["2"],
      },
      //  {
      //   label: 'Process Columns',
      //   icon: 'fa-solid fa-project-diagram',
      //   path: '/processcolumn',
      //   match: [
      //     '/processcolumn',
      //     '/processcolumn/add',
      //     '/processcolumn/edit/:processcolumn'
      //   ],
      //   permission: ['2'],
      // },
      //  {
      //   label: 'Process Management',
      //   icon: 'fa-solid fa-diagram-project',
      //   permission: ['2'],
      //   children: [
      //     {
      //       label: 'Process',
      //       icon: 'fa-solid fa-circle-nodes',
      //       path: '/process',
      //       match: [
      //         '/process',
      //         '/process/add',
      //         '/process/edit/:processId',
      //       ],
      //       permission: ['2'],
      //     },
      //     // {
      //     //   label: 'Rate Card',
      //     //   icon: 'fa-solid fa-circle-nodes',
      //     //   path: '/ratecard',
      //     //   match: [
      //     //     '/ratecard',
      //     //     '/ratecard/add',
      //     //     '/ratecard/edit/:processId',
      //     //   ],
      //     //   permission: ['2'],
      //     // },
      //     // {
      //     //   label: 'Process Columns',
      //     //   icon: 'fa-solid fa-table-columns',
      //     //   path: '/processcolumn',
      //     //   match: [
      //     //     '/processcolumn',
      //     //     '/processcolumn/add',
      //     //     '/processcolumn/edit/:processcolumn',
      //     //   ],
      //     //   permission: ['2'],
      //     // },
      //   ],
      // },
      {
        label: "Departments",
        icon: "fa-solid fa-building",
        path: "/departments",
        match: [
          "/departments",
          "/departments/add",
          "/departments/:departmentId",
        ],
        permission: ["3"],
      },
      {
        label: "Machines",
        icon: "fa-solid fa-industry",
        path: "/machine",
        match: [
          "/machine",
          "/machine/add",
          "/machine/edit/:machineId",
          "/machine/:machineId",
        ],
        permission: ["4"],
      },
      {
        label: "Roles",
        icon: "fa-solid fa-user-shield",
        path: "/roles",
        match: ["/roles", "/roles/add", "/roles/:roleId"],
        permission: ["5"],
      },
      {
        label: "Customers",
        icon: "fa-solid fa-users",
        path: "/customer",
        match: ["/customer", "/customer/add", "/customer/:roleId"],
        permission: ["6"],
      },
      {
        label: "Supply Vendors",
        icon: "fa-solid fa-truck",
        path: "/vendor",
        match: ["/vendor", "/vendor/add", "/vendor/:vendorId"],
        permission: ["7"],
      },
      {
        label: "Job Work Vendors",
        icon: "fa-solid fa-truck-fast",
        path: "/outsourcevendor",
        match: ["/outsourcevendor"],
        permission: ["36"],
      },
      {
        label: "Users",
        icon: "fa-solid fa-user",
        path: "/users",
        match: ["/users", "/users/add", "/users/edit/:userId"],
        permission: ["8"],
      },
      {
        label: "Units",
        icon: "fa-solid fa-user",
        path: "/units",
        match: ["/units", "/units/add", "/units/edit/:unitId"],
        permission: ["18"],
      },
      {
        label: "Work",
        icon: "fa-solid fa-briefcase",
        path: "/work",
        match: ["/work", "/work/add", "/work/edit/:workId"],
        permission: ["38"],
      },
      {
        label: "Company",
        icon: "fa-solid fa-building",
        path: "/company",
        match: ["/company", "/company/add", "/company/edit/:companyId"],
        permission: ["39"],
      },
      {
        label: "Material Category",
        icon: "fa-solid fa-user",
        path: "/materialcategory",
        match: [
          "/materialcategory",
          "/materialcategory/add",
          "/materialcategory/edit/:materialcategoryId",
        ],
        permission: ["24"],
      },
      {
        label: "Rate Units",
        icon: "fa-solid fa-user",
        path: "/rateUnit",
        match: ["/rateUnit", "/rateUnit/add", "/rateUnit/edit/:rateUnitId"],
        permission: ["25"],
      },
      {
        label: "Stock Sizes",
        icon: "fa-solid fa-user",
        path: "/stocksizes",
        match: [
          "/stocksizes",
          "/stocksizes/add",
          "/stocksizes/edit/:stocksizesId",
        ],
        permission: ["26"],
      },
      {
        label: "Material Type",
        icon: "fa-solid fa-user",
        path: "/materialtype",
        match: [
          "/materialtype",
          "/materialtype/add",
          "/materialtype/edit/:materialtypeId",
        ],
        permission: ["27"],
      },
      {
        label: "Shift Time",
        icon: "fa-solid fa-clock",
        path: "/shifttime",
        match: ["/shifttime", "/shifttime/add", "/shifttime/edit/:shiftTimeId"],
        permission: ["30"],
      },
      {
        label: "Service Category",
        icon: "fa-solid fa-building",
        path: "/servicecategory",
        match: [
          "/servicecategory",
          "/servicecategory/add",
          "/servicecategory/:serviceCategoryId",
        ],
        permission: ["17"],
      },
      {
        label: "Enquiry Category",
        icon: "fa-solid fa-envelope-open-text",
        permission: ["13", "14"],
        children: [
          {
            label: "Category",
            icon: "fa-solid fa-tags",
            path: "/enquirycategory",
            match: [
              "/enquirycategory",
              "/enquirycategory/add",
              "/enquirycategory/edit/:categoryId",
            ],
            permission: ["13"],
          },
          {
            label: "Sub Category",
            icon: "fa-solid fa-tags",
            path: "/enquirysubcategory",
            match: [
              "/enquirysubcategory",
              "/enquirysubcategory/add",
              "/enquirysubcategory/edit/:categoryId",
            ],
            permission: ["14"],
          },
        ],
      },
      {
        label: "Packaging",
        icon: "fa-solid fa-envelope-open-text",
        permission: ["22"],
        children: [
          {
            label: "Packing type",
            icon: "fa-solid fa-tags",
            path: "/packingtype",
            match: [
              "/packingtype",
              "/packingtype/add",
              "/packingtype/edit/:packingtypeId",
            ],
            permission: ["22"],
          },
          {
            label: "Inner packing Type",
            icon: "fa-solid fa-tags",
            path: "/innerpackingtype",
            match: [
              "/innerpackingtype",
              "/innerpackingtype/add",
              "/innerpackingtype/edit/:innerpackingtypeId",
            ],
            permission: ["22"],
          },
        ],
      },
    ],
  },
  {
    label: "Inventory",
    icon: "fa-solid fa-boxes-stacked",
    permission: ["12"],
    children: [
      {
        label: "Items",
        icon: "fa-solid fa-box",
        path: "/item",
        match: ["/item"],
        permission: ["12"],
      },
      {
        label: "Custom Items",
        icon: "fa-solid fa-box-open",
        path: "/custom-item",
        match: ["/custom-item"],
        permission: ["12"],
      },
      // {
      //   label: "Purchase Order",
      //   icon: "fa-solid fa-box",
      //   path: "/po",
      //   match: ["/po", "/po/add"],
      //   permission: ["15"],
      // },
      // {
      //   label: "Stock Inward",
      //   icon: "fa-solid fa-box",
      //   path: "/inward",
      //   match: ["/inward", "/inward/add"],
      //   permission: ["16"],
      // },
    ],
  },
  // {
  //   label: 'Enquiries',
  //   icon: 'fa-solid fa-envelope-open-text',
  //   path: '/enquiries',
  //   match: ['/enquiries', '/enquiries/add'],
  //   permission: ['9', '10'],
  // },

  {
    label: "Enquiries",
    icon: "fa-solid fa-envelope-open-text",
    permission: ["9", "10", "19"],

    children: [
      {
        label: "With Designer",
        icon: "fa-solid fa-envelope-open-text",
        path: "/enquiries",
        match: ["/enquiries", "/enquiries/add", "/enquiries/edit/:enquiryId"],
        permission: ["9", "10"],
      },
      {
        label: "Sales Sample Approval",
        icon: "fa-solid fa-vial-circle-check",
        path: "/sales-sample-approval",
        match: ["/sales-sample-approval"],
        permission: ["9", "10", "19"],
      },
      // {
      //   label: 'Without Designer',
      //   icon: 'fa-solid fa-envelope-open-text',
      //   path: '/enquiriesw',
      //   match: ['/enquiriesw', '/enquiriesw/add', '/enquiriesw/edit/:enquiryId'],
      //   permission: ['9', '10'],
      // },
      // {
      //   label: `Client's Design`,
      //   icon: 'fa-solid fa-envelope-open-text',
      //   path: '/enquiriesc',
      //   match: ['/enquiriesc', '/enquiriesc/add'],
      //   permission: ['9', '10'],
      // },
    ],
  },
  {
    label: "Client Servicing Hub",
    icon: "fa-solid fa-users-viewfinder",
    path: "/clientservicing",
    match: ["/clientservicing"],
    permission: ["45"],
  },
  {
    label: "Designer",
    icon: "fa-solid fa-pencil-ruler",
    path: "/designerenquiry",
    match: ["/designerenquiry"],
    permission: ["11"],
  },

  {
    label: "Accounts",
    icon: "fa-solid fa-pencil-ruler",
    path: "/accounts",
    match: ["/accounts, /accounts/:accountsid"],
    permission: ["20"],
  },
  {
    label: "Executive Overview",
    icon: "fa-solid fa-chart-pie",
    path: "/executive-overview",
    match: ["/executive-overview"],
    permission: ["46"],
  },
  {
    label: "Accounts Console",
    icon: "fa-solid fa-wallet",
    path: "/accounts-console",
    match: ["/accounts-console"],
    permission: ["47"],
  },
  {
    label: "General Account",
    icon: "fa-solid fa-building-columns",
    path: "/general-account",
    match: ["/general-account"],
    permission: ["48"],
  },

  {
    label: "Production",
    icon: "fa-solid fa-envelope-open-text",
    permission: ["19", "21"],
    children: [
      {
        label: "Sample order",
        icon: "fa-solid fa-pencil-ruler",
        path: "/sampleorder",
        match: ["/sampleorder, /sampleorderform/:sampleOrderid/:sotype"],
        permission: ["19"],
      },
      {
        label: "Production order",
        icon: "fa-solid fa-pencil-ruler",
        path: "/productionorder",
        match: ["/productionorder"],
        permission: ["21"],
      },
      {
        label: "Quotation",
        icon: "fa-solid fa-file-lines",
        path: "/quotation",
        match: [
          "/quotation, /quotation/add/:sampleOrderid, /quotation/:quotationId",
        ],
        permission: ["19", "21"],
        pricing_specialist: ["true"],
      },

      // {
      //   label: 'HR Database',
      //   icon: 'fa-solid fa-users',
      //   path: '/hr',
      //   match: ['/hr'],
      //   permission: ['23'],
      // },
    ],
  },

  {
    label: "Operation Planning",
    icon: "fa-solid fa-calendar-check",
    path: "/operation-planning",
    match: ["/operation-planning"],
    permission: ["29"],
  },

  //team
  {
    label: "Teams Builder",
    icon: "fa-solid fa-users",
    path: "/teams",
    match: ["/teams"],
    permission: ["23"],
  },

  {
    label: "Shift Roster",
    icon: "fa-solid fa-clock",
    path: "/shift-roster",
    match: ["/shift-roster"],
    permission: ["23"],
  },

  {
    label: "HR Database",
    icon: "fa-solid fa-building-user",
    path: "/hr",
    match: ["/hr"],
    permission: ["23"],
  },

  {
    label: "Standalone Quotation",
    icon: "fa-solid fa-file-invoice",
    path: "/standalone/quotation",
    match: [
      "/standalone/quotation, /standalone/quotation/add, /standalone/quotation/:quotationId",
    ],
    permission: ["28"],
    pricing_specialist: ["true"],
  },
  {
    label: "Store",
    icon: "fa-solid fa-store",
    permission: ["33"],
    children: [
      {
        label: "Material Issue",
        icon: "fa-solid fa-file-export",
        path: "/store/material-issue",
        match: ["/store/material-issue"],
        permission: ["33"],
      },
      {
        label: "Material Purchase Request",
        icon: "fa-solid fa-cart-plus",
        path: "/store/material-purchase-request",
        match: ["/store/material-purchase-request"],
        permission: ["33"],
      },
      {
        label: "Material Inward",
        icon: "fa-solid fa-boxes-packing",
        path: "/store/material-inward",
        match: ["/store/material-inward"],
        permission: ["33"],
      },
      {
        label: "EMR & Requisitions",
        icon: "fa-solid fa-clipboard-list",
        path: "/store/extra-material-request",
        match: ["/store/extra-material-request"],
        permission: ["33"],
      },
      // {
      //   label: "Master Dashboard",
      //   icon: "fa-solid fa-chart-line",
      //   path: "/store/master",
      //   match: ["/store/master"],
      //   permission: ["33"],
      // },
    ],
  },
  {
    label: "DTP Studio",
    icon: "fa-solid fa-palette",
    path: "/dtp-studio",
    match: ["/dtp-studio"],
    permission: ["31"],
  },

  {
    label: "Shop Floor",
    icon: "fa-solid fa-industry",
    permission: ["34", "35", "37", "41", "42", "43", "44"],
    children: [
      {
        label: "Laser Studio",
        icon: "fa-solid fa-scissors",
        path: "/shopfloor/laser-cutting",
        match: ["/shopfloor/laser-cutting"],
        permission: ["35"],
      },
      {
        label: "UV Print Studio",
        icon: "fa-solid fa-print",
        path: "/shopfloor/uv-print-studio",
        match: ["/shopfloor/uv-print-studio"],
        permission: ["37"],
      },
      {
        label: "Assembly Bay",
        icon: "fa-solid fa-wrench",
        path: "/shopfloor/assembly-bay",
        match: ["/shopfloor/assembly-bay"],
        permission: ["44", "34"],
      },
      {
        label: "Finished Goods Store",
        icon: "fa-solid fa-warehouse",
        path: "/shopfloor/store",
        match: ["/shopfloor/store"],
        permission: ["41"],
      },
      {
        label: "Quality Control",
        icon: "fa-solid fa-magnifying-glass",
        path: "/shopfloor/qc",
        match: ["/shopfloor/qc"],
        permission: ["42"],
      },
      {
        label: "Packing",
        icon: "fa-solid fa-box-open",
        path: "/shopfloor/packing",
        match: ["/shopfloor/packing"],
        permission: ["43"],
      },
    ],
  },
  {
    label: "Procurement",
    icon: "fa-solid fa-people-arrows",
    permission: ["32"],
    children: [
      {
        label: "RFQ",
        icon: "fa-solid fa-file-invoice-dollar",
        path: "/rfq",
        match: ["/rfq"],
        permission: ["32"],
      },
      {
        label: "Procurement Coordination",
        icon: "fa-solid fa-people-arrows",
        path: "/procurement-coordination",
        match: ["/procurement-coordination"],
        permission: ["32"],
      },
    ],
  },
  {
    label: "Control Tower",
    icon: "fa-solid fa-tower-broadcast",
    permission: ["40"],
    match: ["/control-tower"],
    children: [
      {
        label: "Hub",
        icon: "fa-solid fa-landmark",
        path: "/control-tower/hub",
        match: ["/control-tower/hub", "/control-tower"],
        permission: ["40"],
        exact: true,
      },

      // {
      //   label: "Pipeline",
      //   icon: "fa-solid fa-satellite-dish",
      //   path: "/control-tower/pipeline",
      //   match: ["/control-tower/pipeline"],
      //   permission: ["40"],
      // },
      // {
      //   label: "Floors",
      //   icon: "fa-solid fa-layer-group",
      //   path: "/control-tower/floors",
      //   match: ["/control-tower/floors"],
      //   permission: ["40"],
      // },
      {
        label: "PO",
        icon: "fa-solid fa-boxes-packing",
        path: "/control-tower/po",
        match: ["/control-tower/po"],
        permission: ["40"],
      },
      // {
      //   label: "Staff",
      //   icon: "fa-solid fa-users",
      //   path: "/control-tower/staff",
      //   match: ["/control-tower/staff"],
      //   permission: ["40"],
      // },
      // {
      //   label: "MIS",
      //   icon: "fa-solid fa-chart-bar",
      //   path: "/control-tower/mis",
      //   match: ["/control-tower/mis"],
      //   permission: ["40"],
      // },
      // {
      //   label: "Owner",
      //   icon: "fa-solid fa-crown",
      //   path: "/control-tower/owner",
      //   match: ["/control-tower/owner"],
      //   permission: ["40"],
      // },
    ],
  },
  {
    label: "Job Ledger",
    icon: "fa-solid fa-book-journal-whills",
    path: "/job-ledger",
    match: ["/job-ledger"],
    permission: ["46"],
  },
];

// function filterSidebar(routes, permissions) {
//   return routes.reduce((acc, route) => {
//     if (!route.permission || route.permission.some(p => permissions.includes(p))) {
//       const filteredRoute = { ...route };
//       if (route.children) {
//         filteredRoute.children = filterSidebar(route.children, permissions);
//       }
//       acc.push(filteredRoute);
//     }
//     return acc;
//   }, []);
// }

// console.log("getpricingspecialist", getpricingspecialist());

// function filterSidebar(routes, permissions) {
//   return routes.reduce((acc, route) => {
//     const hasPermission = !route.permission || route.permission.some(p => permissions.includes(p));

//     if (route.label === "Quotation" && !getpricingspecialist()) {
//       return acc;
//     }

//     if (hasPermission) {
//       const filteredRoute = { ...route };

//       if (route.children) {
//         filteredRoute.children = filterSidebar(route.children, permissions);
//       }

//       acc.push(filteredRoute);
//     }

//     return acc;
//   }, []);
// }

function filterSidebar(routes, permissions) {
  const isOnlyProfile = getOnlyProfile();

  if (isOnlyProfile) {
    return [
      {
        label: "My Profile",
        icon: "fa-solid fa-user-circle",
        path: "/user-profile",
      },
    ];
  }

  const user = getUser();
  const userRole = String(user?.role?.name || user?.role || "").toLowerCase();
  const isAdmin =
    userRole.includes("admin") ||
    userRole === "super admin" ||
    userRole === "superadmin";

  return routes.reduce((acc, route) => {
    let hasPermission =
      !route.permission ||
      route.permission.some((p) => permissions.includes(p));

    // Restrict Client Servicing Hub menu strictly to designated roles (Admin only)
    if (route.path === "/clientservicing") {
      const isAllowedRole =
        userRole.includes("admin") ||
        userRole === "super admin" ||
        userRole === "superadmin";
      if (!isAllowedRole) {
        return acc;
      }
      hasPermission = true;
    }

    // SPECIAL CASE: PRODUCTION HUB
    if (route.label === "Production") {
      // find allowed children
      const allowedChildren = (route.children || []).filter((child) =>
        child.permission?.some((p) => permissions.includes(p)),
      );

      if (!allowedChildren.length) return acc;

      // decide default route
      const defaultChild =
        allowedChildren.find((c) => c.path === "/productionorder") ||
        allowedChildren[0];

      acc.push({
        label: "Production Hub",
        icon: route.icon,
        path: defaultChild.path,
        match: [defaultChild.path],
        permission: route.permission,
      });

      return acc;
    }

    // QUOTATION SPECIALIST CHECK
    if (route.label === "Quotation" && !getpricingspecialist()) {
      return acc;
    }

    if (route.label === "Quotation" && !getpricingspecialist()) {
      return acc;
    }

    if (hasPermission) {
      const filteredRoute = { ...route };

      if (route.children) {
        filteredRoute.children = filterSidebar(route.children, permissions);
      }

      acc.push(filteredRoute);
    }

    return acc;
  }, []);
}

export function getAllowedSidebarRoutes(depts = []) {
  const permissions = getUserPermissions().map(String);
  const user = getUser();
  const userRoleName = String(
    user?.role?.name || user?.role || "",
  ).toLowerCase();
  const isAdmin =
    userRoleName.includes("admin") ||
    userRoleName === "super admin" ||
    userRoleName === "superadmin";

  // Clone/copy sidebarRoutes so we don't mutate the original static definition
  const routesCopy = JSON.parse(JSON.stringify(sidebarRoutes));

  // Find "Shop Floor" route
  const shopFloorRoute = routesCopy.find((r) => r.label === "Shop Floor");
  if (shopFloorRoute) {
    const userDept = getDepartmentName() || "";
    const userDeptLower = userDept.toLowerCase();

    let staticChildren = shopFloorRoute.children || [];
    if (!isAdmin) {
      const isAssemblyUser = userDeptLower.includes("assembly");
      const isHead = user?.is_head || false;

      staticChildren = staticChildren.filter((child) => {
        if (child.path === "/shopfloor/laser-cutting") {
          return (
            userDeptLower === "laser" ||
            isHead ||
            permissions.includes("35") ||
            permissions.includes("34")
          );
        }
        if (child.path === "/shopfloor/uv-print-studio") {
          return (
            userDeptLower.includes("uv") ||
            isHead ||
            permissions.includes("37") ||
            permissions.includes("34")
          );
        }
        if (child.path === "/shopfloor/assembly-bay") {
          return (
            isAssemblyUser ||
            isHead ||
            permissions.includes("44") ||
            permissions.includes("34")
          );
        }
        return true;
      });
    }

    const dynamicChildren = depts
      .filter((d) => {
        if (d.is_active === false) return false;
        const uName = (d.name || "").toUpperCase();
        if (
          uName.includes("LASER") ||
          uName.includes("UV") ||
          uName.includes("DTP") ||
          uName.includes("ASSEMBLY")
        )
          return false;

        // Role-based dynamic filtering
        if (isAdmin) return true;

        const supervisors = (d.supervisors || []).map((s) =>
          String(s.name || s || "").toLowerCase(),
        );
        const operators = (d.operators || []).map((o) =>
          String(o.name || o || "").toLowerCase(),
        );

        return (
          supervisors.includes(userRoleName) || operators.includes(userRoleName)
        );
      })
      .map((d) => {
        const slug = (d.name || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        return {
          label: d.name,
          icon: "fa-solid fa-circle-notch",
          path: `/shopfloor/${slug}`,
          match: [`/shopfloor/${slug}`],
          permission: isAdmin ? undefined : ["34"],
        };
      });

    shopFloorRoute.children = [...staticChildren, ...dynamicChildren];
  }

  return filterSidebar(routesCopy, permissions);
}
