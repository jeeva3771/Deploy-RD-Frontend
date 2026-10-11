import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../utils/url/config";

export const fetchCtPackJobs = createAsyncThunk(
    "ctPack/fetchJobs",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/ct-pack", { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const submitCtPack = createAsyncThunk(
    "ctPack/pack",
    async ({ jobId, payload }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/ct-pack/${jobId}/pack`, payload);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateCtPackJobDb = createAsyncThunk(
    "ctPack/updateJobDb",
    async ({ id, patch }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.patch(`/ct-pack/${id}`, patch);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    jobs: [],
    counts: { 'Pending': 0, 'Packing in Progress': 0, 'Packed': 0, 'ALL': 0 },
    pagination: { page: 1, limit: 8, total: 0, totalPages: 1 },
    filters: { status: 'ALL', search: '' },
    loading: false,
    error: null,
};

const ctPackSlice = createSlice({
    name: "ctPack",
    initialState,
    reducers: {
        setCtPackFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        setCtPackPagination: (state, action) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },
        clearCtPackError: (state) => {
            state.error = null;
        },
        updateCtPackJobLocal: (state, action) => {
            const { id, patch } = action.payload;
            const idx = state.jobs.findIndex(j => j.id === id);
            if (idx !== -1) {
                state.jobs[idx] = { ...state.jobs[idx], ...patch };
            }
        },
        addCtPackLogLocal: (state, action) => {
            const { id, msg, dt } = action.payload;
            const idx = state.jobs.findIndex(j => j.id === id);
            if (idx !== -1) {
                state.jobs[idx].logs.push({ msg, dt });
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCtPackJobs.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCtPackJobs.fulfilled, (state, action) => {
                state.loading = false;
                const { data, counts, pagination } = action.payload || {};

                if (counts) state.counts = counts;
                if (pagination) state.pagination = pagination;

                // Map the data right in the reducer
                state.jobs = (data || action.payload || []).map(j => ({
                    _id: j._id,
                    id: j.sub_job_no,
                    job_no: j.job_no,
                    client: j.client_name,
                    client_name: j.client_name,
                    product: j.product_name,
                    product_name: j.product_name,
                    product_image: j.product_image,
                    qty: j.total_qty,
                    total_qty: j.total_qty,
                    fgReceivedQty: j.received_from_qc || 0,
                    received_from_qc: j.received_from_qc || 0,
                    packed_qty: j.packed_qty || 0,
                    pending_pack: (j.received_from_qc || 0) - (j.packed_qty || 0),
                    job_completion_date: j.job_completion_date,
                    delivery_date: j.delivery_date,
                    stage: j.stage || "qc_pending",
                    status: j.status,

                    invoiceNo: j.invoiceNo || "",
                    clientContact: j.clientContact || "",
                    sales_order: j.sales_order || null,

                    qcAcceptedQty: j.qcAcceptedQty || 0,
                    qcAcceptedBy: j.qcAcceptedBy || "",
                    qcAcceptedDt: j.qcAcceptedDt || "",
                    qcNote: j.qcNote || "",
                    qcPartial: j.qcPartial || false,
                    qc_good_qty: j.qc_good_qty || 0,
                    qc_bad_qty: j.qc_bad_qty || 0,
                    qc_status: j.qc_status || "",
                    qc_completed: j.qc_completed || false,

                    pmatStatus: j.pmatStatus || "pending",
                    pmatItems: j.pmatItems?.length ? j.pmatItems.map(p => ({
                        id: p._id || p.id,
                        name: p.name || p.itemType || "Packing Material",
                        qty: p.total_qty || p.qty || 0,
                        unit: p.unit || "nos",
                        received: p.received || false,
                        receivedQty: p.receivedQty || 0,
                        issued_qty: p.issued_qty || 0
                    })) : [
                        { id: "pm1", name: 'No Packing Data Found', qty: 0, unit: "-", received: true, receivedQty: 0, issued_qty: 0 }
                    ],

                    instructionType: j.instructionType || "excel",
                    instructionFile: j.instructionFile || "dispatch_list.xlsx",
                    instructionNote: j.instructionNote || "Instructions for packing",

                    dispatchFiles: j.dispatchFiles || [],
                    dispatchFileStatus: j.dispatchFileStatus || "pending",
                    dispatchFileRejections: j.dispatchFileRejections || [],

                    destinationType: j.destinationType || (j.sales_order?.multi_deliveries?.length > 0 ? "multiple" : "single"),
                    destinations: j.destinations?.length ? j.destinations : (
                        j.sales_order?.multi_deliveries?.length > 0
                            ? j.sales_order.multi_deliveries.map((md, idx) => ({
                                id: "d_" + idx,
                                name: md.companyName || md.company_name || md.contactName || md.contact_person || "",
                                addr: md.deliveryLocation || md.delivery_address || "",
                                qty: Number(md.quantity) || 0,
                                contact_person: md.contactName || md.contact_person || "",
                                contact_number: md.contactNumber || md.contact_number || md.mobile_no || "",
                                delivery_mode: md.deliveryMode || md.delivery_mode || "",
                                custom_delivery_mode: md.customDeliveryMode || md.custom_delivery_mode || "",
                                who_will_pay: md.whoWillPay || md.who_will_pay || "",
                                courier_amount: md.courierAmount || md.courier_amount || "",
                                add_in_invoice: md.addInInvoice || md.add_in_invoice || false,
                                awb: "", courier: "", status: "pending"
                            }))
                            : []
                    ),

                    dispatchType: j.dispatchType || "courier",
                    courierName: j.courierName || "",
                    awbNumbers: (j.destinations && j.destinations.some(d => d && d.awb))
                        ? j.destinations.map((d, i) => (d && d.awb ? String(d.awb).trim() : ((j.awbNumbers && j.awbNumbers[i]) || "")))
                        : (j.awbNumbers || []),
                    shipments: j.shipments || [],
                    dispatchDt: j.dispatchDt || "",
                    expectedDelivery: j.expectedDelivery || "",
                    deliveredQty: j.deliveredQty || 0,

                    handDelivery: j.handDelivery?.length
                        ? j.handDelivery
                        : (j.handDeliveryBy ? [{
                            id: "hd_legacy",
                            handDeliveryBy: j.handDeliveryBy,
                            handDeliveryCharge: j.handDeliveryCharge || 0,
                            handDeliveryMode: j.handDeliveryMode || "",
                            dispatchDt: j.dispatchDt || "",
                            qty: j.deliveredQty || j.total_qty || 0
                        }] : []),

                    clientPickup: j.clientPickup?.length
                        ? j.clientPickup
                        : (j.pickupPersonName ? [{
                            id: "pu_legacy",
                            pickupPersonName: j.pickupPersonName,
                            pickupMode: j.pickupMode || "",
                            dispatchDt: j.dispatchDt || "",
                            qty: j.deliveredQty || j.total_qty || 0
                        }] : []),

                    labelsGenerated: j.labelsGenerated || false,
                    labelsUploaded: j.labelsUploaded || false,
                    labelFile: j.labelFile || "",
                    misLabelFile: j.misLabelFile || "",
                    misLabelUploaded: j.misLabelUploaded || false,
                    packingDt: j.packingDt || "",
                    packedBy: j.packedBy || "",
                    boxCount: j.boxCount !== undefined ? j.boxCount : 0,
                    packingNote: j.packingNote || "",
                    challanNo: j.challanNo || "",
                    challanDate: j.challanDate || "",
                    challanNote: j.challanNote || "",
                    challanFile: j.challanFile || "",
                    challanFiles: j.challanFiles || [],
                    challanList: j.challanList || [],
                    misLabelFiles: j.misLabelFiles || [],
                    completedDt: j.completedDt || "",

                    logs: j.logs || []
                }));
            })
            .addCase(fetchCtPackJobs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setCtPackFilters, setCtPackPagination, clearCtPackError, updateCtPackJobLocal, addCtPackLogLocal } = ctPackSlice.actions;
export default ctPackSlice.reducer;
