import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducer/authReducer";
import dashboardReducer from "./reducer/dashboardReducer";
import userReducer from "./reducer/userReducer";
import departmentReducer from './reducer/departmentReducer';
import roleReducer from './reducer/roleReducer';
import unitReducer from './reducer/unitReducer';
import customerReducer from './reducer/customerReducer';
import processReducer from './reducer/processReducer';
import machineReducer from './reducer/machineReducer';
import processColumnReducer from "./reducer/processColumnReducer";
import vendorReducer from "./reducer/vendorReducer";
import outsourceVendorReducer from "./reducer/outsourceVendorReducer";
import serviceCategoryReducer from "./reducer/serviceCategoryReducer";
import enquiryCategoryReducer from "./reducer/enquiryCategoryReducer";
import contractTypeReducer from "./reducer/contractTypeReducer";
import enquiryReducer from "./reducer/enquiryReducer";
import enquirySubCategoryReducer from "./reducer/enquirySubCategoryReducer";
import ratecardReducer from "./reducer/rateCardReducer";
import sampleSalesOrderlistReducer from "./reducer/sampleSalesorderReducer";
import teamReducer from "./reducer/teamReducer";
import shiftTimeReducer from "./reducer/masters/shiftTimeReducer";
import workReducer from "./reducer/workReducer";
import companyReducer from "./reducer/companyReducer";
import accountsReducer from "./reducer/accountsReducer";


//inventory
import itemsReducer from "./reducer/inventory/itemReducer";
import customItemsReducer from "./reducer/inventory/customItemReducer";
import materialCategoryReducer from "./reducer/inventory/common/materialCategoryReducer";
import materialType from "./reducer/inventory/common/materialTypeReducer";


import commonDropownReducer from "./reducer/commonReducer";
import typeofpackagingReducer from "./reducer/packaging/typeofpackagingReducer";

import innerpackagingReducer from "./reducer/packaging/InnerpackagingReducer";
import stockSizeReducer from "./reducer/inventory/common/stockSizeReducer";
import rateUnitReducer from "./reducer/inventory/common/rateUnitReducer";

import bomReducer from "./reducer/bomReducer";
import standalonebomReducer from "./reducer/standalone_bomReducer";

import shiftReducer from "./reducer/shiftReducer";
import dtpStudioReducer from "./reducer/dtpStudioReducer";
import storeReducer from "./reducer/storeReducer";
import materialPurchaseRequestReducer from "./reducer/materialPurchaseRequestReducer";

import rfqReducer from "./reducer/rfqReducer";
import assemblyTeamJobReducer from "./reducer/assemblyTeamJobReducer";
import shopFloorReducer from "./reducer/shopFloorReducer";
import shopFloorProcessFlowReducer from "./reducer/shopFloorProcessFlowReducer";
import readyJobsReducer from "./reducer/readyJobsReducer";
import shopFloorEMRReducer from "./reducer/shopFloorEMRReducer";
import shopFloorRequisitionReducer from "./reducer/shopFloorRequisitionReducer";
import controlTowerReducer from "./reducer/controlTowerReducer";
import fgStoreReducer from "./reducer/fgStoreReducer";
import ctQcReducer from "./reducer/ctQcReducer";
import ctPackReducer from "./reducer/ctPackReducer";
import jobLedgerReducer from "./reducer/jobLedgerReducer";
import clientServicingHubReducer from "./reducer/clientServicingHubReducer";

const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    user: userReducer,
    department: departmentReducer,
    role: roleReducer,
    unit: unitReducer,
    customer: customerReducer,
    machine: machineReducer,
    process: processReducer,
    work: workReducer,
    company: companyReducer,
    rateCard: ratecardReducer,
    processColumn: processColumnReducer,
    vendor: vendorReducer,
    outsourceVendor: outsourceVendorReducer,
    serviceCategory: serviceCategoryReducer,
    enquiryCategories: enquiryCategoryReducer,
    enquiry: enquiryReducer,
    contractType: contractTypeReducer,
    enquirySubCategories: enquirySubCategoryReducer,
    sampleSalesOrders: sampleSalesOrderlistReducer,
    team: teamReducer,
    shiftTime: shiftTimeReducer,

    //inventory
    items: itemsReducer,
    customItems: customItemsReducer,

    materialCategories: materialCategoryReducer,
    materialTypes: materialType,
    stockSize: stockSizeReducer,
    rateUnit: rateUnitReducer,



    commondropdowns: commonDropownReducer,

    typeofpackaging: typeofpackagingReducer,
    innerpackaging: innerpackagingReducer,

    bom: bomReducer,
    standalonebom: standalonebomReducer,
    shift: shiftReducer,
    dtpStudio: dtpStudioReducer,
    rfq: rfqReducer,
    store: storeReducer,
    materialPurchaseRequest: materialPurchaseRequestReducer,
    assemblyTeamJob: assemblyTeamJobReducer,
    shopFloor: shopFloorReducer,
    shopFloorProcessFlow: shopFloorProcessFlowReducer,
    readyJobs: readyJobsReducer,
    shopfloorEMR: shopFloorEMRReducer,
    shopfloorRequisition: shopFloorRequisitionReducer,
    controlTower: controlTowerReducer,
    fgStore: fgStoreReducer,
    ctQc: ctQcReducer,
    ctPack: ctPackReducer,
    jobLedger: jobLedgerReducer,
    clientServicingHub: clientServicingHubReducer,
    accounts: accountsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export default store;
