export const OPERATORS = ['Ravi Kumar', 'Meena S', 'Suresh P', 'Aisha K'];
export const GST_OPTIONS = [0, 5, 10];

export const STAGE_MESSAGES = {
  INWARD: 'Awaiting first material inward from production.',
  QC: 'Batch is in Quality Audit Queue — awaiting inspector sign-off before it can move to Packing.',
  PACKING: 'QC passed. Job is queued in Packing for carton/pallet assignment.',
  INVOICE: 'Packed and ready — awaiting invoice generation for dispatch.',
  DISPATCHED: 'Job dispatched and invoiced. Cycle complete.',
};