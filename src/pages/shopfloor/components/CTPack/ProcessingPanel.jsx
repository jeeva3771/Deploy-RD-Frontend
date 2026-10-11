import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { axiosInstance } from '../../../../utils/url/config';
import { updateCtPackJobLocal } from '../../../../reducer/ctPackReducer';
import { PBtn } from './PBtn';
import { PCard } from './PCard';
import { ShippingLabelModal } from './ShippingLabelModal';

export function ProcessingPanel({ job, onUpdate, onLog, advance }) {
  const dispatch = useDispatch();
  const [labelsGenerated, setLabelsGenerated] = useState(Boolean(job.labelsGenerated));
  const [labelsUploadedLocal, setLabelsUploaded] = useState(job.labelsUploaded || false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [labelModalMode, setLabelModalMode] = useState("generate");
  const [misLabelFile, setMisLabelFile] = useState(null);
  const [isUploadingMis, setIsUploadingMis] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Per-delivery AWB Label States
  const [itemAwbFiles, setItemAwbFiles] = useState({});
  const [itemAwbNumbers, setItemAwbNumbers] = useState({});
  const [uploadingItemIdx, setUploadingItemIdx] = useState(null);
  const [isUploadingAll, setIsUploadingAll] = useState(false);

  const hasExistingFiles = (job.sales_order?.product_files && job.sales_order.product_files.length > 0) ||
    (job.dispatchFiles && job.dispatchFiles.length > 0) ||
    job.instructionFile ||
    (job.dispatchFileRejections && job.dispatchFileRejections.length > 0) ||
    job.dispatchFileStatus === "rejected";

  const [fileStatus, setFileStatus] = useState(job.dispatchFileStatus || "pending");
  const [rejectionHistory, setRejectionHistory] = useState(job.dispatchFileRejections || []);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [tempRejectRemarks, setTempRejectRemarks] = useState("");

  React.useEffect(() => {
    if (job.dispatchFileStatus) {
      setFileStatus(job.dispatchFileStatus);
    }
    if (job.dispatchFileRejections) {
      setRejectionHistory(job.dispatchFileRejections);
    }
    if (job.labelsGenerated) {
      setLabelsGenerated(true);
    }

    const initialAwbs = {};
    if (Array.isArray(job.challanList) && job.challanList.length > 0) {
      job.challanList.forEach((c, idx) => {
        initialAwbs[idx] = c.awb || (job.awbNumbers && job.awbNumbers[idx]) || "";
      });
    } else if (Array.isArray(job.destinations) && job.destinations.length > 0) {
      job.destinations.forEach((d, idx) => {
        initialAwbs[idx] = d.awb || (job.awbNumbers && job.awbNumbers[idx]) || "";
      });
    } else if (Array.isArray(job.awbNumbers)) {
      job.awbNumbers.forEach((awb, idx) => {
        initialAwbs[idx] = awb || "";
      });
    }
    setItemAwbNumbers(prev => ({ ...initialAwbs, ...prev }));
  }, [job.dispatchFileStatus, job.dispatchFileRejections, job.labelsGenerated, job.challanList, job.destinations, job.awbNumbers]);

  const handleModalUpdate = async (data) => {
    if (data?.labelsGenerated) {
      setLabelsGenerated(true);
    }
    if (data?.labelsUploaded) {
      setLabelsUploaded(true);
    }
    if (onUpdate) {
      return await onUpdate(data);
    }
  };

  const updateDispatchStatusAPI = async (status, rejectionData = null) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("status", status);
      if (rejectionData) formData.append("rejection", JSON.stringify(rejectionData));

      if ((status === "approved" || status === "rejected") && selectedFiles.length > 0) {
        selectedFiles.forEach(f => formData.append("dispatch_files", f));
      }

      const res = await axiosInstance.patch(`/ct-pack/${job._id || job.id}/dispatch-status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setFileStatus(status);
        if (status === "rejected" && rejectionData) {
          if (res.data.job && res.data.job.dispatchFileRejections) {
            setRejectionHistory(res.data.job.dispatchFileRejections);
          } else {
            // fallback
            setRejectionHistory(prev => [
              ...prev,
              {
                type: rejectionData.type,
                fileNames: selectedFiles.map(f => f.name),
                remarks: rejectionData.remarks
              }
            ]);
          }
          setSelectedFiles([]);
        }

        // Notify parent component & Redux store so the state persists across modal closing/reopening
        if (onUpdate && res.data.job) {
          onUpdate({
            dispatchFileStatus: res.data.job.dispatchFileStatus,
            dispatchFileRejections: res.data.job.dispatchFileRejections,
            dispatchFiles: res.data.job.dispatchFiles,
            logs: res.data.job.logs
          });
        }

        toast.success(`Dispatch file ${status}`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error updating dispatch status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const rawDestinations = (job.destinations && job.destinations.length > 0)
    ? job.destinations
    : [{
      id: "d1",
      name: job.sales_order?.contact_person || job.client_name || job.client || "Client",
      addr: job.sales_order?.delivery_address || job.delivery_address || "Standard Delivery Address",
      qty: job.qcAcceptedQty || job.total_qty || job.qty || 1,
      contact_person: job.sales_order?.contact_person || "",
      contact_number: job.sales_order?.contact_number || job.sales_order?.mobile_no || "",
      delivery_mode: job.sales_order?.delivery_mode || "Courier",
      challanNo: job.challanNo || "N/A"
    }];

  const processItems = (job.challanList && Array.isArray(job.challanList) && job.challanList.length > 0)
    ? job.challanList.map((c, idx) => {
        const dest = rawDestinations.find(d => String(d.id || rawDestinations.indexOf(d)) === String(c.destId)) || rawDestinations[0] || {};
        return {
          id: c.id || `item_${idx}`,
          idx,
          challanNo: c.challanNo || job.challanNo || "N/A",
          qty: c.qty !== undefined ? c.qty : (dest.qty || 1),
          challanDate: c.challanDate || job.challanDate,
          name: dest.contact_person || dest.name || job.sales_order?.contact_person || job.client || "Client",
          addr: dest.addr || dest.deliveryLocation || dest.delivery_address || job.sales_order?.delivery_address || "Standard Delivery Address",
          contact_person: dest.contact_person || job.sales_order?.contact_person || "",
          contact_number: dest.contact_number || job.sales_order?.contact_number || job.sales_order?.mobile_no || "",
          delivery_mode: dest.delivery_mode || job.sales_order?.delivery_mode || "Courier",
          challanFile: c.challanFile || "",
          awb: c.awb || dest.awb || job.awbNumbers?.[idx] || "",
          awbFile: c.awbFile || c.misLabelFile || dest.awbFile || dest.misLabelFile || (job.misLabelFiles && job.misLabelFiles[idx]) || (idx === 0 ? (job.misLabelFile || "") : "")
        };
      })
    : rawDestinations.map((d, idx) => ({
        id: d.id || `item_${idx}`,
        idx,
        challanNo: d.challanNo || job.challanNo || "N/A",
        qty: d.qty || job.qcAcceptedQty || job.total_qty || 1,
        challanDate: job.challanDate,
        name: d.contact_person || d.name || job.sales_order?.contact_person || job.client || "Client",
        addr: d.addr || d.deliveryLocation || d.delivery_address || job.sales_order?.delivery_address || "Standard Delivery Address",
        contact_person: d.contact_person || job.sales_order?.contact_person || "",
        contact_number: d.contact_number || job.sales_order?.contact_number || job.sales_order?.mobile_no || "",
        delivery_mode: d.delivery_mode || job.sales_order?.delivery_mode || "Courier",
        challanFile: d.challanFile || job.challanFile || "",
        awb: d.awb || job.awbNumbers?.[idx] || "",
        awbFile: d.awbFile || d.misLabelFile || (job.misLabelFiles && job.misLabelFiles[idx]) || (idx === 0 ? (job.misLabelFile || "") : "")
      }));

  function generateLabels() {
    setLabelModalMode("generate");
    setShowLabelModal(true);
  }

  async function uploadSingleItemAwb(idx) {
    const file = itemAwbFiles[idx];
    const awbNo = itemAwbNumbers[idx] !== undefined ? itemAwbNumbers[idx] : (processItems[idx]?.awb || "");
    if (!file && !awbNo) {
      toast.error(`Please select an AWB label file or enter a tracking number for Delivery #${idx + 1}.`);
      return;
    }

    try {
      setUploadingItemIdx(idx);
      const formData = new FormData();
      if (file) {
        formData.append(`awb_label_item_${idx}`, file);
      }
      formData.append("misLabelUploaded", "true");

      const baseDests = Array.isArray(job.destinations) && job.destinations.length > 0 ? job.destinations : [];
      const currentAwbs = baseDests.length > 0
        ? baseDests.map((d, i) => i === idx ? awbNo : (d.awb || (job.awbNumbers && job.awbNumbers[i]) || ""))
        : (Array.isArray(job.awbNumbers) ? [...job.awbNumbers] : []);
      while (currentAwbs.length <= idx) currentAwbs.push("");
      currentAwbs[idx] = awbNo;
      formData.append("awbNumbers", JSON.stringify(currentAwbs));

      if (Array.isArray(job.challanList) && job.challanList.length > 0) {
        const updatedChallans = job.challanList.map((c, i) => {
          if (i === idx) return { ...c, awb: awbNo };
          return c;
        });
        formData.append("challanList", JSON.stringify(updatedChallans));
      }

      if (Array.isArray(job.destinations) && job.destinations.length > 0) {
        const updatedDests = job.destinations.map((d, i) => {
          if (i === idx) return { ...d, awb: awbNo };
          return d;
        });
        formData.append("destinations", JSON.stringify(updatedDests));
      }

      const res = await axiosInstance.patch(`/ct-pack/${job._id || job.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data) {
        const updatedJob = res.data?.job || res.data;
        toast.success(`AWB Label updated for Delivery #${idx + 1} (${processItems[idx]?.qty || 0} pcs)!`);
        
        dispatch(updateCtPackJobLocal({ 
          id: job.id, 
          patch: {
            ...updatedJob,
            id: updatedJob.sub_job_no || job.id
          }
        }));

        if (onLog) {
          onLog(`📤 Courier AWB label updated for Delivery #${idx + 1} (${processItems[idx]?.qty || 0} pcs)${file ? ' — ' + file.name : ''}${awbNo ? ' (AWB: ' + awbNo + ')' : ''}`);
        }

        setItemAwbFiles(prev => {
          const next = { ...prev };
          delete next[idx];
          return next;
        });
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to update AWB label for Delivery #${idx + 1}`);
    } finally {
      setUploadingItemIdx(null);
    }
  }

  async function uploadAllItemAwbs() {
    const indicesToUpload = Object.keys(itemAwbFiles).filter(k => itemAwbFiles[k]);
    if (indicesToUpload.length === 0) {
      toast.info("Please select at least one AWB label file first.");
      return;
    }

    try {
      setIsUploadingAll(true);
      const formData = new FormData();
      formData.append("misLabelUploaded", "true");

      indicesToUpload.forEach(idxStr => {
        const idx = parseInt(idxStr, 10);
        formData.append(`awb_label_item_${idx}`, itemAwbFiles[idx]);
      });

      const baseDests = Array.isArray(job.destinations) && job.destinations.length > 0 ? job.destinations : [];
      const currentAwbs = baseDests.length > 0
        ? baseDests.map((d, i) => (itemAwbNumbers[i] !== undefined ? itemAwbNumbers[i] : (d.awb || (job.awbNumbers && job.awbNumbers[i]) || "")))
        : (Array.isArray(job.awbNumbers) ? [...job.awbNumbers] : []);
      processItems.forEach((it, idx) => {
        const awbVal = itemAwbNumbers[idx] !== undefined ? itemAwbNumbers[idx] : (it.awb || "");
        if (awbVal) {
          while (currentAwbs.length <= idx) currentAwbs.push("");
          currentAwbs[idx] = awbVal;
        }
      });
      formData.append("awbNumbers", JSON.stringify(currentAwbs));

      if (Array.isArray(job.challanList) && job.challanList.length > 0) {
        const updatedChallans = job.challanList.map((c, i) => ({
          ...c,
          awb: itemAwbNumbers[i] !== undefined ? itemAwbNumbers[i] : (c.awb || "")
        }));
        formData.append("challanList", JSON.stringify(updatedChallans));
      }

      if (Array.isArray(job.destinations) && job.destinations.length > 0) {
        const updatedDests = job.destinations.map((d, i) => ({
          ...d,
          awb: itemAwbNumbers[i] !== undefined ? itemAwbNumbers[i] : (d.awb || "")
        }));
        formData.append("destinations", JSON.stringify(updatedDests));
      }

      const res = await axiosInstance.patch(`/ct-pack/${job._id || job.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data) {
        const updatedJob = res.data?.job || res.data;
        toast.success(`Successfully uploaded ${indicesToUpload.length} Courier AWB label(s)!`);
        
        dispatch(updateCtPackJobLocal({ 
          id: job.id, 
          patch: {
            ...updatedJob,
            id: updatedJob.sub_job_no || job.id
          }
        }));

        if (onLog) {
          onLog(`📤 Uploaded ${indicesToUpload.length} Courier AWB label files for MIS`);
        }
        setItemAwbFiles({});
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload AWB label files.");
    } finally {
      setIsUploadingAll(false);
    }
  }

  async function uploadMisLabelFile() {
    if (!misLabelFile) {
      toast.error("Please select an AWB label file to upload.");
      return;
    }
    try {
      setIsUploadingMis(true);
      const formData = new FormData();
      formData.append("dispatch_files", misLabelFile);
      formData.append("misLabelUploaded", "true");

      const res = await axiosInstance.patch(`/ct-pack/${job._id || job.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data) {
        toast.success("Consolidated Courier AWB label file uploaded & saved for MIS!");
        const updatedJob = res.data?.job || res.data;
        dispatch(updateCtPackJobLocal({ 
          id: job.id, 
          patch: {
            ...updatedJob,
            id: updatedJob.sub_job_no || job.id
          }
        }));
        if (onLog) {
          onLog(`📤 Consolidated Courier AWB label file uploaded for MIS — ${misLabelFile.name}`);
        }
        setMisLabelFile(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload master AWB label file.");
    } finally {
      setIsUploadingMis(false);
    }
  }

  const isLabelsSaved = Boolean(labelsGenerated || job.labelsGenerated);

  function proceed() {
    if (isSubmitting) return;

    if (hasExistingFiles && fileStatus !== "approved") {
      toast.error("Please explicitly Approve or Reject and Replace the dispatch file before proceeding.");
      return;
    }

    if (!isLabelsSaved) {
      toast.error("Cannot proceed. Please click '+ Generate Shipping Labels' above and click 'Save & Generate PDF' first.");
      return;
    }

    setIsSubmitting(true);

    const extraPatch = {};
    let logMsg = "→ Files processed & labels generated — physical packing started";

    if (hasExistingFiles && fileStatus === "approved" && selectedFiles.length > 0) {
      extraPatch.dispatch_files = selectedFiles;
      logMsg = `→ Files processed & labels generated — physical packing started | 📤 New dispatch files uploaded: ${selectedFiles.map(f => f.name).join(", ")}`;
    } else if (selectedFiles.length > 0) {
      extraPatch.dispatch_files = selectedFiles;
      logMsg = `→ Files processed & labels generated — physical packing started | 📤 Custom dispatch files uploaded: ${selectedFiles.map(f => f.name).join(", ")}`;
    }

    advance("packing", logMsg, extraPatch);
    setTimeout(() => setIsSubmitting(false), 400);
  }

  async function handleDownloadDispatchFile() {
    const hasDispatchFiles = (job.sales_order?.product_files && job.sales_order.product_files.length > 0) || (job.dispatchFiles && job.dispatchFiles.length > 0);
    if (hasDispatchFiles) {
      setIsDownloading(true);
      onLog(`📥 Downloading dispatch file(s) (ZIP)`);
      toast.info(`Generating ZIP file...`);

      try {
        const response = await axiosInstance.get(`/ct-pack/${job._id}/download-dispatch`, {
          responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${job.id}_pack_file.zip`; // job.id is sub_job_no here
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(`ZIP downloaded successfully!`);
        onLog(`ZIP downloaded successfully!`);
      } catch (error) {
        console.error("Error downloading zip:", error);
        toast.error("Failed to download ZIP file");
      } finally {
        setIsDownloading(false);
      }
    } else {
      toast.error("No dispatch files found.");
    }
  }



  return (
    <PCard title="Step 5 — Process File & Generate Labels" icon="⚙️" color="#8B5CF6" bg="#F5F3FF">
      <div className="rdpk-grid-2" style={{ marginBottom: 12 }}>
        <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#7C3AED", textTransform: "uppercase", marginBottom: 6 }}>📋 Dispatch File</div>
          {hasExistingFiles ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B", lineHeight: 1.6, marginBottom: 8 }}>
                Destinations / DC: <b style={{ color: "#0C1A2E" }}>{processItems.length}</b><br />
                Total Qty: <b style={{ color: "#0C1A2E" }}>{job.qcAcceptedQty || job.total_qty || job.qty} pcs</b>
              </div>

              {(fileStatus === "pending" || fileStatus === "approved") && (
                <div style={{ marginBottom: 10 }}>
                  <PBtn sm onClick={handleDownloadDispatchFile} disabled={isDownloading} color="#8B5CF6" bg="#F5F3FF" border="#DDD6FE">{isDownloading ? "⏳ Downloading zip..." : "📥 Download All Files (ZIP)"}</PBtn>
                </div>
              )}


              {fileStatus === "pending" && (
                <div style={{ display: "flex", gap: "10px", marginTop: "12px", borderTop: "1px dashed #DDD6FE", paddingTop: "12px" }}>
                  <PBtn sm onClick={() => updateDispatchStatusAPI("approved")} color="#059669" bg="#D1FAE5" border="#A7F3D0" disabled={isSubmitting}>✓ Approve File</PBtn>
                  <PBtn sm onClick={() => setRejectModalOpen(true)} color="#EF4444" bg="#FEE2E2" border="#FECACA" disabled={isSubmitting}>✕ Reject File</PBtn>
                </div>
              )}

              {fileStatus === "approved" && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px" }}>
                  <div style={{ padding: "8px 12px", background: "#ECFDF5", color: "#065F46", borderRadius: "8px", fontSize: "13px", fontWeight: "700", border: "1px solid #A7F3D0", display: "inline-block" }}>
                    ✅ Dispatch File Approved
                  </div>
                </div>
              )}

              {rejectionHistory.length > 0 && (
                <div style={{ marginTop: "12px", borderTop: "1px dashed #DDD6FE", paddingTop: "12px" }}>
                  {rejectionHistory.map((rej, idx) => (
                    <div key={idx} style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#EF4444", marginBottom: 4 }}>✕ FILE REJECTED (Attempt {idx + 1})</div>
                        <div style={{ fontSize: 13, color: "#991B1B", fontWeight: 500, lineHeight: 1.5 }}>
                          <b>Remarks:</b> {rej.remarks}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                        {rej.fileUrls && rej.fileUrls.length > 0 ? (
                          rej.fileUrls.map((url, fIdx) => (
                            <a
                              key={fIdx}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              download
                              style={{ padding: "4px 8px", fontSize: 12, borderRadius: 4, border: "1px solid #CBD5E1", background: "#FFF", color: "#334155", cursor: "pointer", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
                            >
                              📥 Download {rej.fileNames && rej.fileNames[fIdx] ? (rej.fileNames[fIdx].length > 15 ? rej.fileNames[fIdx].substring(0, 15) + "..." : rej.fileNames[fIdx]) : `File ${fIdx + 1}`}
                            </a>
                          ))
                        ) : (
                          <div style={{ fontSize: 11, color: "#64748B", fontStyle: "italic" }}>No file attached</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {fileStatus === "rejected" && (
                <div style={{ marginTop: "12px" }}>

                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>Upload corrected file:</div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files);
                      setSelectedFiles((prev) => [...prev, ...files]);
                    }}
                    onClick={() => document.getElementById("dispatch-file-picker").click()}
                    style={{ border: "2px dashed #DDD6FE", borderRadius: 8, padding: "16px 12px", textAlign: "center", background: "#FDFDFD", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#F9F8FF"}
                    onMouseOut={(e) => e.currentTarget.style.background = "#FDFDFD"}
                  >
                    <input
                      id="dispatch-file-picker"
                      type="file"
                      multiple
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        setSelectedFiles((prev) => [...prev, ...files]);
                      }}
                    />
                    <div style={{ fontSize: 24, marginBottom: 4 }}>📄</div>
                    <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Drag & drop or Click to select new file</div>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Selected New Files:</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 100, overflowY: "auto", marginBottom: 10 }}>
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", background: "#F1F5F9", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                            <span style={{ color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>{file.name}</span>
                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                              <a
                                href={URL.createObjectURL(file)}
                                download={file.name}
                                style={{ color: "#0EA5E9", textDecoration: "none", cursor: "pointer", fontSize: 13 }}
                                title="Download"
                                onClick={(e) => e.stopPropagation()}
                              >
                                📥
                              </a>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
                                }}
                                style={{ color: "#EF4444", cursor: "pointer", fontSize: 12 }}
                                title="Remove"
                              >
                                ✕
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", gap: "10px", marginTop: "12px", borderTop: "1px dashed #DDD6FE", paddingTop: "12px" }}>
                        <PBtn sm onClick={() => {
                          updateDispatchStatusAPI("approved");
                        }} color="#059669" bg="#D1FAE5" border="#A7F3D0" disabled={isSubmitting}>✓ Approve File</PBtn>
                        <PBtn sm onClick={() => {
                          setRejectModalOpen(true);
                        }} color="#EF4444" bg="#FEE2E2" border="#FECACA" disabled={isSubmitting}>✕ Reject File</PBtn>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>No dispatch file found. Upload files:</div>
              <div
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files);
                  setSelectedFiles((prev) => [...prev, ...files]);
                }}
                onClick={() => document.getElementById("dispatch-file-picker").click()}
                style={{ border: "2px dashed #DDD6FE", borderRadius: 8, padding: "16px 12px", textAlign: "center", background: "#FDFDFD", cursor: "pointer", transition: "all 0.2s" }}
                onMouseOver={(e) => e.currentTarget.style.background = "#F9F8FF"}
                onMouseOut={(e) => e.currentTarget.style.background = "#FDFDFD"}
              >
                <input
                  id="dispatch-file-picker"
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setSelectedFiles((prev) => [...prev, ...files]);
                  }}
                />
                <div style={{ fontSize: 24, marginBottom: 4 }}>📄</div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Drag & drop or Click to select files</div>
              </div>
              {selectedFiles.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Selected Files:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 100, overflowY: "auto", marginBottom: 10 }}>
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", background: "#F1F5F9", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        <span style={{ color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>{file.name}</span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          style={{ color: "#EF4444", cursor: "pointer" }}
                        >
                          ✕
                        </span>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#059669", textTransform: "uppercase", marginBottom: 6 }}>
            🏷 Shipping Labels ({processItems.length} Separate {processItems.length > 1 ? "Labels" : "Label"})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10, maxHeight: 160, overflowY: "auto" }}>
            {(() => {
              let cumulative = 0;
              return processItems.map((item, idx) => {
                const cQty = Number(item.qty) || 0;
                const locked = cumulative < (job.deliveredQty || 0);
                cumulative += cQty;

                return (
                  <div key={item.id || idx} style={{ background: "white", padding: "8px 10px", borderRadius: 6, border: "1px solid #A7F3D0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, flexWrap: "wrap", gap: 6 }}>
                    <div>
                      <div style={{ fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                        <span>#{idx + 1} DC: <span style={{ color: "#1E40AF", fontFamily: "monospace" }}>{item.challanNo}</span></span>
                        {locked && <span style={{ fontSize: 10, background: "#FEF2F2", color: "#991B1B", padding: "1px 6px", borderRadius: 4, border: "1px solid #FECACA" }}>🔒 Dispatched</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>
                        To: {item.addr && item.addr.length > 28 ? item.addr.substring(0, 28) + "..." : (item.addr || item.name)}
                      </div>
                    </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#059669", fontWeight: 900, background: "#ECFDF5", padding: "2px 6px", borderRadius: 4 }}>
                    {item.qty} pcs
                  </span>
                </div>
              </div>
            );
          });
        })()}
      </div>
          <div className="rdpk-flex-wrap">
            <PBtn sm onClick={generateLabels} color="#059669" bg="#ECFDF5" border="#A7F3D0">
              {labelsGenerated ? "✓ Labels Ready — View / Print Labels" : "🖨 Generate Separate Labels"}
            </PBtn>
          </div>

          {labelsGenerated && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #A7F3D0", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => {
                  setLabelModalMode("preview");
                  setShowLabelModal(true);
                }}
                style={{ background: "#059669", color: "white", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, boxShadow: "0 2px 4px rgba(5,150,105,0.15)" }}
              >
                👁 Preview Labels
              </button>

              <button
                type="button"
                onClick={() => {
                  setLabelModalMode("print");
                  setShowLabelModal(true);
                }}
                style={{ background: "#7C3AED", color: "white", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, boxShadow: "0 2px 4px rgba(124,58,237,0.15)" }}
              >
                🖨 Print Labels
              </button>

              <button
                type="button"
                onClick={() => {
                  setLabelModalMode("download");
                  setShowLabelModal(true);
                }}
                style={{ background: "#0284C7", color: "white", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, boxShadow: "0 2px 4px rgba(2,132,199,0.15)" }}
              >
                📥 Download Label PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Courier AWB Labels (for MIS) */}
      <div style={{ background: "#F0F9FF", border: "1.5px solid #BAE6FD", borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#0369A1", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>
              <span>📤 Courier AWB Labels (for MIS)</span>
              <span style={{ fontSize: 11, background: "#E0F2FE", color: "#0284C7", padding: "2px 8px", borderRadius: 10, fontWeight: 800 }}>
                {processItems.filter(item => item.awbFile).length} / {processItems.length} Attached
              </span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0284C7", marginTop: 2 }}>
              Upload courier AWB labels based on each delivery's specific quantity and destination for MIS tracking.
            </div>
          </div>

          {Object.keys(itemAwbFiles).filter(k => itemAwbFiles[k]).length > 1 && (
            <PBtn sm color="#0369A1" bg="#BAE6FD" border="#7DD3FC" onClick={uploadAllItemAwbs} disabled={isUploadingAll}>
              {isUploadingAll ? "⏳ Uploading All..." : `✓ Upload All Selected (${Object.keys(itemAwbFiles).filter(k => itemAwbFiles[k]).length} Files)`}
            </PBtn>
          )}
        </div>

        {/* Per-Delivery AWB Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(() => {
            let cumulativeMis = 0;
            return processItems.map((item, idx) => {
              const cQty = Number(item.qty) || 0;
              const locked = cumulativeMis < (job.deliveredQty || 0);
              cumulativeMis += cQty;

              const hasAwbFile = Boolean(item.awbFile);
              const isItemUploading = uploadingItemIdx === idx || isUploadingAll;
              const selectedFile = itemAwbFiles[idx];
              const currentAwbVal = itemAwbNumbers[idx] !== undefined ? itemAwbNumbers[idx] : (item.awb || "");
              const hasChanged = selectedFile || (currentAwbVal !== (item.awb || ""));

              return (
                <div
                  key={item.id || idx}
                  style={{
                    background: hasAwbFile ? "#F8FAFC" : "white",
                    border: hasAwbFile ? "1.5px solid #CBD5E1" : "1.5px solid #BAE6FD",
                    borderRadius: 8,
                    padding: "10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 900, color: "#0F172A", fontSize: 13 }}>
                        Delivery #{idx + 1}
                      </span>
                      <span style={{ background: "#EEF2F6", color: "#1E293B", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}>
                        DC: {item.challanNo}
                      </span>
                      {locked && <span style={{ fontSize: 10, background: "#FEF2F2", color: "#991B1B", padding: "1px 6px", borderRadius: 4, border: "1px solid #FECACA" }}>🔒 Dispatched</span>}
                      <span style={{ background: "#ECFDF5", color: "#047857", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 900, border: "1px solid #A7F3D0" }}>
                        {item.qty} pcs
                      </span>
                  </div>

                  <div>
                    {hasAwbFile ? (
                      <span style={{ fontSize: 11, background: "#DCFCE7", color: "#15803D", padding: "3px 8px", borderRadius: 6, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        ✓ AWB Attached
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, background: "#FEF3C7", color: "#B45309", padding: "3px 8px", borderRadius: 6, fontWeight: 800 }}>
                        Pending AWB Label
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>
                  <b style={{ color: "#334155" }}>Destination:</b> {item.name ? `${item.name} — ` : ""}{item.addr}
                </div>

                {/* Tracking & Upload Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                  <div style={{ flex: "1 1 150px", minWidth: 140 }}>
                    <input
                      type="text"
                      placeholder="AWB / Tracking #"
                      value={currentAwbVal}
                      onChange={(e) => setItemAwbNumbers(prev => ({ ...prev, [idx]: e.target.value }))}
                      disabled={locked}
                      style={{
                        width: "100%",
                        padding: "5px 8px",
                        fontSize: 12,
                        borderRadius: 6,
                        border: "1px solid #CBD5E1",
                        outline: "none",
                        background: locked ? "#F1F5F9" : "white",
                        fontFamily: "monospace",
                        color: "#0F172A",
                        cursor: locked ? "not-allowed" : "text"
                      }}
                    />
                  </div>

                  <div style={{ flex: "2 1 220px", display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.zip"
                      disabled={locked}
                      onChange={(e) => {
                        const f = e.target.files[0];
                        if (f) {
                          setItemAwbFiles(prev => ({ ...prev, [idx]: f }));
                        }
                      }}
                      style={{
                        flex: 1,
                        border: "1px solid #CBD5E1",
                        borderRadius: 6,
                        padding: "3px 6px",
                        fontSize: 11,
                        background: locked ? "#F1F5F9" : "white",
                        cursor: locked ? "not-allowed" : "pointer"
                      }}
                    />

                    {hasChanged && (
                      <PBtn
                        sm
                        color="#0369A1"
                        bg="#E0F2FE"
                        border="#BAE6FD"
                        onClick={() => uploadSingleItemAwb(idx)}
                        disabled={isItemUploading}
                      >
                        {isItemUploading ? "Saving..." : "Upload AWB"}
                      </PBtn>
                    )}
                  </div>

                  {hasAwbFile && (
                    <div>
                      <a
                        href={item.awbFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#0284C7",
                          textDecoration: "none",
                          background: "#E0F2FE",
                          padding: "5px 10px",
                          borderRadius: 6,
                          border: "1px solid #BAE6FD"
                        }}
                      >
                        📥 View / Download AWB
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          });
        })()}
        </div>


      </div>

      {!isLabelsSaved && (
        <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 10, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#991B1B" }}>
            Shipping Labels Pending: Click "+ Generate Shipping Labels" above and click "Save & Generate PDF" to generate label PDF before proceeding to Physical Packing.
          </span>
        </div>
      )}

      <PBtn onClick={proceed} disabled={isSubmitting || !isLabelsSaved} full color="#0EA5E9" bg="#E0F2FE" border="#BAE6FD">
        {isSubmitting ? "Processing..." : "Proceed to Physical Packing →"}
      </PBtn>

      {/* Reject File Modal */}
      {rejectModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "#FFF", borderRadius: 12, width: 420, maxWidth: "90%", padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 18, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>✕</span> Reject Dispatch File
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
              Please provide the reason for rejecting the current dispatch file. You will need to upload a corrected file afterwards.
            </p>
            <textarea
              value={tempRejectRemarks}
              onChange={e => setTempRejectRemarks(e.target.value)}
              placeholder="Reason for rejection (Mandatory) *"
              rows={3}
              style={{ width: "100%", border: "1.5px solid #EF4444", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", background: "#FEF2F2", color: "#0F172A", marginBottom: 20, resize: "vertical" }}
              autoFocus
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                onClick={() => { setRejectModalOpen(false); setTempRejectRemarks(""); }}
                style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F1F5F9", color: "#64748B", fontWeight: 700, cursor: "pointer", transition: "background 0.2s" }}
                onMouseOver={(e) => e.currentTarget.style.background = "#E2E8F0"}
                onMouseOut={(e) => e.currentTarget.style.background = "#F1F5F9"}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!tempRejectRemarks.trim()) {
                    toast.error("Please provide a reason for rejection.");
                    return;
                  }

                  updateDispatchStatusAPI("rejected", {
                    type: selectedFiles.length > 0 ? "new" : "existing",
                    remarks: tempRejectRemarks,
                    fileNames: selectedFiles.map(f => f.name)
                  });

                  setRejectModalOpen(false);
                  setTempRejectRemarks("");
                }}
                style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#EF4444", color: "#FFF", fontWeight: 700, cursor: "pointer", transition: "background 0.2s", boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)" }}
                onMouseOver={(e) => e.currentTarget.style.background = "#DC2626"}
                onMouseOut={(e) => e.currentTarget.style.background = "#EF4444"}
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {showLabelModal && (
        <ShippingLabelModal
          job={job}
          onClose={() => setShowLabelModal(false)}
          onUpdate={handleModalUpdate}
          onLog={onLog}
          isPreviewOnly={labelModalMode === "preview" || labelModalMode === "print" || labelModalMode === "download"}
          autoPrint={labelModalMode === "print"}
          autoDownload={labelModalMode === "download"}
          showAllLabels={labelModalMode === "preview" || labelModalMode === "download"}
        />
      )}
    </PCard>
  );
}
