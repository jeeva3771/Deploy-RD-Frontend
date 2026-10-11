import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUniqueClients,
  fetchUniqueProducts,
  fetchEnquiryCountsByUser,
  fetchEnquiryKPIStats,
  fetchAllEnquiries,
} from "../../reducer/enquiryReducer";
import { fetchClientServicingCounts } from "../../reducer/clientServicingHubReducer";
import { getUser } from "../../utils/permission/auth";
import { fetchAllUsers } from "../../reducer/userReducer";
import { fetchAllBOMs } from "../../reducer/bomReducer";
import { fetchAllSampleOrders } from "../../reducer/sampleSalesorderReducer";
import { fetchAllDTPJobs } from "../../reducer/dtpStudioReducer";
import { fetchShopFloorJobs } from "../../reducer/shopFloorReducer";
import { fetchFgStoreJobs } from "../../reducer/fgStoreReducer";
import TopBar from "./components/TopBar";
import KPIStrip from "./components/KPIStrip";
import ClientSnapshot from "./components/ClientSnapshot";
import TeamKRAScorecard from "./components/TeamKRAScorecard";
import DueTodayAcrossFloor from "./components/DueTodayAcrossFloor";
import SwimLaneView from "./components/SwimLaneView";
import HeatmapView from "./components/HeatmapView";
import FunnelView from "./components/FunnelView";
import DetailDrawer from "./components/DetailDrawer";
import { Icon } from "./components/Icon";

const CLIENTS = [];
const PRODUCTS = [];
const OWNERS = [];

const JOB_LANES = [
  {
    id: "enquiry",
    name: "Enquiry Intake",
    short: "Enquiry",
    icon: "inbox",
    color: "#4C6EF5",
    type: "jobs",
    stations: [
      { id: "create", name: "Create New Enquiry" },
      { id: "clone", name: "Clone Enquiry" },
      { id: "edit", name: "Check / Update / Edit" },
      { id: "clientwise", name: "Client-wise Enquiry" },
      { id: "status", name: "Enquiry Status Tracker" },
      { id: "assign", name: "Assign to Designer" },
    ],
  },
  {
    id: "design",
    name: "Design & Classification",
    short: "Design",
    icon: "palette",
    color: "#F59F00",
    type: "jobs",
    stations: [
      { id: "uploads", name: "Design Upload Tracker" },
      { id: "review", name: "Client Design Review" },
      { id: "ordertype", name: "Order Type Decision" },
      { id: "sampleform", name: "Sample Order Form" },
      { id: "prodform", name: "Production Order Form" },
      { id: "revisions", name: "Revision History" },
    ],
  },
  {
    id: "costing",
    name: "Costing (BOM)",
    short: "Costing",
    icon: "calculator",
    color: "#12B886",
    type: "jobs",
    stations: [
      { id: "bom", name: "BOM Generation" },
      { id: "costreview", name: "Cost Estimate Review" },
      { id: "margincheck", name: "Margin Check \u226545%" },
      { id: "adminapproval", name: "Admin Approval Pending" },
    ],
  },
  {
    id: "quotation",
    name: "Quotation & Financial Verification",
    short: "Quotation",
    icon: "filecheck",
    color: "#FA5252",
    type: "jobs",
    stations: [
      { id: "quotesent", name: "Quotation Sent" },
      { id: "quoteapproved", name: "Quotation Approved" },
      { id: "pi", name: "Proforma Invoice Upload" },
      { id: "releasegate", name: "Release Gate Check" },
      { id: "production", name: "Production Release" },
    ],
  },
  {
    id: "shopfloor",
    name: "Shop Floor Execution",
    short: "Shop Floor",
    icon: "settings",
    color: "#FD7E14",
    type: "jobs",
    stations: [
      { id: "dtp", name: "DTP Studio" },
      { id: "laser", name: "Laser Cutting" },
      { id: "painting", name: "Painting" },
      { id: "uv", name: "UV Printing" },
      { id: "assembly", name: "Assembly" },
      { id: "fgstore", name: "FG Store" },
      { id: "qc", name: "QC Inspection" },
      { id: "packing", name: "Packing" },
    ],
  },
  {
    id: "dispatch",
    name: "Dispatch & Billing",
    short: "Dispatch",
    icon: "truck",
    color: "#7048E8",
    type: "jobs",
    stations: [
      { id: "readydispatch", name: "Ready for Dispatch" },
      { id: "delivery", name: "Delivery Tracking" },
      { id: "billing", name: "Billing Finalization" },
      { id: "completed", name: "Order Closeout" },
    ],
  },
];

const COLLECTION_STATIONS = [
  { id: "outstanding", name: "Outstanding Invoices" },
  { id: "duesoon", name: "Due This Week" },
  { id: "overdue", name: "Overdue 30+ Days" },
  { id: "followup", name: "Follow-up Scheduled" },
  { id: "partial", name: "Partially Paid" },
  { id: "clientwise", name: "Client-wise Statement" },
];

const LEDGER_LANE = {
  id: "ledger",
  name: "Total Job Ledger \u2014 Start to Finish",
  short: "Job Ledger",
  icon: "list",
  color: "#495057",
  type: "ledger",
  stations: [
    { id: "enquiry", name: "Enquiry Intake" },
    { id: "design", name: "Design & Classification" },
    { id: "costing", name: "Costing (BOM)" },
    { id: "quotation", name: "Quotation & Verification" },
    { id: "shopfloor", name: "Shop Floor Execution" },
    { id: "dispatch", name: "Dispatch (Active)" },
    { id: "completed", name: "Completed & Closed" },
  ],
};

const COLLECTION_LANE = {
  id: "collection",
  name: "Collection \u2014 Outstanding Invoices",
  short: "Collections",
  icon: "wallet",
  color: "#E64980",
  type: "collection",
  stations: COLLECTION_STATIONS,
};

const ALL_LANES = [LEDGER_LANE, ...JOB_LANES, COLLECTION_LANE];

function computeJobScore(job) {
  let score = 100;
  if (job.priority === "Critical") score -= 45;
  else if (job.priority === "Upcoming") score -= 20;
  const day = parseInt(job.delivery, 10);
  if (day <= 20) score -= 15;
  else if (day <= 23) score -= 5;
  score -= job.qty % 10;
  return Math.max(8, Math.min(98, score));
}

function buildJobs(clientsList, productsList, ownersList) {
  const jobs = [];
  let counter = 1050;
  JOB_LANES.forEach((lane, li) => {
    lane.stations.forEach((st, si) => {
      const numJobs = 2 + ((li + si) % 4);
      for (let k = 0; k < numJobs; k++) {
        counter += 1;
        const client = clientsList[(li * 3 + si * 2 + k) % clientsList.length];
        const product = productsList[(li + si + k) % productsList.length];
        const qty = 50 + ((li * (si + 1) + k * 7) % 450);
        const roll = (li * 2 + si + k) % 7;
        const priority =
          roll === 0 ? "Critical" : roll < 3 ? "Upcoming" : "Normal";
        const day = 18 + ((li + si + k) % 10);
        const job = {
          id: "RD2" + counter,
          jobNo: "RD2" + counter + String.fromCharCode(97 + (k % 6)),
          client,
          product,
          qty,
          laneId: lane.id,
          stationId: st.id,
          priority,
          owner: ownersList[(li + k) % ownersList.length],
          delivery: day + " Aug",
        };
        job.score = computeJobScore(job);
        jobs.push(job);
      }
    });
  });
  return jobs;
}

function buildInvoices(clientsList, jobsList, ownersList) {
  const invoices = [];
  const buckets = ["outstanding", "duesoon", "overdue", "followup", "partial"];
  let counter = 8800;
  clientsList.forEach((client, ci) => {
    const numInv = 3 + (ci % 3);
    for (let k = 0; k < numInv; k++) {
      counter += 1;
      const bucket = buckets[(ci + k) % buckets.length];
      const amount = 45000 + ((ci * 3700 + k * 5300) % 180000);
      const daysOverdue =
        bucket === "overdue"
          ? 30 + ((ci + k) % 60)
          : bucket === "partial"
            ? 10 + (k % 20)
            : 0;
      const dueIn = bucket === "duesoon" ? 2 + (k % 5) : null;
      const relatedJob = jobsList.find((j) => j.client === client);
      invoices.push({
        id: "INV" + counter,
        invoiceNo: "RDINV" + counter,
        client,
        jobNo: relatedJob ? relatedJob.jobNo : "\u2014",
        amount,
        stationId: bucket,
        daysOverdue,
        dueIn,
        owner: ownersList[(ci + k) % ownersList.length],
        lastFollowUp:
          bucket === "followup" || bucket === "overdue"
            ? 12 + ((ci + k) % 6) + " Aug"
            : "\u2014",
      });
    }
  });
  return invoices;
}

function mapBackendDataToJobs(
  enquiriesList = [],
  bomsList = [],
  ordersList = [],
  dtpJobsList = [],
  shopFloorJobsList = [],
  fgStoreJobsList = [],
) {
  const jobs = [];

  const getDeliveryDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const getPriority = (dateStr) => {
    if (!dateStr) return "Normal";
    const now = new Date();
    const delivery = new Date(dateStr);
    if (isNaN(delivery.getTime())) return "Normal";
    const diffTime = delivery - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 2) return "Critical";
    if (diffDays <= 7) return "Upcoming";
    return "Normal";
  };

  // 1. Parent Enquiries (Enquiry Intake & Design lanes)
  enquiriesList.forEach((enq) => {
    if (enq.is_cancelled || enq.status === "abandon") return;

    // To avoid duplicates, if this enquiry already has sub-jobs created, do not show it here
    const hasSubJobs = ordersList.some((so) => {
      const enqId = so.enquiry_id?._id || so.enquiry_id;
      return (
        enqId &&
        (enqId.toString() === enq._id?.toString() ||
          enqId.toString() === enq.id?.toString())
      );
    });
    if (hasSubJobs) return;

    let laneId = "";
    let stationId = "";

    if (enq.status === "enquiry" || !enq.status) {
      laneId = "enquiry";
      stationId = enq.is_designer_allocated ? "status" : "assign";
    } else if (enq.status === "design") {
      laneId = "design";
      if (!enq.is_designer_allocated) {
        stationId = "uploads";
      } else if (!enq.is_designer_completed) {
        stationId = "uploads";
      } else if (!enq.is_accept) {
        stationId = "review";
      } else {
        stationId = "ordertype";
      }
    } else {
      return;
    }

    jobs.push({
      id: enq._id || enq.id,
      jobNo: enq.job_no,
      client: enq.name || "Unknown Client",
      product: enq.product_name || "Unknown Product",
      qty: enq.product_quantity || 1,
      laneId,
      stationId,
      priority: getPriority(enq.delivery_date),
      owner: enq.cordinator?.name || enq.created_by?.name || "Unassigned",
      delivery: getDeliveryDate(enq.delivery_date),
      score: 100,
      isParentEnquiry: true,
    });
  });

  const getBaseJobNo = (str) => {
    if (!str) return "";
    return String(str)
      .replace(/-R\d*$/i, "")
      .replace(/[a-z]$/i, "")
      .trim();
  };

  // 2. Sub-jobs (Costing onwards) — grouped by unique main enquiry
  const ordersByEnquiryMap = new Map();
  ordersList.forEach((so) => {
    if (so.is_cancelled || !so.is_active) return;
    const enqIdStr =
      so.enquiry_id?._id?.toString() || so.enquiry_id?.toString();
    const baseNo = getBaseJobNo(so.sub_job_no || so.job_no);
    const key = enqIdStr || baseNo || so._id || so.id;

    if (!ordersByEnquiryMap.has(key)) {
      ordersByEnquiryMap.set(key, []);
    }
    ordersByEnquiryMap.get(key).push(so);
  });

  ordersByEnquiryMap.forEach((soList, key) => {
    const firstSo = soList[0];
    const mainJobNo =
      firstSo.enquiry_id?.job_no ||
      getBaseJobNo(firstSo.sub_job_no || firstSo.job_no) ||
      firstSo.sub_job_no;

    // Determine primary status/station for this main enquiry
    const hasClosed = soList.every((so) => so.status === "closed");
    const hasDispatched =
      !hasClosed &&
      soList.every(
        (so) => so.status === "complete" || so.status === "dispatch",
      );
    const hasShopfloor =
      !hasClosed &&
      !hasDispatched &&
      soList.some((so) => so.status === "process" || so.is_pushed_shop_floor);
    const hasVerifiedProceed =
      !hasClosed &&
      !hasDispatched &&
      !hasShopfloor &&
      soList.some((so) => so.is_verified_to_proceed);
    const hasBomVerified =
      !hasClosed &&
      !hasDispatched &&
      !hasShopfloor &&
      !hasVerifiedProceed &&
      soList.some((so) => so.is_bom_verified);
    const hasSoFilled =
      !hasClosed &&
      !hasDispatched &&
      !hasShopfloor &&
      !hasVerifiedProceed &&
      !hasBomVerified &&
      soList.some((so) => so.is_sales_order_filled);

    const baseJob = {
      id: key,
      jobNo: mainJobNo,
      client: firstSo.enquiry_id?.name || "Unknown Client",
      product: firstSo.enquiry_id?.product_name || "Unknown Product",
      qty: firstSo.enquiry_id?.product_quantity || 1,
      priority: getPriority(
        firstSo.delivery_date || firstSo.enquiry_id?.delivery_date,
      ),
      owner:
        firstSo.enquiry_id?.cordinator?.name ||
        firstSo.enquiry_id?.created_by?.name ||
        firstSo.created_by?.name ||
        "Unassigned",
      delivery: getDeliveryDate(
        firstSo.delivery_date || firstSo.enquiry_id?.delivery_date,
      ),
      score: 95,
      isParentEnquiry: false,
    };

    if (hasClosed) {
      jobs.push({
        ...baseJob,
        laneId: "dispatch",
        stationId: "completed",
      });
    } else if (hasDispatched) {
      const reqChallan = soList.some((so) => !so.is_challan_uploaded);
      const reqDispatch = soList.some((so) => so.status === "dispatch");
      jobs.push({
        ...baseJob,
        laneId: "dispatch",
        stationId: reqChallan
          ? "readydispatch"
          : reqDispatch
            ? "delivery"
            : "billing",
      });
    } else if (hasShopfloor) {
      let stId = "laser";

      for (const so of soList) {
        const dtpJob = dtpJobsList.find(
          (dtp) => dtp.sub_job_no === so.sub_job_no,
        );
        if (
          dtpJob &&
          dtpJob.status !== "Completed" &&
          dtpJob.status !== "Shop Floor"
        ) {
          stId = "dtp";
          break;
        }
        const fgJob = fgStoreJobsList.find((fg) => fg.job_no === so.sub_job_no);
        if (
          fgJob &&
          fgJob.status !== "Completed" &&
          fgJob.stage !== "COMPLETED"
        ) {
          const stage = String(fgJob.stage || "").toUpperCase();
          if (stage === "INWARD" || stage === "INVOICE") stId = "fgstore";
          else if (stage === "QC") stId = "qc";
          else if (stage === "PACKING") stId = "packing";
          break;
        }
        const sfJob = shopFloorJobsList.find(
          (sf) => sf.sub_job_no === so.sub_job_no,
        );
        if (sfJob && sfJob.status !== "Completed") {
          const proc = String(
            sfJob.process_name || sfJob.department || "",
          ).toLowerCase();
          if (proc.includes("laser") || proc.includes("cut")) stId = "laser";
          else if (proc.includes("paint")) stId = "painting";
          else if (proc.includes("uv") || proc.includes("print")) stId = "uv";
          else if (proc.includes("assembly")) stId = "assembly";
          else if (proc.includes("fg") || proc.includes("store"))
            stId = "fgstore";
          else if (proc.includes("qc") || proc.includes("inspection"))
            stId = "qc";
          else if (proc.includes("pack") || proc.includes("packing"))
            stId = "packing";
          break;
        }
      }

      jobs.push({
        ...baseJob,
        laneId: "shopfloor",
        stationId: stId,
      });
    } else if (hasVerifiedProceed) {
      jobs.push({
        ...baseJob,
        laneId: "quotation",
        stationId: "production",
      });
    } else if (hasBomVerified) {
      const targetSo = soList.find((so) => so.is_bom_verified) || firstSo;
      let stId = "releasegate";
      if (!targetSo.is_price_approved) stId = "quotesent";
      else if (!targetSo.is_pi_uploaded) stId = "quoteapproved";
      else if (!targetSo.is_pi_verified) stId = "pi";

      jobs.push({
        ...baseJob,
        laneId: "quotation",
        stationId: stId,
      });
    } else if (hasSoFilled) {
      const targetSo = soList.find((so) => so.is_sales_order_filled) || firstSo;
      jobs.push({
        ...baseJob,
        laneId: "costing",
        stationId: !targetSo.is_bom_filled ? "bom" : "costreview",
      });
    } else {
      jobs.push({
        ...baseJob,
        laneId: "design",
        stationId: firstSo.type === "sample" ? "sampleform" : "prodform",
      });
    }
  });

  return jobs;
}

export default function ClientServicingHub() {
  const dispatch = useDispatch();

  const loggedInUser = getUser();
  const userRoleLower = String(
    loggedInUser?.role?.name || loggedInUser?.role || "",
  ).toLowerCase();
  const isAdminOrManager =
    loggedInUser?.is_admin ||
    userRoleLower.includes("admin") ||
    userRoleLower.includes("superadmin") ||
    userRoleLower.includes("manager") ||
    userRoleLower.includes("head");
  const isExecutive =
    !isAdminOrManager &&
    (userRoleLower.includes("executive") ||
      userRoleLower.includes("client servicing"));
  const executiveName = loggedInUser?.name || "";

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const [clientFilter, setClientFilter] = useState(null);
  const [dueToday, setDueToday] = useState(false);
  const [viewMode, setViewMode] = useState("lane");
  const [mode, setMode] = useState(isExecutive ? "my" : "admin");
  const [currentUser, setCurrentUser] = useState(
    isExecutive ? executiveName : OWNERS[0] || "",
  );

  const ownerFilter = isExecutive && mode === "my" ? currentUser : null;

  useEffect(() => {
    dispatch(fetchUniqueClients());
    dispatch(fetchUniqueProducts());
    dispatch(fetchEnquiryCountsByUser());
    dispatch(fetchAllUsers({ limit: 1000 }));
  }, [dispatch]);

  const { clients, products, userEnquiryCounts, enquiryKPIStats } = useSelector(
    (state) => state.enquiry,
  );
  const { users } = useSelector((state) => state.user);
  const {
    counts: serverCounts,
    stats: serverStats,
    ownerCounts: serverOwnerCounts,
    dueTodayFloor: serverDueTodayFloor,
  } = useSelector((state) => state.clientServicingHub);

  useEffect(() => {
    dispatch(
      fetchClientServicingCounts({
        client: clientFilter,
        owner: ownerFilter,
        dueToday: dueToday ? "true" : "false",
      }),
    );
  }, [dispatch, clientFilter, ownerFilter, dueToday]);

  const dynamicClients = useMemo(() => {
    return clients && clients.length ? clients : CLIENTS;
  }, [clients]);

  const dynamicProducts = useMemo(() => {
    return products && products.length ? products : PRODUCTS;
  }, [products]);

  const dynamicOwners = useMemo(() => {
    if (!users || users.length === 0) return OWNERS;
    const filtered = users.filter((u) => {
      const r = String(u.role?.name || u.role || "").toLowerCase();
      return r.includes("client servicing") || r.includes("client service");
    });
    const list = filtered.map((u) => u.name).filter(Boolean);
    return list.length ? list : OWNERS;
  }, [users]);

  const JOBS = useMemo(() => {
    return [];
  }, []);

  const INVOICES = useMemo(() => {
    return buildInvoices(dynamicClients, JOBS, dynamicOwners);
  }, [dynamicClients, JOBS, dynamicOwners]);

  useEffect(() => {
    dispatch(fetchEnquiryKPIStats(clientFilter));
  }, [dispatch, clientFilter]);

  useEffect(() => {
    if (isExecutive) {
      if (executiveName && currentUser !== executiveName) {
        setCurrentUser(executiveName);
      }
    } else if (dynamicOwners.length && !dynamicOwners.includes(currentUser)) {
      setCurrentUser(dynamicOwners[0]);
    }
  }, [dynamicOwners, currentUser, isExecutive, executiveName]);

  const availableClients = useMemo(() => {
    const clientsList = dynamicClients;
    if (mode !== "my") return clientsList;
    const set = new Set(
      JOBS.filter((j) => j.owner === currentUser).map((j) => j.client),
    );
    return clientsList.filter((c) => set.has(c));
  }, [mode, currentUser, dynamicClients, JOBS]);

  const getLedgerJobs = (station, client, owner) => {
    if (serverCounts) {
      let count = 0;
      if (station.id === "all") {
        count = serverStats?.totalActive || 0;
      } else if (serverCounts[station.id]) {
        count = Object.values(serverCounts[station.id]).reduce(
          (a, b) => a + b,
          0,
        );
      } else if (station.id === "dispatch") {
        const d = serverCounts.dispatch || {};
        count = (d.readydispatch || 0) + (d.delivery || 0) + (d.billing || 0);
      } else if (station.id === "completed") {
        count = serverCounts.dispatch?.completed || 0;
      }
      return Array.from({ length: count }, (_, i) => ({
        id: `ledger_${station.id}_${i}`,
        priority: "Normal",
      }));
    }
    let rows = JOBS;
    if (station.id === "completed") {
      rows = rows.filter((j) => j.stationId === "completed");
    } else if (station.id === "dispatch") {
      rows = rows.filter(
        (j) => j.laneId === "dispatch" && j.stationId !== "completed",
      );
    } else if (station.id === "shopfloor") {
      rows = rows.filter((j) => j.laneId === "shopfloor");
    } else if (station.id !== "all") {
      rows = rows.filter((j) => j.laneId === station.id);
    }
    if (client) rows = rows.filter((j) => j.client === client);
    if (owner) rows = rows.filter((j) => j.owner === owner);
    return rows;
  };

  const getPhaseJobs = (lane, station, client, owner) => {
    if (serverCounts && serverCounts[lane.id]) {
      if (station && station.id !== "all") {
        const count = serverCounts[lane.id][station.id] || 0;
        return Array.from({ length: count }, (_, i) => ({
          id: `${lane.id}_${station.id}_${i}`,
          priority: "Normal",
        }));
      } else {
        const laneCounts = serverCounts[lane.id] || {};
        const total = Object.values(laneCounts).reduce((a, b) => a + b, 0);
        return Array.from({ length: total }, (_, i) => ({
          id: `${lane.id}_all_${i}`,
          priority: "Normal",
        }));
      }
    }
    let rows = JOBS.filter((j) => j.laneId === lane.id);
    if (station && station.id !== "all") {
      rows = rows.filter((j) => j.stationId === station.id);
    }
    if (client) rows = rows.filter((j) => j.client === client);
    if (owner) rows = rows.filter((j) => j.owner === owner);
    return rows;
  };

  const getCollectionInvoices = (station, client, owner) => {
    if (serverCounts && serverCounts.collection) {
      const count = serverCounts.collection[station.id] || 0;
      return Array.from({ length: count }, (_, i) => ({
        id: `collection_${station.id}_${i}`,
        amount: 0,
        stationId: station.id,
      }));
    }
    return [];
  };

  const getStationRows = (lane, station, client, owner) => {
    if (lane.type === "ledger") return getLedgerJobs(station, client, owner);
    if (lane.type === "jobs") return getPhaseJobs(lane, station, client, owner);
    if (lane.type === "collection")
      return getCollectionInvoices(station, client, owner);
    return [];
  };

  const getClientAggregates = (client, owner) => {
    if (serverCounts && serverCounts.collection) {
      const count =
        serverCounts.collection.clientwise ||
        serverCounts.collection.outstanding ||
        0;
      return Array.from({ length: count }, (_, i) => ({
        client: `Client_${i}`,
        count: 1,
        total: 0,
        oldest: 0,
      }));
    }
    return [];
  };

  // Memoized Search Results
  const searchResults = useMemo(() => {
    if (search.trim() === "") return { jobs: [], invoices: [] };
    const q = search.trim().toLowerCase();
    let jobResults = JOBS.filter(
      (j) =>
        j.jobNo.toLowerCase().includes(q) ||
        j.client.toLowerCase().includes(q) ||
        j.product.toLowerCase().includes(q),
    );
    let invResults = INVOICES.filter(
      (i) =>
        i.invoiceNo.toLowerCase().includes(q) ||
        i.client.toLowerCase().includes(q),
    );
    if (ownerFilter) {
      jobResults = jobResults.filter((j) => j.owner === ownerFilter);
      invResults = invResults.filter((i) => i.owner === ownerFilter);
    }
    return { jobs: jobResults.slice(0, 5), invoices: invResults.slice(0, 5) };
  }, [search, ownerFilter, JOBS, INVOICES]);

  // Main filtered jobs & invoices passed to summary cards and views
  const filteredJobs = useMemo(() => {
    let rows = JOBS;
    if (clientFilter) rows = rows.filter((j) => j.client === clientFilter);
    if (ownerFilter) rows = rows.filter((j) => j.owner === ownerFilter);
    return rows;
  }, [clientFilter, ownerFilter, JOBS]);

  const filteredInvoices = useMemo(() => {
    let rows = INVOICES;
    if (clientFilter) rows = rows.filter((i) => i.client === clientFilter);
    if (ownerFilter) rows = rows.filter((i) => i.owner === ownerFilter);
    return rows;
  }, [clientFilter, ownerFilter, INVOICES]);

  const handlePickJob = (job) => {
    setSelected({ laneId: job.laneId, stationId: job.stationId });
    setHighlightId(job.id);
    setSearch("");
  };

  const handlePickInvoice = (inv) => {
    setSelected({ laneId: "collection", stationId: inv.stationId });
    setHighlightId(inv.id);
    setSearch("");
  };

  const handleClientJump = (clientName) => {
    setClientFilter(clientName);
    setSelected(null);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setClientFilter(null);
    setSelected(null);
  };

  const handleUserChange = (newUser) => {
    setCurrentUser(newUser);
    setClientFilter(null);
    setSelected(null);
  };

  return (
    <div className="flex-1 min-w-0 bg-slate-50 min-h-screen pb-12">
      {/* Search and Filters Header */}
      <TopBar
        search={search}
        setSearch={setSearch}
        results={searchResults}
        onPickJob={handlePickJob}
        onPickInvoice={handlePickInvoice}
        legendOpen={legendOpen}
        setLegendOpen={setLegendOpen}
        clientFilter={clientFilter}
        setClientFilter={setClientFilter}
        dueToday={dueToday}
        setDueToday={setDueToday}
        availableClients={availableClients}
        mode={mode}
        setMode={handleModeChange}
        currentUser={currentUser}
        setCurrentUser={handleUserChange}
        ownersList={dynamicOwners}
      />

      {/* Due Today Across the Floor */}
      {dueToday && (
        <DueTodayAcrossFloor
          dueTodayFloor={serverDueTodayFloor}
          onSelectStation={setSelected}
        />
      )}

      {/* KPI Tiles Strip */}
      <KPIStrip
        stats={serverStats || enquiryKPIStats}
        jobs={filteredJobs}
        invoices={filteredInvoices}
      />

      {/* Client Filter Summary Banner */}
      <ClientSnapshot
        clientFilter={clientFilter}
        jobs={filteredJobs}
        invoices={filteredInvoices}
        onClear={() => setClientFilter(null)}
      />

      {/* CS Executives KRA Cards */}
      <TeamKRAScorecard
        jobs={
          clientFilter ? JOBS.filter((j) => j.client === clientFilter) : JOBS
        }
        invoices={
          clientFilter
            ? INVOICES.filter((i) => i.client === clientFilter)
            : INVOICES
        }
        ownersList={dynamicOwners}
        mode={mode}
        currentUser={currentUser}
        clientFilter={clientFilter}
        users={users}
        userEnquiryCounts={userEnquiryCounts}
        ownerCounts={serverOwnerCounts}
      />

      {/* Dashboard Sub Header and View toggles */}
      <div className="px-6 pt-6 pb-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Client Servicing &mdash; Activity Command Center
            {isExecutive && mode === "my" && (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-full">
                My View &mdash; {currentUser}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isExecutive && mode === "my"
              ? "Showing only your own jobs and invoices."
              : "Click any station to see the live list. Switch the view format or filter by client above."}
          </p>
        </div>

        {/* View Mode Selector (Swim Lane, Heatmap, Funnel) */}
        <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-lg shrink-0">
          {[
            { id: "lane", label: "Swim Lane", icon: "layers" },
            { id: "heatmap", label: "Heatmap", icon: "grid2" },
            { id: "funnel", label: "Funnel", icon: "trending" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition ${
                viewMode === v.id
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon name={v.icon} size={13} /> {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic View rendering */}
      {viewMode === "lane" && (
        <SwimLaneView
          allLanes={ALL_LANES}
          clientFilter={clientFilter}
          ownerFilter={ownerFilter}
          selected={selected}
          onSelectStation={setSelected}
          getStationRows={getStationRows}
          getClientAggregates={getClientAggregates}
          totalJobs={filteredJobs}
          totalInvoices={filteredInvoices}
          stats={serverStats || enquiryKPIStats}
        />
      )}

      {viewMode === "heatmap" && (
        <HeatmapView
          allLanes={ALL_LANES}
          clientFilter={clientFilter}
          ownerFilter={ownerFilter}
          selected={selected}
          onSelectStation={setSelected}
          getStationRows={getStationRows}
          getClientAggregates={getClientAggregates}
        />
      )}

      {viewMode === "funnel" && (
        <FunnelView
          clientFilter={clientFilter}
          ownerFilter={ownerFilter}
          selected={selected}
          onSelectStation={setSelected}
          getLedgerJobs={getLedgerJobs}
          getCollectionInvoices={getCollectionInvoices}
          ledgerLane={LEDGER_LANE}
          collectionLane={COLLECTION_LANE}
        />
      )}

      {/* Bottom slide-up drawer details table */}
      <DetailDrawer
        selected={selected}
        clientFilter={clientFilter}
        ownerFilter={ownerFilter}
        dueToday={dueToday}
        onClose={() => {
          setSelected(null);
          setHighlightId(null);
        }}
        highlightId={highlightId}
        onClientJump={handleClientJump}
        allLanes={ALL_LANES}
        getLedgerJobs={getLedgerJobs}
        getPhaseJobs={getPhaseJobs}
        getCollectionInvoices={getCollectionInvoices}
        getClientAggregates={getClientAggregates}
        jobLanes={JOB_LANES}
      />
    </div>
  );
}
