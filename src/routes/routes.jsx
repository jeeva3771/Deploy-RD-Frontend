import React from "react";
import Loadable from "../utils/lazy/Loadable";
import { getpricingspecialist, getUserPermissions, getUserRole, getOnlyProfile } from "../utils/permission/auth";


const EnquiriesList = React.lazy(() => import("../pages/enquiry/List"));
const DesignerHead = React.lazy(() => import("../pages/designhead/List"));
const DesignerEnquiry = React.lazy(() => import("../pages/designerenquiries/List"));

const EnquiriesForm = React.lazy(() => import("../pages/enquiry/Form"));



const ProcessList = React.lazy(() => import('../pages/masters/process/List'));
const ProcessForm = React.lazy(() => import('../pages/masters/process/Form'));

const RateCardList = React.lazy(() => import('../pages/masters/process/RateCardList'));
const RateCardForm = React.lazy(() => import('../pages/masters/process/RateCardForm'));

const RolesList = React.lazy(() => import("../pages/masters/roles/List"));
const RoleForm = React.lazy(() => import('../pages/masters/roles/Form'));

const VendorList = React.lazy(() => import("../pages/masters/vendors/List"));
const VendorForm = React.lazy(() => import("../pages/masters/vendors/Form"));

const OutsourceVendorsList = React.lazy(() => import("../pages/masters/outsourceVendors/List"));
const OutsourceVendorForm = React.lazy(() => import("../pages/masters/outsourceVendors/Form"));

const DepartmentsList = React.lazy(() => import("../pages/masters/departments/List"));
const DepartmentForm = React.lazy(() => import('../pages/masters/departments/Form'));

const CustomersList = React.lazy(() => import("../pages/masters/customers/List"));
const CustomerForm = React.lazy(() => import("../pages/masters/customers/Form"));


const MachineList = React.lazy(() => import("../pages/masters/machine/List"));
const MachineForm = React.lazy(() => import("../pages/masters/machine/Form"));

const UsersList = React.lazy(() => import("../pages/users/List"));
const UserForm = React.lazy(() => import('../pages/users/Form'));


//inventory
const Item = React.lazy(() => import('../pages/inventory/item/List'));
const CustomItem = React.lazy(() => import('../pages/inventory/item/CustomList'));
const POList = React.lazy(() => import('../pages/inventory/purchaseorder/List'));
const POForm = React.lazy(() => import('../pages/inventory/purchaseorder/Form'));
const InwardList = React.lazy(() => import('../pages/inventory/inward/List'));
const MaterialCategoryList = React.lazy(() => import('../pages/masters/materialCategory/MaterialCategoryList'));
const MaterialTypeList = React.lazy(() => import('../pages/masters/materialType/MaterialTypeList'));
const RateUnitList = React.lazy(() => import('../pages/masters/rateUnit/RateUnitList'));
const StockSizeList = React.lazy(() => import('../pages/masters/stockSize/StockSizeList'));


const EnquiryCategory = React.lazy(() => import('../pages/masters/enquiry/EnquiryCategoryList'));
const EnquiryCategoryForm = React.lazy(() => import('../pages/masters/enquiry/EnquiryCategoryForm'));

const EnquirySubCategory = React.lazy(() => import('../pages/masters/enquiry/EnquirySubCategoryList'));
const EnquirySubCategoryForm = React.lazy(() => import('../pages/masters/enquiry/EnquirySubCategoryForm'));

const Servicecategory = React.lazy(() => import('../pages/masters/serviceCategory/ServiceCategoryList'));
const Servicecategoryform = React.lazy(() => import('../pages/masters/serviceCategory/ServiceCategoryForm'));


const ProcessColumnList = React.lazy(() => import('../pages/masters/process/ProcessColumnList'));
const ProcessColumnForm = React.lazy(() => import('../pages/masters/process/ProcessColumnForm'));

const UnitsList = React.lazy(() => import('../pages/masters/units/UnitList'));
const UnitsForm = React.lazy(() => import('../pages/masters/units/UnitForm'));

const WorkList = React.lazy(() => import('../pages/masters/work/WorkList'));
const WorkForm = React.lazy(() => import('../pages/masters/work/WorkForm'));

const CompanyList = React.lazy(() => import('../pages/masters/company/CompanyList'));
const CompanyForm = React.lazy(() => import('../pages/masters/company/CompanyForm'));

const sampleorderForm = React.lazy(() => import('../pages/salesorder/StepperForm'));
const ClientServicingHub = React.lazy(() => import('../pages/clientservicing/ClientServicingHub'));
const Dashboard = React.lazy(() => import('../pages/dashboard/Dashboard'));
const sampleorderList = React.lazy(() => import('../pages/salesorder/sampleorderlist/List'));
const salesSampleApproval = React.lazy(() => import('../pages/salesorder/sampleorderlist/SalesSampleApproval'));

const acoountspiList = React.lazy(() => import('../pages/Accounts/List'));
const AccountsConsole = React.lazy(() => import("../pages/Accounts/AccountsConsole"));
const GeneralAccountPage = React.lazy(() => import("../pages/Accounts/GeneralAccountPage"));
const BankMasterPage = React.lazy(() => import("../pages/Accounts/BankMasterPage"));
const ExecutiveOverviewPage = React.lazy(() => import("../pages/Accounts/ExecutiveOverviewPage"));

const productionorderList = React.lazy(() => import('../pages/salesorder/sampleorderlist/ProductionorderList'));


const withoutDesignerEnquiriesList = React.lazy(() => import("../pages/enquiry/WithoutDesignersList"));

const ClientDesignerEnquiriesList = React.lazy(() => import("../pages/enquiry/ClientDesignerList"));



const packagetypeList = React.lazy(() => import('../pages/masters/Packaging/PackingtypeList'));
const packagetypeForm = React.lazy(() => import('../pages/masters/Packaging/PackingtypeForm'));


const innerpackagetypeList = React.lazy(() => import('../pages/masters/Packaging/InnerPackingtypeList'));
const innerpackagetypeForm = React.lazy(() => import('../pages/masters/Packaging/InnerPackingtypeForm'));

const QuatationList = React.lazy(() => import('../pages/quotation/List'));

const QuatationForm = React.lazy(() => import('../pages/quotation/steps/StepperForm'));

//team
const HRList = React.lazy(() => import('../pages/team/hr/List'));
const StandaloneQuatationForm = React.lazy(() => import('../pages/standalone_quotation/steps/StepperForm'));
const StandaloneQuatationList = React.lazy(() => import('../pages/standalone_quotation/List'));

const ShiftTimeList = React.lazy(() => import('../pages/masters/shiftTime/ShiftTimeList'));

const TeamsModule = React.lazy(() => import('../pages/team/TeamsModule'));
const ShiftRoster = React.lazy(() => import('../pages/team/shift_roster/ShiftRoster'));

const OperationPlanningList = React.lazy(() => import('../pages/operationPlanning/List'));

const DtpStudio = React.lazy(() => import('../pages/dtp/DtpDashboard'));
const RFQDashboard = React.lazy(() => import('../pages/rfq/RFQMaster'));
const MaterialIssue = React.lazy(() => import('../pages/store/MaterialIssue'));
const ExtraMaterialRequest = React.lazy(() => import('../pages/store/ExtraMaterialRequest'));
const MaterialPurchaseRequest = React.lazy(() => import('../pages/store/MaterialPurchaseRequest'));
const MaterialInward = React.lazy(() => import('../pages/store/MaterialInward'));
const procurementCoordination = React.lazy(() => import('../pages/rfq/PoCoordination'));
const LaserCutting = React.lazy(() => import('../pages/shopfloor/LaserCutting'));
const UvPrintStudio = React.lazy(() => import('../pages/shopfloor/UvPrintStudio'));
const AssemblyBay = React.lazy(() => import('../pages/shopfloor/AssemblyBay'));
// const ShopFloorWIP = React.lazy(() => import('../pages/shopfloor/ShopFloorWIP'));
const CTHub = React.lazy(() => import('../pages/controltower/CTHub'));
const CTPipeline = React.lazy(() => import('../pages/controltower/CTPipeline'));
const CTFloors = React.lazy(() => import('../pages/controltower/CTFloors'));
const CTProc = React.lazy(() => import('../pages/controltower/CTProc'));
const CTStaff = React.lazy(() => import('../pages/controltower/CTStaff'));
const CTPack = React.lazy(() => import('../pages/shopfloor/CTPack'));
const CTStore = React.lazy(() => import('../pages/shopfloor/CTStore'));
const CTQc = React.lazy(() => import('../pages/shopfloor/CTQc'));
const CTMIS = React.lazy(() => import('../pages/controltower/CTMIS'));
const CTOwner = React.lazy(() => import('../pages/controltower/CTOwner'));
const JobLedger = React.lazy(() => import('../pages/controltower/JobLedger'));

const UserProfile = React.lazy(() => import('../pages/users/UserProfile'));




const allRoutes = [
  { path: "/control-tower", name: "Control Tower — Hub", element: CTHub, permission: ['40'] },
  { path: "/control-tower/hub", name: "Control Tower — Hub", element: CTHub, permission: ['40'] },
  { path: "/job-ledger", name: "Job Ledger", element: JobLedger, permission: ['46'] },
  { path: "/control-tower/pipeline", name: "Control Tower — Pipeline", element: CTPipeline, permission: ['40'] },
  { path: "/control-tower/floors", name: "Control Tower — Floors", element: CTFloors, permission: ['40'] },
  { path: "/control-tower/po", name: "Control Tower — PO", element: CTProc, permission: ['40'] },
  { path: "/control-tower/staff", name: "Control Tower — Staff", element: CTStaff, permission: ['40'] },
  { path: "/shopfloor/packing", name: "Shopfloor — Pack", element: CTPack, permission: ['43'] },
  { path: "/shopfloor/store", name: "Shopfloor — Store", element: CTStore, permission: ['41'] },
  { path: "/shopfloor/qc", name: "Shopfloor — QC", element: CTQc, permission: ['42'] },
  { path: "/control-tower/mis", name: "Control Tower — MIS", element: CTMIS, permission: ['40'] },
  { path: "/control-tower/owner", name: "Control Tower — Owner", element: CTOwner, permission: ['40'] },
  { path: "/shopfloor/laser-cutting", name: "Laser Cutting", element: LaserCutting, permission: ['34', '35'] },
  { path: "/shopfloor/uv-print-studio", name: "UV Print Studio", element: UvPrintStudio, permission: ['34', '37'] },
  { path: "/shopfloor/assembly-bay", name: "Assembly Bay", element: AssemblyBay, permission: ['34', '41'] },
  // { path: "/shopfloor/wip/:id", name: "Shop Floor WIP", element: ShopFloorWIP, permission: ['34'] },
  { path: "/enquiries", name: "Enquiries List", element: EnquiriesList, permission: ['9', '10'] },
  { path: "/designhead", name: "Design Head", element: DesignerHead, permission: ['10'] },

  { path: "/enquiries/add", name: "Add Enquiry", element: EnquiriesForm, permission: ['9'] },

  { path: "/enquiries/edit/:enquiryId", name: "Edit Enquiry", element: EnquiriesForm, permission: ['9'] },


  { path: "/designerenquiry", name: "Designer Enquiries", element: DesignerEnquiry, permission: ['11'] },

  { path: "/process", name: "Process List", element: ProcessList, permission: ['2'] },
  { path: "/process/add", name: "Add Process", element: ProcessForm, permission: ['2'] },
  { path: "/process/edit/:processId", name: "Edit Process", element: ProcessForm, permission: ['2'] },

  { path: "/ratecard", name: "Rate Card List", element: RateCardList, permission: ['2'] },
  { path: "/ratecard/add", name: "Add Rate Card", element: RateCardForm, permission: ['2'] },
  { path: "/ratecard/edit/:rateCardId", name: "Edit Rate Card", element: RateCardForm, permission: ['2'] },

  { path: "/roles", name: "Roles List", element: RolesList, permission: ['5'] },
  { path: "/roles/add", name: "Add Role", element: RoleForm, permission: ['5'] },
  { path: "/roles/edit/:roleId", name: "Edit Role", element: RoleForm, permission: ['5'] },

  { path: "/departments", name: "Departments List", element: DepartmentsList, permission: ['3'] },
  { path: "/departments/add", name: "Add Department", element: DepartmentForm, permission: ['3'] },
  { path: "/departments/edit/:departmentId", name: "Edit Department", element: DepartmentForm, permission: ['3'] },


  { path: "/machine", name: "Machine List", element: MachineList, permission: ['4'] },
  { path: "/machine/add", name: "Add Machine", element: MachineForm, permission: ['4'] },
  { path: "/machine/edit/:machineId", name: "Edit Machine", element: MachineForm, permission: ['4'] },


  { path: "/customer", name: "Customers List", element: CustomersList, permission: ['6'] },
  { path: "/customer/add", name: "Add Customer", element: CustomerForm, permission: ['6'] },
  { path: "/customer/edit/:customerId", name: "Edit Customer", element: CustomerForm, permission: ['6'] },




  { path: "/vendor", name: "Vendor List", element: VendorList, permission: ['7'] },

  { path: "/vendor/add", name: "Vendor Add", element: VendorForm, permission: ['7'] },
  { path: "/vendor/edit/:vendorId", name: "Edit Vendor", element: VendorForm, permission: ['7'] },

  { path: "/outsourcevendor", name: "Outsource Vendor List", element: OutsourceVendorsList, permission: ['36'] },

  { path: "/users", name: "Users List", element: UsersList, permission: ['8'] },
  { path: "/users/add", name: "Add User", element: UserForm, permission: ['8'] },
  { path: "/users/edit/:userId", name: "Edit User", element: UserForm, permission: ['8'] },


  //inventory
  { path: "/item", name: "Items", element: Item, permission: ['12'] },
  { path: "/custom-item", name: "Custom Items", element: CustomItem, permission: ['12'] },

  { path: "/po", name: "PO List", element: POList, permission: ['15'] },
  { path: "/po/add", name: "Add PO ", element: POForm, permission: ['15'] },

  { path: "/inward", name: "Add PO ", element: InwardList, permission: ['16'] },
  { path: "/materialcategory", name: "Material Category", element: MaterialCategoryList, permission: ['24'] },
  { path: "/materialtype", name: "Material Type", element: MaterialTypeList, permission: ['25'] },
  { path: "/rateunit", name: "Rate Unit", element: RateUnitList, permission: ['26'] },
  { path: "/stocksizes", name: "Stock Sizes", element: StockSizeList, permission: ['27'] },



  { path: "/enquirycategory", name: "Enquiry Category List", element: EnquiryCategory, permission: ['13'] },
  { path: "/enquirycategory/add", name: "Add Enquiry Category", element: EnquiryCategoryForm, permission: ['13'] },
  { path: "/enquirycategory/edit/:categoryId", name: "Edit Enquiry Category", element: EnquiryCategoryForm, permission: ['13'] },

  { path: "/enquirysubcategory", name: "Enquiry SubCategory List", element: EnquirySubCategory, permission: ['14'] },
  { path: "/enquirysubcategory/add", name: "Add Enquiry SubCategory", element: EnquirySubCategoryForm, permission: ['14'] },
  { path: "/enquirysubcategory/edit/:categoryId", name: "Edit Enquiry SubCategory", element: EnquirySubCategoryForm, permission: ['14'] },

  { path: "/servicecategory", name: "Servicecategory List", element: Servicecategory, permission: ['17'] },
  { path: "/servicecategory/add", name: "Add Servicecategory", element: Servicecategoryform, permission: ['17'] },
  { path: "/servicecategory/edit/:serviceCategoryId", name: "Edit Servicecategory", element: Servicecategoryform, permission: ['17'] },


  { path: "/processcolumn", name: "ProcessColumn List", element: ProcessColumnList, permission: ['2'] },
  { path: "/processcolumn/add", name: "Add ProcessColumn", element: ProcessColumnForm, permission: ['2'] },
  { path: "/processcolumn/edit/:processcolumnId", name: "Edit ProcessColumn", element: ProcessColumnForm, permission: ['2'] },

  { path: "/units", name: "Units List", element: UnitsList, permission: ['18'] },
  { path: "/unit/add", name: "Add Units", element: UnitsForm, permission: ['18'] },
  { path: "/unit/edit/:unitId", name: "Edit Units", element: UnitsForm, permission: ['18'] },

  { path: "/work", name: "Work List", element: WorkList, permission: ['38'] },
  { path: "/work/add", name: "Add Work", element: WorkForm, permission: ['38'] },
  { path: "/work/edit/:workId", name: "Edit Work", element: WorkForm, permission: ['38'] },

  { path: "/company", name: "Company List", element: CompanyList, permission: ['39'] },
  { path: "/company/add", name: "Add Company", element: CompanyForm, permission: ['39'] },
  { path: "/company/edit/:companyId", name: "Edit Company", element: CompanyForm, permission: ['39'] },

  { path: "/sampleorder", name: "Sample order List", element: sampleorderList, permission: ['19'] },
  { path: "/clientservicing", name: "Client Servicing Hub", element: ClientServicingHub, permission: ['45'] },
  { path: "/dashboard", name: "Dashboard", element: Dashboard },
  { path: "/sales-sample-approval", name: "Sales Sample Approval", element: salesSampleApproval },


  { path: "/sampleorderform/:sampleOrderid/:sotype", name: "Sample order Form", element: sampleorderForm, permission: ['19', '9'], restricted_roles: ['Associate'] },


  { path: "/accounts", name: "Accounts List", element: acoountspiList, permission: ['20'] },
  { path: "/executive-overview", name: "Executive Overview", element: ExecutiveOverviewPage, permission: ['46'] },
  { path: "/accounts-console", name: "Accounts Console", element: AccountsConsole, permission: ['47'] },
  { path: "/general-account", name: "General Account", element: GeneralAccountPage, permission: ['48'] },
  { path: "/bank-master", name: "Bank Master", element: BankMasterPage, permission: ['49'] },

  { path: "/productionorder", name: "Production order List", element: productionorderList, permission: ['21'] },



  { path: "/enquiriesw", name: "Without Designers Enquiries List", element: withoutDesignerEnquiriesList, permission: ['9', '10'] },
  { path: "/enquiriesw/add", name: "Add Enquiry", element: EnquiriesForm, permission: ['9'] },


  { path: "/enquiriesc", name: "Client Design Enquiries List", element: ClientDesignerEnquiriesList, permission: ['9', '10'] },
  { path: "/enquiriesc/add", name: "Add Enquiry", element: EnquiriesForm, permission: ['9'] },



  { path: "/packingtype", name: "packingtype List", element: packagetypeList, permission: ['22'] },
  { path: "/packingtype/add", name: "Add packingtype", element: packagetypeForm, permission: ['22'] },
  { path: "/packingtype/edit/:packingtypeId", name: "Edit packingtype", element: packagetypeForm, permission: ['22'] },


  { path: "/innerpackingtype", name: "Inner packingtype List", element: innerpackagetypeList, permission: ['22'] },
  { path: "/innerpackingtype/add", name: "Add Inner packingtype", element: innerpackagetypeForm, permission: ['22'] },
  { path: "/innerpackingtype/edit/:innerpackingtypeId", name: "Edit Inner packingtype", element: innerpackagetypeForm, permission: ['22'] },




  { path: "/quotation", name: "Quotation List", element: QuatationList, permission: ['19', '21'], pricing_specialist: ['true'] },
  { path: "/quotation/add/:sampleOrderid", name: "Quotation Add", element: QuatationForm, permission: ['19', '21'], pricing_specialist: ['true'] },

  { path: "/quotation/add/:sampleOrderid/:bomid", name: "Quotation Add", element: QuatationForm, permission: ['19', '21'], pricing_specialist: ['true'] },
  { path: "/quotation/View/:sampleOrderid/:bomid", name: "Quotation View", element: QuatationForm, permission: ['19', '21'], pricing_specialist: ['true'] },

  //team
  { path: "/hr", name: "HR List", element: HRList, permission: ['23'] },
  { path: "/teams", name: "Teams Module", element: TeamsModule, permission: ['23'] },
  { path: "/shift-roster", name: "Shift Roster", element: ShiftRoster, permission: ['23'] },


  { path: "/standalone/quotation", name: "Standalone Quotation Add", element: StandaloneQuatationList, permission: ['28'], pricing_specialist: ['true'] },

  { path: "/standalone/quotation/add", name: "Standalone Quotation Add", element: StandaloneQuatationForm, permission: ['28'], pricing_specialist: ['true'] },


  { path: "/standalone/quotation/View/:bomid", name: "Standalone Quotation Add", element: StandaloneQuatationForm, permission: ['28'], pricing_specialist: ['true'] },
  { path: "/standalone/quotation/edit/:bomid", name: "Standalone Quotation Edit", element: StandaloneQuatationForm, permission: ['28'], pricing_specialist: ['true'] },

  { path: "/shifttime", name: "Shift Time", element: ShiftTimeList, permission: ['30'] },

  { path: "/dtp-studio", name: "DTP Studio", element: DtpStudio, permission: ['31'] },

  // Print Route
  { path: "/print/team/:type/:id?", name: "Print Team", element: React.lazy(() => import('../pages/team/component/TeamPrintView')), permission: ['23'] },
  { path: "/store/material-issue", name: "Material Issue", element: MaterialIssue, permission: ['33'] },
  { path: "/store/material-purchase-request", name: "Material Purchase Request", element: MaterialPurchaseRequest, permission: ['33'] },
  { path: "/store/material-inward", name: "Material Inward", element: MaterialInward, permission: ['33'] },
  { path: "/store/extra-material-request", name: "Extra Material Request", element: ExtraMaterialRequest, permission: ['33'] },


  { path: "/operation-planning", name: "Operation Planning", element: OperationPlanningList, permission: ['29'] },

  { path: "/rfq", name: "RFQ Dashboard", element: RFQDashboard, permission: ['32'] }, // Access for admin only
  { path: "/procurement-coordination", name: "Procurement Coordination", element: procurementCoordination, permission: ['32'] }, // Access for admin only

  // userprofile
  { path: "/user-profile", name: "User Profile", element: UserProfile },
];


function filterRoutes(routes, permissions) {
  const isOnlyProfile = getOnlyProfile();

  if (isOnlyProfile) {
    return routes.filter(route => route.path === "/user-profile");
  }

  return routes.filter(route => {
    const hasPermission =
      !route.permission || route.permission.some(p => permissions.includes(p));

    if (route.pricing_specialist && !getpricingspecialist()) {
      return false;
    }

    return hasPermission;
  });
}

export function getAllowedRoutes() {
  const permissions = getUserPermissions().map(String);
  return filterRoutes(allRoutes, permissions);
}


export default allRoutes;
