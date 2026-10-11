import React, { useRef, useState, useEffect, useMemo } from "react";
import { getFileNamev2 } from "../../../utils/helper/FilenameURL";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import { downloadFile } from "../../../reducer/standalone_bomReducer";
import { updateBOM, fetchAllBOMs } from "../../../reducer/bomReducer";
import { updateSampleOrderById } from "../../../reducer/sampleSalesorderReducer";
import { fetchAllItems, fetchItemsStockByIds, updateItem } from "../../../reducer/inventory/itemReducer";
import { fetchCustomItemsStockByIds } from "../../../reducer/inventory/customItemReducer";
import { addRFQs, fetchItems } from "../../../reducer/rfqReducer";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import JobDetailsPopup from "./JobDetailsPopup";
import { useAuthData } from "../../../utils/hooks/useAuthData";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ImageLightbox from "../../common/ImageLightbox";
const combineMaterials = (materialsList) => {
  const grouped = {};
  materialsList.forEach(m => {
    const size = m.input?.size || m.specs || '';
    const color = m.color || '';
    const thickness = m.thickness || '';
    const unit = m.input?.unit || '';
    const name = m.material_name || '';
    const id = m.item_id || '';

    // const key = `${id}_${name.toLowerCase()}_${size.toLowerCase().replace(/\s+/g, '')}_${color.toLowerCase()}_${thickness.toLowerCase()}_${unit.toLowerCase()}`;
    const key = `${name.toLowerCase()}_${size.toLowerCase().replace(/\s+/g, '')}`;
    console.log("key", key);

    if (!grouped[key]) {
      grouped[key] = {
        ...m,
        input: m.input ? { ...m.input } : {},
      };
      grouped[key].final_total = m.final_total || 0;
      if (grouped[key].input) {
        grouped[key].input.quantity = m.input?.quantity || 0;
      }
    } else {
      grouped[key].final_total = (grouped[key].final_total || 0) + (m.final_total || 0);
      if (grouped[key].input) {
        grouped[key].input.quantity = (grouped[key].input.quantity || 0) + (m.input?.quantity || 0);
      }
    }
  });
  return Object.values(grouped);
};

const ProductViewActionDrawer = ({ show, onClose, data, fetchSampleorders }) => {
  console.log("data", data);

  const dispatch = useDispatch();
  const { downloadLoading } = useSelector(state => state.standalonebom);
  const { boms, loading } = useSelector(state => state.bom);
  const { userId, userRole, isHead, ProductionRole, AdminRole, SalesRole } = useAuthData();

  const fileInputsRef = useRef({});
  const [showJobDetailsPopup, setShowJobDetailsPopup] = useState(false);
  const [artworkConfirmed, setArtworkConfirmed] = useState(data?.is_pushed_shop_floor || false);
  const [jobCardConfirmed, setJobCardConfirmed] = useState(data?.is_pushed_shop_floor || false);
  const [pushedToShopFloor, setPushedToShopFloor] = useState(data?.is_pushed_shop_floor || false);
  const [previewImage, setPreviewImage] = useState(null);

  const [processBlocks, setProcessBlocks] = useState([
    { id: 1, groupId: "", processId: "", activeTab: "PRODUCTION", localFile: null, instruction: "" }
  ]);
  const [activeUpload, setActiveUpload] = useState({ index: null });
  const processFileInputRef = useRef(null);

  const [stockData, setStockData] = useState({});
  const [isFetchingStock, setIsFetchingStock] = useState(false);

  const [currentMaterialList, setCurrentMaterialList] = useState([]);
  const [showBlockPopup, setShowBlockPopup] = useState(false);
  const [selectedMatForBlock, setSelectedMatForBlock] = useState(null);
  const [blockQty, setBlockQty] = useState(0);

  const [showRFQPopup, setShowRFQPopup] = useState(false);
  const [selectedMatForRFQ, setSelectedMatForRFQ] = useState(null);
  const [rfqQty, setRfqQty] = useState(0);
  const [rfqDeadline, setRfqDeadline] = useState("");
  const [isGeneratingRFQ, setIsGeneratingRFQ] = useState(false);

  // Sequential Packing AI permission state
  const [masterCartonAllowed, setMasterCartonAllowed] = useState(null);
  const [thermocolAllowed, setThermocolAllowed] = useState(null);
  const [blackBoxAllowed, setBlackBoxAllowed] = useState(null);
  const [isUpdatingPackingAI, setIsUpdatingPackingAI] = useState(false);
  const [packingAICompleted, setPackingAICompleted] = useState(false);

  // Use BOM data from Redux store if available, otherwise fall back to prop data
  const currentBomData = boms && boms.length > 0 ? boms[0] : data;

  // Derive which custom packing materials are present in this BOM's packingdatas
  const packingMaterialsInfo = useMemo(() => {
    const packs = currentBomData?.packingdatas || [];
    const hasThermocol = packs.some(p => p.name === 'Thermocol (Custom)');
    const hasBlackBox = packs.some(p => p.name === 'Black Box (Custom)');
    return { hasThermocol, hasBlackBox, hasAny: hasThermocol || hasBlackBox };
  }, [currentBomData]);

  const allMaterialsProcessed = useMemo(() => {
    const specs = currentBomData?.material_specification || [];
    const packs = (currentBomData?.packingdatas || [])
      .filter(p => (!p.logicalRate || (Array.isArray(p.logicalRate) && p.logicalRate.length === 0)) && p.name !== "Packing Labour");

    if (specs.length === 0 && packs.length === 0) return true;

    const formattedSpecs = specs.map(m => ({
      ...m,
      specs: `${m.input?.size || ''} ${m.input?.ups ? `(${m.input.ups} UPS)` : ''}`.trim(),
      isPacking: false
    }));

    const formattedPacks = packs.map(p => ({
      item_id: p.itemId?._id || p.itemId,
      material_name: p.name,
      final_total: p.total_qty,
      input: {
        quantity: p.total_qty,
        unit: p.itemType === 'logic' ? 'Units' : 'pcs'
      },
      specs: p.logic1 ? `${p.logic1}${p.logic2 ? 'x' + p.logic2 : ''}${p.logic3 ? 'x' + p.logic3 : ''}` : '',
      isPacking: true
    }));

    const combinedList = combineMaterials([...formattedSpecs, ...formattedPacks]);

    const blocked = data.blocked_materials || [];
    const rfqs = data.generator_rfq || [];

    const isProcessed = (mat) => {
      const itemId = mat.item_id;
      const name = mat.material_name;
      const reqQty = mat.final_total || mat.input?.quantity || 0;

      const reserved = blocked.find(b => (b.materialId === itemId) || (b.material_name === name));
      const reservedQty = reserved ? (reserved.quantity || 0) : 0;

      const matSize = (mat.input?.size || mat.specs || '').toLowerCase().replace(/\s+/g, '');
      const isRFQd = rfqs.some(r => {
        const nameMatch = r.material_name === name;
        // If the stored RFQ entry has a size, also require it to match (size-aware)
        // If no size stored (legacy entries), fall back to name-only match
        if (!r.size) return nameMatch;
        const rfqSize = (r.size || '').toLowerCase().replace(/\s+/g, '');
        return nameMatch && rfqSize === matSize;
      });

      return reservedQty >= reqQty || isRFQd;
    };

    return combinedList.every(isProcessed);
  }, [currentBomData, data]);


  // Check if both confirmations are done
  const canPushToShopFloor = artworkConfirmed && jobCardConfirmed && allMaterialsProcessed && packingAICompleted;

  const combinedMaterialsList = useMemo(() => {
    const rawSpecs = (currentBomData?.material_specification || []).map(m => {
      return {
        ...m,
        specs: `${m.input?.size || ''} ${m.input?.ups ? `(${m.input.ups} UPS)` : ''}`.trim(),
        isPacking: false
      };
    });

    const rawPacks = (currentBomData?.packingdatas || [])
      .filter(p =>
        (!p.logicalRate || (Array.isArray(p.logicalRate) && p.logicalRate.length === 0)) &&
        p.name !== "Packing Labour"
      )
      .map(p => {
        return {
          item_id: p.itemId?._id || p.itemId,
          material_name: p.name,
          final_total: p.total_qty,
          input: {
            quantity: p.total_qty,
            unit: p.itemType === 'logic' ? 'Units' : 'pcs'
          },
          specs: p.logic1 ? `${p.logic1}${p.logic2 ? 'x' + p.logic2 : ''}${p.logic3 ? 'x' + p.logic3 : ''}` : '',
          isPacking: true
        };
      });

    return combineMaterials([...rawSpecs, ...rawPacks]);
  }, [currentBomData]);

  // Fetch BOMs when drawer opens with job_no and sub_job_no
  useEffect(() => {
    if (show && data) {
      const params = {};

      if (data.job_no) {
        params.job_no = data.job_no;
      }

      if (data.sub_job_no) {
        params.sub_job_no = data.sub_job_no;
      }

      // Only fetch if we have at least one search parameter
      if (params.job_no || params.sub_job_no) {
        dispatch(fetchAllBOMs(params));
      }
    }
  }, [show, data, dispatch]);

  // Sync packing permissions from BOM once fetched
  useEffect(() => {
    if (currentBomData && (currentBomData.id || currentBomData._id)) {
      setMasterCartonAllowed(currentBomData.allow_mastercarton_packing === true);
      setThermocolAllowed(currentBomData.allow_thermocol_packing === true);
      setBlackBoxAllowed(currentBomData.allow_blackbox_packing === true);
    }
  }, [currentBomData]);

  // Sync pushedToShopFloor state with data prop
  useEffect(() => {
    if (data?.is_pushed_shop_floor !== undefined) {
      setPushedToShopFloor(data.is_pushed_shop_floor);
      setArtworkConfirmed(data.is_pushed_shop_floor);
      setJobCardConfirmed(data.is_pushed_shop_floor);
      if (data.is_pushed_shop_floor) {
        setPackingAICompleted(true);
      }
    }
  }, [data]);

  useEffect(() => {
    if (boms && boms.length > 0) {
      setCurrentMaterialList(boms[0].material_specification);
    }
  }, [boms]);

  // Group job sheet processes by department
  const groupedProcessesByDepartment = useMemo(() => {
    if (!boms || boms.length === 0) return {};

    const bomData = boms[0];
    const materialProcesses = bomData?.materialprocess || [];

    const grouped = {};

    materialProcesses.forEach((materialGroup) => {
      const processes = materialGroup.processes || [];

      processes.forEach((process) => {
        const department = process.department || "Uncategorized";

        if (!grouped[department]) {
          grouped[department] = [];
        }

        grouped[department].push({
          ...process,
          material_group_id: materialGroup.material_group_id,
          material_group_name: materialGroup.material_group_name,
          material_total: materialGroup.material_total,
          material_unit: materialGroup.material_unit,
          material_input: materialGroup.material_input,
        });
      });
    });

    return grouped;
  }, [boms]);


  const groupedProcessFiles = useMemo(() => {
    if (!data?.process_files) return [];

    // Group by section and process to avoid duplicates in display
    const map = new Map();
    data.process_files.forEach(pf => {
      const key = `${pf.section_id}_${pf.process_id}`;
      if (!map.has(key)) {
        map.set(key, { ...pf });
      } else {
        const existing = map.get(key);
        if (pf.production_file) {
          existing.production_file = pf.production_file;
          existing.production_instruction = pf.production_instruction;
        }
        if (pf.dtp_file) {
          existing.dtp_file = pf.dtp_file;
          existing.dtp_instruction = pf.dtp_instruction;
        }
      }
    });
    return Array.from(map.values());
  }, [data?.process_files]);



  const artworkFiles = [
    {
      type: "pdf",
      name: currentBomData.artwork_pdf ? getFileNamev2(currentBomData.artwork_pdf) : null,
      url: currentBomData.artwork_pdf,
      isUploaded: !!currentBomData.artwork_pdf
    },
    {
      type: "cdr",
      name: currentBomData.artwork_cdr ? getFileNamev2(currentBomData.artwork_cdr) : null,
      url: currentBomData.artwork_cdr,
      isUploaded: !!currentBomData.artwork_cdr
    }
  ];

  const fetchCurrentStock = async () => {
    setIsFetchingStock(true);
    try {
      const specs = currentBomData?.material_specification || [];
      const packs = (currentBomData?.packingdatas || []).filter(p =>
        (!p.logicalRate || (Array.isArray(p.logicalRate) && p.logicalRate.length === 0)) &&
        p.name !== "Packing Labour"
      );

      const standardIds = [];
      const customIds = [];

      specs.forEach(mat => {
        const bomItem = (currentBomData?.items || []).find(it => it.item_id === mat.item_id);
        const isCustom = bomItem?.type === "Custom";
        if (isCustom) {
          const cid = bomItem?.master_id || bomItem?.inventoryRef || bomItem?.item_id;
          if (cid) customIds.push(cid);
        } else {
          const sid = bomItem?.subCategoryId;
          if (sid) standardIds.push(sid);
        }
      });

      packs.forEach(p => {
        const sid = p.itemId?._id || p.itemId;
        if (sid) standardIds.push(sid);
      });

      const uniqueStandardIds = Array.from(new Set(standardIds)).filter(Boolean);
      const uniqueCustomIds = Array.from(new Set(customIds)).filter(Boolean);

      let standardStock = [];
      let customStock = [];

      const promises = [];
      if (uniqueStandardIds.length > 0) {
        promises.push(
          dispatch(fetchItemsStockByIds(uniqueStandardIds)).unwrap()
            .then(res => {
              standardStock = res?.data || [];
            })
        );
      }
      if (uniqueCustomIds.length > 0) {
        promises.push(
          dispatch(fetchCustomItemsStockByIds(uniqueCustomIds)).unwrap()
            .then(res => {
              customStock = res?.data || [];
            })
        );
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }

      const inventoryItems = [...standardStock, ...customStock];
      const newStockData = {};

      // Map specs stock
      specs.forEach(mat => {
        const bomItem = (currentBomData?.items || []).find(it => it.item_id === mat.item_id);
        const isCustom = bomItem?.type === "Custom";
        const actualItemId = isCustom
          ? (bomItem?.master_id || bomItem?.inventoryRef || bomItem?.item_id)
          : bomItem?.subCategoryId;

        const item = inventoryItems.find(i => i._id === actualItemId || i.id === actualItemId);
        if (item) {
          if (item.item_type === 'sheet') {
            let stockCount = 0;
            let stockArea = 0;
            if (mat.input?.size && item.size_wise_stock && item.stock_sizes) {
              const foundSizeDoc = item.stock_sizes.find(sz => {
                const normalize = s => (s || '').toLowerCase().replace(/\s+/g, '');
                const inputSize = normalize(mat.input.size);
                const nameSize = normalize(sz.size);
                const dimSize = normalize(`${sz.width}x${sz.height}`);
                return nameSize === inputSize || dimSize === inputSize;
              });
              if (foundSizeDoc) {
                const sizeStock = item.size_wise_stock.find(s =>
                  String(s.size_id) === String(foundSizeDoc._id) ||
                  String(s.size_id?._id) === String(foundSizeDoc._id) ||
                  String(s.size_id) === String(foundSizeDoc.id)
                );
                if (sizeStock) {
                  stockCount = sizeStock.count || 0;
                  stockArea = sizeStock.sqinch || 0;
                }
              }
            }
            newStockData[mat.item_id] = {
              ...item,
              stock: stockCount,
              totalArea: stockArea,
              item_type: 'sheet'
            };
          } else {
            newStockData[mat.item_id] = { ...item, stock: item.stock || 0, item_type: item.item_type };
          }
        } else {
          newStockData[mat.item_id] = { stock: "N/A" };
        }
      });

      // Map packing stock
      packs.forEach(p => {
        const actualItemId = p.itemId?._id || p.itemId;
        const item = inventoryItems.find(i => i._id === actualItemId || i.id === actualItemId);
        if (item) {
          newStockData[actualItemId] = { ...item, stock: item.stock || 0, item_type: item.item_type };
        } else {
          newStockData[actualItemId] = { stock: "N/A" };
        }
      });

      setStockData(newStockData);

      toast.success("Stock details fetched!");
    } catch (err) {
      toast.error("Failed to fetch current stock");
      console.error(err);
    } finally {
      setIsFetchingStock(false);
    }
  };

  const handleBlockClick = (mat, reqQty, currentReserved = 0) => {
    setSelectedMatForBlock(mat);
    setBlockQty(Math.max(0, reqQty - currentReserved));

    // Extract sheet size if available
    if (stockData[mat.item_id]?.item_type === 'sheet') {
      const targetSize = mat.input?.size?.split(" ")[0];
      setSelectedMatForBlock(prev => ({ ...prev, sheet_size: targetSize }));
    }

    setShowBlockPopup(true);
  };

  const handleConfirmBlock = async () => {
    try {
      const currentBlocked = data.blocked_materials || [];

      let actualItemId;
      let isCustom = false;
      if (selectedMatForBlock.isPacking) {
        actualItemId = selectedMatForBlock.item_id;
      } else {
        const bomItem = (currentBomData?.items || []).find(it =>
          it.item_id === selectedMatForBlock.item_id
        );
        isCustom = bomItem?.type === "Custom";
        actualItemId = isCustom
          ? (bomItem?.master_id || bomItem?.inventoryRef || bomItem?.item_id)
          : bomItem?.subCategoryId;
      }

      if (!actualItemId) {
        toast.error("Could not find material _id. Try fetching stock again.");
        return;
      }

      let inventoryItems = [];
      if (actualItemId) {
        const fetchAction = isCustom ? fetchCustomItemsStockByIds : fetchItemsStockByIds;
        const response = await dispatch(fetchAction([actualItemId])).unwrap();
        inventoryItems = response?.data || [];
      }

      const itemInfo = inventoryItems.find(it => it._id === actualItemId);
      console.log("itemInfo", itemInfo)
      let sheetSizeId = null;
      console.log("selectedMatForBlock.sheet_size", selectedMatForBlock, selectedMatForBlock.sheet_size)
      console.log("itemInfo.stock_sizes", itemInfo, itemInfo.stock_sizes)
      if (selectedMatForBlock.material_type === "sheet" && selectedMatForBlock.input.size && itemInfo?.stock_sizes) {
        const matchedSize = itemInfo.stock_sizes.find(sz =>
          sz.size.toString().trim().toLowerCase() === selectedMatForBlock.input.size.toString().trim().toLowerCase()
        );
        sheetSizeId = matchedSize?._id;
      }

      const newBlock = {
        item_id: actualItemId,
        materialId: selectedMatForBlock.item_id, // Store the nanoid from inventory as materialId
        material_name: selectedMatForBlock.material_name,
        sheet_size: selectedMatForBlock.input.size,
        sheet_size_id: sheetSizeId,
        quantity: blockQty,
        unit: selectedMatForBlock.input?.unit,
        blocked_at: new Date().toISOString()
      };

      console.log("newBlock", newBlock)

      const formData = new FormData();
      formData.append("blocked_materials", JSON.stringify([...currentBlocked, newBlock]));

      await dispatch(updateSampleOrderById({
        id: data.id,
        formData
      })).unwrap();

      toast.success(`${blockQty} ${selectedMatForBlock?.input?.unit || ""} Blocked successfully!`);
      setShowBlockPopup(false);
      fetchCurrentStock();
    } catch (error) {
      toast.error("Failed to block material");
      console.error(error);
    }
  };

  const handleGenerateRFQClick = (mat, reqQty) => {
    setSelectedMatForRFQ(mat);
    setRfqQty(reqQty);
    setRfqDeadline("");
    setShowRFQPopup(true);
  };

  // Toggle Master Carton Packing AI permission on the BOM
  const handleToggleMasterCarton = async (allow) => {
    if (!currentBomData?.id) {
      toast.error("BOM not loaded yet. Please wait.");
      return;
    }
    if (isUpdatingPackingAI) return;
    setIsUpdatingPackingAI(true);
    try {
      await dispatch(updateBOM({
        id: currentBomData.id,
        payload: { allow_mastercarton_packing: allow }
      })).unwrap();
      setMasterCartonAllowed(allow);
      toast.success(
        allow
          ? "Master Carton Packing AI allowed for this job."
          : "Master Carton Packing AI disabled for this job."
      );
    } catch (err) {
      toast.error("Failed to update Master Carton Packing AI permission.");
      console.error(err);
    } finally {
      setIsUpdatingPackingAI(false);
    }
  };

  // Toggle Thermocol Packing AI permission on the BOM
  const handleToggleThermocol = async (allow) => {
    if (!currentBomData?.id) {
      toast.error("BOM not loaded yet. Please wait.");
      return;
    }
    if (isUpdatingPackingAI) return;
    setIsUpdatingPackingAI(true);
    try {
      await dispatch(updateBOM({
        id: currentBomData.id,
        payload: { allow_thermocol_packing: allow }
      })).unwrap();
      setThermocolAllowed(allow);
      toast.success(
        allow
          ? "Thermocol Packing AI allowed for this job."
          : "Thermocol Packing AI disabled for this job."
      );
    } catch (err) {
      toast.error("Failed to update Thermocol Packing AI permission.");
      console.error(err);
    } finally {
      setIsUpdatingPackingAI(false);
    }
  };

  // Toggle Black Box Packing AI permission on the BOM
  const handleToggleBlackBox = async (allow) => {
    if (!currentBomData?.id) {
      toast.error("BOM not loaded yet. Please wait.");
      return;
    }
    if (isUpdatingPackingAI) return;
    setIsUpdatingPackingAI(true);
    try {
      await dispatch(updateBOM({
        id: currentBomData.id,
        payload: { allow_blackbox_packing: allow }
      })).unwrap();
      setBlackBoxAllowed(allow);
      toast.success(
        allow
          ? "Black Box Packing AI allowed for this job."
          : "Black Box Packing AI disabled for this job."
      );
    } catch (err) {
      toast.error("Failed to update Black Box Packing AI permission.");
      console.error(err);
    } finally {
      setIsUpdatingPackingAI(false);
    }
  };

  const handleConfirmRFQ = async () => {
    if (!rfqDeadline) {
      toast.warning("Please select a closure deadline");
      return;
    }

    // ── Duplicate guard ───────────────────────────────────────────────────────
    // Prevent creating a second RFQ for the same material name + size even if
    // the button-level check was bypassed (e.g. rapid double-click / stale state).
    const matSizeForGuard = (
      selectedMatForRFQ.input?.size || selectedMatForRFQ.specs || ''
    ).toLowerCase().replace(/\s+/g, '');

    const alreadyRFQd = (data.generator_rfq || []).some(r => {
      const nameMatch = r.material_name === selectedMatForRFQ.material_name;
      if (!r.size) return nameMatch; // legacy entry: name-only
      const rfqSize = (r.size || '').toLowerCase().replace(/\s+/g, '');
      return nameMatch && rfqSize === matSizeForGuard;
    });

    if (alreadyRFQd) {
      toast.warning("An RFQ has already been generated for this material.");
      setShowRFQPopup(false);
      return;
    }
    // ─────────────────────────────────────────────────────────────────────────

    const bomItem = (currentBomData?.items || []).find(it =>
      it.item_id === selectedMatForRFQ.item_id
    );

    console.log('bomItem', bomItem)

    try {
      setIsGeneratingRFQ(true);
      const rfqData = {
        uid: "AUTO_RFQ",
        jobNo: data.job_no,
        subJobNo: data.sub_job_no,
        category: data.category || "General",
        category_id: data.category_id || null,
        material_category_id: stockData[selectedMatForRFQ.item_id]?.category_id || null,
        material_type_id: stockData[selectedMatForRFQ.item_id]?.type_id || null,
        vendorName: bomItem?.vendorName || null,
        subcategory: data.subcategory || "",
        client: data.client_name,
        name: selectedMatForRFQ.material_name,
        item_id: bomItem?.inventoryRef || bomItem?.item_id || null,
        is_custom_item: bomItem?.type === "Custom",
        specs: selectedMatForRFQ.specs || "",
        qty: rfqQty,
        stage: "1. Draft RFQ",
        deadline: rfqDeadline,
        deliveryDate: rfqDeadline.split('T')[0],
        deliveryTime: rfqDeadline.includes('T') ? rfqDeadline.split('T')[1] : "",
        sales_order_nanoid: currentBomData?.sales_order_nanoid || null,
      };

      console.log('rfqData', rfqData)

      const response = await dispatch(addRFQs([rfqData])).unwrap();
      console.log('response', response)

      const newRfq = response?.[0];
      if (newRfq) {
        // Store the generated RFQ info in the sales order
        const formData = new FormData();
        formData.append("generator_rfq", JSON.stringify([
          ...(data.generator_rfq || []),
          {
            uid: newRfq.uid,
            rfq_id: newRfq._id,
            material_name: newRfq.name,
            size: selectedMatForRFQ.input?.size || selectedMatForRFQ.specs || '',
            generated_at: new Date().toISOString()
          }
        ]));

        await dispatch(updateSampleOrderById({ id: data.id, formData })).unwrap();
      }

      toast.success("RFQ generated and pushed to drafts!");
      setShowRFQPopup(false);
      fetchCurrentStock();
    } catch (error) {
      toast.error("Failed to generate RFQ");
      console.error(error);
    } finally {
      setIsGeneratingRFQ(false);
    }
  };

  if (!show || !data) return null;

  const handleDownload = (file) => {
    if (!file?.url) return;
    dispatch(downloadFile(file.url));
  };

  // const handleView = (file) => {
  //   if (!file?.url) return;

  //   // For CDR files, download instead of view (browsers can't display CDR)
  //   // if (file.type === 'cdr') {
  //   //   handleDownload(file);
  //   //   return;
  //   // }

  //   // For PDF files, open directly in new tab
  //   // The backend should serve the file with proper content-type headers
  //   window.open(file.url, '_blank');
  // };



  const handleEdit = (type) => {
    // Directly trigger the correct input based on type
    if (fileInputsRef.current[type]) {
      fileInputsRef.current[type].click();
    }
  };


  const handleFileChange = async (e, type) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile || !type) return;

    const fd = new FormData();

    if (type === "pdf") {
      fd.append("artwork_pdf", selectedFile);
    }

    if (type === "cdr") {
      fd.append("artwork_cdr", selectedFile);
    }

    try {
      await dispatch(
        updateBOM({
          id: data.bom_nanoid,
          payload: fd,
        })
      ).unwrap();

      toast.success("Artwork updated successfully!");
      // onClose();

    } catch (err) {
      toast.error("Failed to update artwork");
    } finally {
      e.target.value = "";
    }
  };

  const handleProcessEdit = (index) => {
    setActiveUpload({ index });
    if (processFileInputRef.current) {
      processFileInputRef.current.click();
    }
  };

  const handleProcessFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile || activeUpload.index === null || activeUpload.index === undefined) return;

    setProcessBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks[activeUpload.index].localFile = selectedFile;
      return newBlocks;
    });

    e.target.value = "";
    setActiveUpload({ index: null });
  };

  const handleProcessSubmit = async (index) => {
    const block = processBlocks[index];
    if (!block.groupId || !block.processId) {
      toast.warning("Please select a section and process first.");
      return;
    }
    if (!block.localFile) {
      toast.warning("Please select a file to upload first");
      return;
    }

    const type = block.activeTab.toLowerCase();
    const fd = new FormData();
    fd.append(`process|${block.groupId}|${block.processId}|${type}`, block.localFile);
    fd.append("materialprocess", JSON.stringify(currentBomData?.materialprocess || []));
    if (block.instruction) {
      fd.append("process_instruction", block.instruction);
    }

    try {
      await dispatch(
        updateSampleOrderById({
          id: data.id,
          formData: fd,
        })
      ).unwrap();

      toast.success(`${type === "production" ? "Production" : "DTP"} file updated successfully!`);

      setProcessBlocks(prev => {
        const newBlocks = [...prev];
        newBlocks[index].localFile = null;
        newBlocks[index].instruction = "";
        return newBlocks;
      });

    } catch (err) {
      toast.error(`Failed to update ${type} file`);
    }
  };

  const handleProcessDeleteFile = async (groupId, processId, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type} file?`)) {
      try {
        const fd = new FormData();
        fd.append("deleted_process_file", JSON.stringify({ section_id: groupId, process_id: processId, type }));

        await dispatch(
          updateSampleOrderById({
            id: data.id,
            formData: fd,
          })
        ).unwrap();

        toast.success(`${type === "production" ? "Production" : "DTP"} file deleted successfully!`);
      } catch (err) {
        toast.error(`Failed to delete ${type} file`);
      }
    }
  };

  const handlePushToShopFloor = async () => {
    try {
      const formData = new FormData();
      formData.append("is_pushed_shop_floor", true);
      formData.append("status", "process");

      // Use data.id as the sample order ID
      await dispatch(updateSampleOrderById({
        id: data.id,
        formData
      })).unwrap();

      setPushedToShopFloor(true);
      toast.success("Pushed to shop floor successfully!");
      // if (fetchSampleorders) fetchSampleorders();
    } catch (error) {
      console.error("Failed to push to shop floor:", error);
      toast.error("Failed to push to shop floor");
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          zIndex: 1040,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "1100px",
          backgroundColor: "#f8fafc",
          zIndex: 1050,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            background: "#fff",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: 800,
              lineHeight: "1.2",
              color: "#0f172a",
              margin: 0,
              letterSpacing: "0.2px",
            }}
          >
            Job Details
          </div>

          <button
            onClick={onClose}
            style={{
              border: "1px solid #e5e7eb",
              background: "#fff",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Close ✕
          </button>
        </div>

        <div
          className="scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
          style={{
            padding: "20px",
            flex: 1,
            fontSize: "14px",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              padding: "16px",
              display: "flex",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "90px",
                height: "90px",
                backgroundColor: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <img
                src={data?.image || "/placeholder-award.png"}
                alt="Award"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  cursor: "zoom-in",
                }}
                onClick={() => setPreviewImage(data?.image)}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  lineHeight: "1.2",
                  color: "#0f172a",
                  margin: 0,
                  letterSpacing: "0.2px",
                }}
              >
                {data?.client_name}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "12px",
                }}
              >
                {[
                  ["Job No", data.sub_job_no],
                  ["Reference No", currentBomData.enquiry_id?.reference_no || data.enquiry_id?.reference_no || currentBomData.reference_no || " "],
                  ["Quantity", data.job_quantity],
                  ["Status", data.status === "Pending" ? "New" : data.status === "process" ? "In Progress" : data.status],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      minWidth: "120px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#64748b",
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontWeight: 600 }}>{value}</div>
                  </div>
                ))}

              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              flex: 1,
            }}
          >
            {/* Left Column Container */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Artwork Files Box */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                }}
              >
                <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 700 }}>Artwork Files</h4>
                {!artworkFiles.some(file => file.isUploaded) && <span style={{ color: "#ef4444", marginBottom: "8px", display: "inline-block" }}>Please upload atleast one artwork file.</span>}
                <div style={{ paddingRight: "4px", flex: 1 }}>
                  {artworkFiles.map((file) => (
                    <div
                      key={file.type}
                      style={{
                        padding: "12px 0",
                        borderBottom: "1px solid #f3f4f6",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                          {file.type}
                        </span>&nbsp;&nbsp;
                        <span style={{ fontSize: "14px", color: file.isUploaded ? "#1f2937" : "#ef4444", marginTop: "4px" }}>
                          {file.isUploaded ? file.name : `No ${file.type.toUpperCase()} file uploaded`}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "12px" }}>
                        <span
                          title={file.isUploaded ? (downloadLoading ? "Downloading..." : "Download") : "No file to download"}
                          onClick={() => file.isUploaded && handleDownload(file)}
                          style={{
                            color: file.isUploaded ? (downloadLoading ? "#94a3b8" : "#2563eb") : "#cbd5e1",
                            cursor: file.isUploaded ? (downloadLoading ? "not-allowed" : "pointer") : "not-allowed",
                          }}
                        >
                          <DownloadIcon fontSize="small" />
                        </span>

                        <span
                          title={file.isUploaded ? "Edit" : "Upload"}
                          onClick={() => {
                            if (!data.is_on_hold) {
                              handleEdit(file.type);
                            }
                          }}
                          style={{
                            color: data.is_on_hold ? "#9ca3af" : "#f59e0b",
                            cursor: data.is_on_hold ? "not-allowed" : "pointer",
                            opacity: data.is_on_hold ? 0.5 : 1,
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </span>
                      </div>
                    </div>
                  ))}

                  {groupedProcessFiles && groupedProcessFiles.length > 0 && (
                    <div style={{ marginTop: "24px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>Uploaded Process Files</h4>
                      {groupedProcessFiles.map((pf, idx) => {
                        const sectionRef = currentBomData?.materialprocess?.find(g => (g.material_group_id || g._id) === pf.section_id);
                        const processRef = sectionRef?.processes?.find(p => (p.process_id || p._id) === pf.process_id);
                        const sectionName = sectionRef ? sectionRef.material_group_name : (pf.section_name || pf.section_id);
                        const processName = processRef ? processRef.process_name : (pf.process_name || pf.process_id);

                        return (
                          <div key={`${pf.section_id}_${pf.process_id}_${idx}`} style={{ marginBottom: "12px", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "6px", backgroundColor: "#fff" }}>
                            <div style={{ fontSize: "13px", color: "#1f2937", fontWeight: "bold", marginBottom: "8px" }}>
                              {sectionName} - {processName}
                            </div>

                            {pf.production_file && (
                              <>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "4px", marginBottom: pf.dtp_file ? "8px" : "0" }}>
                                  <div style={{ fontSize: "12px", color: "#15803d", fontWeight: 600 }}>
                                    PRODUCTION: {getFileNamev2(pf.production_file)}<br />
                                    {pf.production_instruction && <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                                      <strong>Instruction:</strong> {pf.production_instruction}
                                    </span>}
                                  </div>
                                  <div style={{ display: "flex", gap: "8px" }}>
                                    <span title="Download" onClick={() => handleDownload({ url: pf.production_file })} style={{ cursor: "pointer", color: "#2563eb", padding: "2px" }}><DownloadIcon fontSize="small" /></span>
                                    {!data.is_on_hold && (
                                      <span title="Delete File" onClick={() => handleProcessDeleteFile(pf.section_id, pf.process_id, "production")} style={{ cursor: "pointer", color: "#ef4444", padding: "2px" }}><DeleteIcon fontSize="small" /></span>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}

                            {pf.dtp_file && (
                              <>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "4px" }}>
                                  <div style={{ fontSize: "12px", color: "#1d4ed8", fontWeight: 600 }}>
                                    DTP: {getFileNamev2(pf.dtp_file)} <br />
                                    {pf.dtp_instruction && <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                                      <strong>Instruction:</strong> {pf.dtp_instruction}
                                    </span>}
                                  </div>
                                  <div style={{ display: "flex", gap: "8px" }}>
                                    <span title="Download" onClick={() => handleDownload({ url: pf.dtp_file })} style={{ cursor: "pointer", color: "#2563eb", padding: "2px" }}><DownloadIcon fontSize="small" /></span>
                                    {!data.is_on_hold && (
                                      <span title="Delete File" onClick={() => handleProcessDeleteFile(pf.section_id, pf.process_id, "dtp")} style={{ cursor: "pointer", color: "#ef4444", padding: "2px" }}><DeleteIcon fontSize="small" /></span>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <input
                    ref={(el) => (fileInputsRef.current["pdf"] = el)}
                    type="file"
                    accept=".pdf"
                    style={{ display: "none" }}
                    onChange={(e) => handleFileChange(e, "pdf")}
                  />
                  <input
                    ref={(el) => (fileInputsRef.current["cdr"] = el)}
                    type="file"
                    accept=".cdr"
                    style={{ display: "none" }}
                    onChange={(e) => handleFileChange(e, "cdr")}
                  />
                  <input
                    ref={processFileInputRef}
                    type="file"
                    style={{ display: "none" }}
                    onChange={handleProcessFileChange}
                  />

                  {currentBomData?.materialprocess && currentBomData.materialprocess.length > 0 && (
                    <div style={{ marginTop: "24px" }}>
                      {processBlocks.map((block, index) => (
                        <div key={block.id} style={{ marginBottom: "20px" }}>
                          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                            <select
                              value={block.groupId}
                              onChange={(e) => {
                                const newBlocks = [...processBlocks];
                                newBlocks[index].groupId = e.target.value;
                                newBlocks[index].processId = "";
                                setProcessBlocks(newBlocks);
                              }}
                              style={{
                                flex: 1,
                                padding: "8px 12px",
                                borderRadius: "4px",
                                border: "1px solid #e5e7eb",
                                fontSize: "13px",
                                color: "#1f2937",
                                outline: "none"
                              }}
                            >
                              <option value="">Select Section</option>
                              {currentBomData.materialprocess.map((g) => (
                                <option key={g.material_group_id || g._id} value={g.material_group_id || g._id}>
                                  {g.material_group_name}
                                </option>
                              ))}
                            </select>

                            <select
                              value={block.processId}
                              onChange={(e) => {
                                const newBlocks = [...processBlocks];
                                newBlocks[index].processId = e.target.value;
                                setProcessBlocks(newBlocks);
                              }}
                              disabled={!block.groupId}
                              style={{
                                flex: 1,
                                padding: "8px 12px",
                                borderRadius: "4px",
                                border: "1px solid #e5e7eb",
                                fontSize: "13px",
                                color: "#1f2937",
                                backgroundColor: !block.groupId ? "#f8fafc" : "#fff",
                                outline: "none",
                                cursor: !block.groupId ? "not-allowed" : "pointer"
                              }}
                            >
                              <option value="">Select Process</option>
                              {block.groupId &&
                                currentBomData.materialprocess
                                  .find((g) => (g.material_group_id || g._id) === block.groupId)
                                  ?.processes?.map((p) => (
                                    <option key={p.process_id || p._id} value={p.process_id || p._id}>
                                      {p.process_name}
                                    </option>
                                  ))}
                            </select>
                          </div>

                          {block.groupId && block.processId && (
                            <div
                              style={{
                                background: "#fff",
                                borderRadius: "4px",
                                border: "none",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "16px",
                                  flexWrap: "wrap",
                                  gap: "10px"
                                }}
                              >
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button
                                    onClick={() => {
                                      const newBlocks = [...processBlocks];
                                      newBlocks[index].activeTab = "PRODUCTION";
                                      setProcessBlocks(newBlocks);
                                    }}
                                    style={{
                                      padding: "6px 16px",
                                      backgroundColor: block.activeTab === "PRODUCTION" ? "#f97316" : "#e2e8f0",
                                      color: block.activeTab === "PRODUCTION" ? "#fff" : "#475569",
                                      border: "none",
                                      borderRadius: "4px",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      transition: "all 0.2s"
                                    }}
                                  >
                                    PRODUCTION
                                  </button>
                                  <button
                                    onClick={() => {
                                      const newBlocks = [...processBlocks];
                                      newBlocks[index].activeTab = "DTP";
                                      setProcessBlocks(newBlocks);
                                    }}
                                    style={{
                                      padding: "6px 16px",
                                      backgroundColor: block.activeTab === "DTP" ? "#f97316" : "#e2e8f0",
                                      color: block.activeTab === "DTP" ? "#fff" : "#475569",
                                      border: "none",
                                      borderRadius: "4px",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      transition: "all 0.2s"
                                    }}
                                  >
                                    DTP
                                  </button>
                                </div>

                                <button
                                  onClick={() => {
                                    if (!data.is_on_hold) {
                                      handleProcessEdit(index);
                                    }
                                  }}
                                  disabled={data.is_on_hold}
                                  style={{
                                    padding: "6px 16px",
                                    backgroundColor: "transparent",
                                    color: data.is_on_hold ? "#94a3b8" : "#f97316",
                                    border: `1px dashed ${data.is_on_hold ? "#94a3b8" : "#f97316"}`,
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: data.is_on_hold ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    opacity: data.is_on_hold ? 0.6 : 1
                                  }}
                                >
                                  <span style={{ fontSize: "16px" }}>↑</span> UPLOAD FILE
                                </button>
                              </div>

                              <textarea
                                placeholder="Specific instructions for this part..."
                                rows={3}
                                value={block.instruction || ""}
                                onChange={(e) => {
                                  const newBlocks = [...processBlocks];
                                  newBlocks[index].instruction = e.target.value;
                                  setProcessBlocks(newBlocks);
                                }}
                                style={{
                                  width: "100%",
                                  padding: "12px",
                                  borderRadius: "4px",
                                  border: "1px solid #e2e8f0",
                                  fontSize: "13px",
                                  resize: "vertical",
                                  boxSizing: "border-box",
                                  marginBottom: "12px",
                                  color: "#475569",
                                  outline: "none"
                                }}
                              />

                              {block.localFile && (
                                <div style={{ padding: "8px", backgroundColor: "#fef3c7", borderRadius: "4px", fontSize: "12px", color: "#92400e", marginBottom: "12px" }}>
                                  Selected File: {block.localFile.name}
                                </div>
                              )}

                              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                                <button
                                  onClick={() => handleProcessSubmit(index)}
                                  disabled={data.is_on_hold || !block.localFile}
                                  style={{
                                    padding: "6px 16px",
                                    backgroundColor: (!data.is_on_hold && block.localFile) ? "#2563eb" : "#94a3b8",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: (!data.is_on_hold && block.localFile) ? "pointer" : "not-allowed",
                                  }}
                                >
                                  SUBMIT
                                </button>
                              </div>


                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {artworkConfirmed ? (
                  <div
                    style={{
                      width: "100%",
                      color: "#10b981",
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: "16px",
                      padding: "10px",
                      marginTop: "12px",
                      flexShrink: 0,
                    }}
                  >
                    ✓ Confirmed
                  </div>
                ) : (
                  <button
                    onClick={() => setArtworkConfirmed(true)}
                    disabled={!artworkFiles.some(file => file.isUploaded) || data.is_on_hold}
                    style={{
                      width: "100%",
                      background: (!artworkFiles.some(file => file.isUploaded) || data.is_on_hold) ? "#94a3b8" : "#10b981",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "10px",
                      marginTop: "12px",
                      cursor: (!artworkFiles.some(file => file.isUploaded) || data.is_on_hold) ? "not-allowed" : "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Confirm
                  </button>
                )}
              </div>
            </div>

            {/* Job Card - Second column */}
            <div
              style={{
                background: "#fff",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                // overflow: "hidden",
              }}
            >
              <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 700 }}>Job Card</h4>

              <div style={{ flex: 1, paddingRight: "4px" }}>
                {Object.keys(groupedProcessesByDepartment).length > 0 ? (
                  Object.entries(groupedProcessesByDepartment).map(([department, processes]) => (
                    <div key={department} style={{ marginBottom: "20px" }}>
                      {/* Department Header */}
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#1f2937",
                          padding: "8px 12px",
                          backgroundColor: "#f3f4f6",
                          borderRadius: "6px",
                          marginBottom: "8px",
                        }}
                      >
                        {department}
                      </div>

                      {/* Processes Table */}
                      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px" }}>
                        <thead>
                          <tr style={{ textAlign: "left", color: "#64748b", fontSize: "12px" }}>
                            <th style={{ padding: "8px 4px" }}>#</th>
                            <th style={{ padding: "8px 4px" }}>Process</th>
                            <th style={{ padding: "8px 4px" }}>Req Qty</th>
                            <th style={{ padding: "8px 4px" }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {processes.map((process, idx) => (
                            <tr key={`${department}-${process.process_id}-${idx}`}>
                              <td style={{ padding: "10px 4px", fontSize: "13px" }}>
                                {process.process_index || idx + 1}
                              </td>
                              <td style={{ padding: "10px 4px", fontSize: "13px", fontWeight: 500 }}>
                                {process.process_name}
                              </td>
                              <td style={{ padding: "10px 4px", fontSize: "13px" }}>
                                {process.order_qty || "-"}
                              </td>
                              <td style={{ padding: "10px 4px", fontSize: "13px", color: "#64748b" }}>
                                Pending
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                    {loading ? "Loading processes..." : "No processes found"}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowJobDetailsPopup(true)}
                style={{
                  width: "100%",
                  background: "#6366f1",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "12px",
                  marginTop: "12px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                📋 View Job Details
              </button>

              {jobCardConfirmed ? (
                <div
                  style={{
                    width: "100%",
                    color: "#10b981",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "16px",
                    padding: "10px",
                    marginTop: "12px",
                    flexShrink: 0,
                  }}
                >
                  ✓ Confirmed
                </div>
              ) : (
                <button
                  onClick={() => {
                    setJobCardConfirmed(true);
                    toast.success("Job card confirmed!");
                  }}
                  style={{
                    width: "100%",
                    background: (data.is_on_hold || !allMaterialsProcessed) ? "#94a3b8" : "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px",
                    marginTop: "12px",
                    cursor: (data.is_on_hold || !allMaterialsProcessed) ? "not-allowed" : "pointer",
                    flexShrink: 0,
                  }}
                  disabled={data.is_on_hold || !allMaterialsProcessed}
                >
                  {allMaterialsProcessed ? "Confirm" : "Process All Materials to Confirm"}
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              padding: "20px",
              marginTop: "20px",
              marginBottom: "20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1f2937", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#6366f1" }}>📦</span> MATERIAL INVENTORY
              </h4>
              {!pushedToShopFloor && (
                <button
                  onClick={fetchCurrentStock}
                  disabled={isFetchingStock || data?.is_on_hold}
                  style={{
                    background: (isFetchingStock || data?.is_on_hold) ? "#94a3b8" : "#6366f1",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    cursor: (isFetchingStock || data?.is_on_hold) ? "not-allowed" : "pointer",
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {isFetchingStock ? "FETCHING..." : "FETCH CURRENT STOCK"}
                </button>
              )}
            </div>

            <div style={{ width: "100%", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left", color: "#94a3b8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "12px 16px", fontWeight: 700, borderBottom: "1px solid #e2e8f0" }}>Material Name</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700, borderBottom: "1px solid #e2e8f0" }}>Required</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>In-Stock</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {combinedMaterialsList.map((mat, idx) => {
                    const item = stockData[mat.item_id];
                    let physicalQty = "--";
                    let globalBlocked = 0;
                    let netAvailable = "--";
                    let comparisonStock = 0;

                    if (item) {
                      if (item.item_type === 'sheet') {
                        const targetSize = mat.input?.size?.toLowerCase();
                        const sws = item.size_wise_stock?.find(s => s.size?.toLowerCase() === targetSize);
                        if (sws) {
                          physicalQty = sws.count || 0; // Use 'count' for sheets
                          globalBlocked = sws.blocked || 0;
                          netAvailable = sws.available ?? (physicalQty - globalBlocked);
                          comparisonStock = netAvailable;
                        }
                      } else {
                        physicalQty = item.stock || 0;
                        globalBlocked = item.blocked_qty || 0;
                        netAvailable = item.available_qty ?? (physicalQty - globalBlocked);
                        comparisonStock = netAvailable;
                      }
                    }

                    // Check if there is a block in the CURRENT sales order for this specific material
                    const matchingBlocks = (data.blocked_materials || []).filter(b =>
                      b.materialId === mat.item_id ||
                      (typeof b === 'object' && b.materialId === mat.item_id)
                    );
                    const reservedQty = matchingBlocks.reduce((sum, b) => sum + (b.quantity || 0), 0);
                    const reservedInThisJob = matchingBlocks.length > 0 ? {
                      ...matchingBlocks[0],
                      quantity: reservedQty
                    } : null;

                    const reqQty = mat.final_total || mat.input?.quantity || 0;
                    let statusLabel = "N/A";
                    let statusColor = "#94a3b8";

                    if (item && comparisonStock !== "--") {
                      if (comparisonStock >= reqQty) {
                        statusLabel = "Available";
                        statusColor = "#10b981";
                      } else if (item.stock !== "N/A") {
                        statusLabel = "Low Stock";
                        statusColor = "#ef4444";
                      } else {
                        statusLabel = "Custom material";
                        statusColor = "#94a3b8";
                      }
                    }

                    // Override: if this job has fully reserved the required qty,
                    // show "Reserved" instead of "Low Stock" — material is already handled.
                    if (reservedInThisJob && reservedInThisJob.quantity >= reqQty) {
                      statusLabel = "";
                      statusColor = "#10b981";
                    }

                    const matSize = (mat.input?.size || mat.specs || '').toLowerCase().replace(/\s+/g, '');
                    const existingRFQ = (data.generator_rfq || []).find(r => {
                      const nameMatch = r.material_name === mat.material_name;
                      // If the stored entry has a size, require it to match too
                      if (!r.size) return nameMatch; // legacy entries: name-only
                      const rfqSize = (r.size || '').toLowerCase().replace(/\s+/g, '');
                      return nameMatch && rfqSize === matSize;
                    });

                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "16px", fontSize: "13px", color: "#334155", fontWeight: 500 }}>
                          {mat.material_name}
                          {mat.input?.size && (
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                              Size: {mat.input.size} {mat.color ? `Color: ${mat.color}` : ""} {mat.thickness ? `Thickness: ${mat.thickness}` : ""}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "16px", fontSize: "13px", color: "#334155", fontWeight: 700 }}>
                          {reqQty || "-"} {mat.input?.unit || ""}
                        </td>
                        <td style={{ padding: "16px", fontSize: "13px", color: "#0f172a", fontWeight: "bold", textAlign: "center" }}>
                          {item && item.stock !== "N/A" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
                              <div style={{ fontSize: "12px", color: "#1e293b" }}>
                                <span style={{ color: "#64748b", fontWeight: 600, fontSize: "10px" }}>PHY: </span>
                                {physicalQty}
                              </div>
                              <div style={{ fontSize: "12px", color: "#6366f1" }}>
                                <span style={{ color: "#64748b", fontWeight: 600, fontSize: "10px" }}>NET AVAIL: </span>
                                {netAvailable}
                              </div>
                              <div style={{ fontSize: "12px", color: "#f59e0b" }}>
                                <span style={{ color: "#64748b", fontWeight: 600, fontSize: "10px" }}>SYSTEM BLOCKED: </span>
                                {globalBlocked}
                              </div>
                            </div>
                          ) : "--"}
                        </td>
                        <td style={{ padding: "16px", fontSize: "13px", textAlign: "right" }}>
                          {reservedInThisJob && (
                            <div style={{
                              fontSize: "10px",
                              color: "#10b981",
                              marginBottom: "8px",
                              padding: "4px 8px",
                              background: "#ecfdf5",
                              borderRadius: "4px",
                              display: "inline-block",
                              fontWeight: "bold",
                              border: "1px solid #10b981",
                              textAlign: "left"
                            }}>
                              ✅ RESERVED (THIS JOB): {reservedInThisJob.quantity || 0}
                            </div>
                          )}

                          {existingRFQ && (
                            <div style={{
                              fontSize: "10px",
                              color: "#6366f1",
                              marginBottom: "8px",
                              padding: "4px 8px",
                              background: "#eef2ff",
                              borderRadius: "4px",
                              display: "inline-block",
                              fontWeight: "bold",
                              border: "1px solid #6366f1",
                              textAlign: "left"
                            }}>
                              📄 RFQ: {existingRFQ.uid}
                            </div>
                          )}

                          {item !== undefined ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                              <span style={{ color: statusColor, fontWeight: 700 }}>{statusLabel}</span>
                              {!pushedToShopFloor && statusLabel === "Available" && (!reservedInThisJob || reservedInThisJob.quantity < reqQty) ? (
                                <button
                                  onClick={() => handleBlockClick(mat, reqQty, reservedInThisJob?.quantity || 0)}
                                  style={{
                                    background: "#10b981",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "4px",
                                    padding: "4px 12px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)",
                                    transition: "all 0.2s"
                                  }}
                                  onMouseEnter={(e) => e.target.style.background = "#059669"}
                                  onMouseLeave={(e) => e.target.style.background = "#10b981"}
                                >
                                  BLOCK
                                </button>
                              ) : (!pushedToShopFloor && (statusLabel === "Low Stock" || statusLabel === "Custom material") && !existingRFQ && (!reservedInThisJob || reservedInThisJob.quantity < reqQty)) ? (
                                <button
                                  onClick={() => handleGenerateRFQClick(mat, reqQty)}
                                  style={{
                                    background: "#ef4444",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "4px",
                                    padding: "4px 12px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
                                    transition: "all 0.2s"
                                  }}
                                  onMouseEnter={(e) => e.target.style.background = "#dc2626"}
                                  onMouseLeave={(e) => e.target.style.background = "#ef4444"}
                                >
                                  GENERATE RFQ
                                </button>
                              ) : null}
                            </div>
                          ) : (
                            <span style={{ color: "#6366f1", fontWeight: 600, cursor: "pointer" }}> - </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {combinedMaterialsList.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                        No material specifications found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Sequential Packing AI Permission Panel ──────────────────────── */}
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              padding: "20px",
              marginTop: "16px",
              marginBottom: "0",
            }}
          >
            <h4 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: 700, color: "#1f2937", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#6366f1" }}>🤖</span> SEQUENTIAL PACKING AI
              <label style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto", cursor: "pointer", fontWeight: 600, fontSize: "13px", color: packingAICompleted ? "#10b981" : "#64748b" }}>
                <input
                  type="checkbox"
                  checked={packingAICompleted || pushedToShopFloor}
                  onChange={(e) => setPackingAICompleted(e.target.checked)}
                  disabled={pushedToShopFloor}
                  style={{ width: "16px", height: "16px", cursor: pushedToShopFloor ? "not-allowed" : "pointer", accentColor: "#10b981" }}
                />
                {packingAICompleted || pushedToShopFloor ? "AI Control Completed" : "Mark AI Control as Completed"}
              </label>
            </h4>

            {/* OUTER MASTER CARTON control panel */}
            <div style={{
              border: "1px solid #10b981",
              background: "#ecfdf5",
              borderRadius: "10px",
              padding: "16px",
              marginBottom: packingMaterialsInfo.hasAny ? "16px" : "0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>📦</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#065f46" }}>OUTER MASTER CARTON</div>
                    <div style={{ fontSize: "11px", color: "#059669", marginTop: "2px" }}>
                      Outer container used for packing units
                    </div>
                  </div>
                </div>

                <div style={{
                  fontSize: "12px",
                  color: masterCartonAllowed ? "#059669" : "#dc2626",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}>
                  {masterCartonAllowed === null ? (
                    <span style={{ color: "#94a3b8" }}>⏳ Loading...</span>
                  ) : masterCartonAllowed ? (
                    <><span>✅</span> Allowed</>
                  ) : (
                    <><span>🚫</span> Not Allowed</>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => handleToggleMasterCarton(true)}
                  disabled={isUpdatingPackingAI || masterCartonAllowed === true || data?.is_on_hold || pushedToShopFloor}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: "6px",
                    border: "none",
                    background: masterCartonAllowed === true ? "#d1fae5" : "#10b981",
                    color: masterCartonAllowed === true ? "#065f46" : "#fff",
                    fontWeight: 700,
                    fontSize: "11px",
                    cursor: (isUpdatingPackingAI || masterCartonAllowed === true || data?.is_on_hold || pushedToShopFloor) ? "not-allowed" : "pointer",
                    opacity: (isUpdatingPackingAI || data?.is_on_hold || pushedToShopFloor) ? 0.6 : 1,
                    transition: "all 0.2s",
                  }}
                >
                  {masterCartonAllowed === true ? "✅ Allowed" : "Allow"}
                </button>
                <button
                  onClick={() => handleToggleMasterCarton(false)}
                  disabled={isUpdatingPackingAI || masterCartonAllowed === false || data?.is_on_hold || pushedToShopFloor}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: "6px",
                    border: "none",
                    background: masterCartonAllowed === false ? "#fee2e2" : "#ef4444",
                    color: masterCartonAllowed === false ? "#991b1b" : "#fff",
                    fontWeight: 700,
                    fontSize: "11px",
                    cursor: (isUpdatingPackingAI || masterCartonAllowed === false || data?.is_on_hold || pushedToShopFloor) ? "not-allowed" : "pointer",
                    opacity: (isUpdatingPackingAI || data?.is_on_hold || pushedToShopFloor) ? 0.6 : 1,
                    transition: "all 0.2s",
                  }}
                >
                  {masterCartonAllowed === false ? "🚫 Disabled" : "Do Not Allow"}
                </button>
              </div>
            </div>

            {/* Thermocol / Black Box conditional controls */}
            {packingMaterialsInfo.hasAny ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {packingMaterialsInfo.hasThermocol && (
                  <div style={{
                    border: "1px solid #fcd34d",
                    background: "#fffbeb",
                    borderRadius: "8px",
                    padding: "14px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "4px 12px",
                        borderRadius: "20px",
                        background: "#fef3c7",
                        color: "#92400e",
                        border: "1px solid #fcd34d",
                      }}>🧊 Thermocol (Custom)</span>

                      <div style={{
                        fontSize: "12px",
                        color: thermocolAllowed ? "#059669" : "#dc2626",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}>
                        {thermocolAllowed === null ? (
                          <span style={{ color: "#94a3b8" }}>⏳ Loading...</span>
                        ) : thermocolAllowed ? (
                          <><span>✅</span> Allowed</>
                        ) : (
                          <><span>🚫</span> Not Allowed</>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={() => handleToggleThermocol(true)}
                        disabled={isUpdatingPackingAI || thermocolAllowed === true || data?.is_on_hold || pushedToShopFloor}
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          borderRadius: "6px",
                          border: "none",
                          background: thermocolAllowed === true ? "#d1fae5" : "#10b981",
                          color: thermocolAllowed === true ? "#065f46" : "#fff",
                          fontWeight: 700,
                          fontSize: "11px",
                          cursor: (isUpdatingPackingAI || thermocolAllowed === true || data?.is_on_hold || pushedToShopFloor) ? "not-allowed" : "pointer",
                          opacity: (isUpdatingPackingAI || data?.is_on_hold || pushedToShopFloor) ? 0.6 : 1,
                          transition: "all 0.2s",
                        }}
                      >
                        {thermocolAllowed === true ? "✅ Allowed" : "Allow"}
                      </button>
                      <button
                        onClick={() => handleToggleThermocol(false)}
                        disabled={isUpdatingPackingAI || thermocolAllowed === false || data?.is_on_hold || pushedToShopFloor}
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          borderRadius: "6px",
                          border: "none",
                          background: thermocolAllowed === false ? "#fee2e2" : "#ef4444",
                          color: thermocolAllowed === false ? "#991b1b" : "#fff",
                          fontWeight: 700,
                          fontSize: "11px",
                          cursor: (isUpdatingPackingAI || thermocolAllowed === false || data?.is_on_hold || pushedToShopFloor) ? "not-allowed" : "pointer",
                          opacity: (isUpdatingPackingAI || data?.is_on_hold || pushedToShopFloor) ? 0.6 : 1,
                          transition: "all 0.2s",
                        }}
                      >
                        {thermocolAllowed === false ? "🚫 Disabled" : "Do Not Allow"}
                      </button>
                    </div>
                  </div>
                )}

                {packingMaterialsInfo.hasBlackBox && (
                  <div style={{
                    border: "1px solid #d1d5db",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    padding: "14px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "4px 12px",
                        borderRadius: "20px",
                        background: "#f3f4f6",
                        color: "#1f2937",
                        border: "1px solid #d1d5db",
                      }}>📦 Black Box (Custom)</span>

                      <div style={{
                        fontSize: "12px",
                        color: blackBoxAllowed ? "#059669" : "#dc2626",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}>
                        {blackBoxAllowed === null ? (
                          <span style={{ color: "#94a3b8" }}>⏳ Loading...</span>
                        ) : blackBoxAllowed ? (
                          <><span>✅</span> Allowed</>
                        ) : (
                          <><span>🚫</span> Not Allowed</>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={() => handleToggleBlackBox(true)}
                        disabled={isUpdatingPackingAI || blackBoxAllowed === true || data?.is_on_hold || pushedToShopFloor}
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          borderRadius: "6px",
                          border: "none",
                          background: blackBoxAllowed === true ? "#d1fae5" : "#10b981",
                          color: blackBoxAllowed === true ? "#065f46" : "#fff",
                          fontWeight: 700,
                          fontSize: "11px",
                          cursor: (isUpdatingPackingAI || blackBoxAllowed === true || data?.is_on_hold || pushedToShopFloor) ? "not-allowed" : "pointer",
                          opacity: (isUpdatingPackingAI || data?.is_on_hold || pushedToShopFloor) ? 0.6 : 1,
                          transition: "all 0.2s",
                        }}
                      >
                        {blackBoxAllowed === true ? "✅ Allowed" : "Allow"}
                      </button>
                      <button
                        onClick={() => handleToggleBlackBox(false)}
                        disabled={isUpdatingPackingAI || blackBoxAllowed === false || data?.is_on_hold || pushedToShopFloor}
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          borderRadius: "6px",
                          border: "none",
                          background: blackBoxAllowed === false ? "#fee2e2" : "#ef4444",
                          color: blackBoxAllowed === false ? "#991b1b" : "#fff",
                          fontWeight: 700,
                          fontSize: "11px",
                          cursor: (isUpdatingPackingAI || blackBoxAllowed === false || data?.is_on_hold || pushedToShopFloor) ? "not-allowed" : "pointer",
                          opacity: (isUpdatingPackingAI || data?.is_on_hold || pushedToShopFloor) ? 0.6 : 1,
                          transition: "all 0.2s",
                        }}
                      >
                        {blackBoxAllowed === false ? "🚫 Disabled" : "Do Not Allow"}
                      </button>
                    </div>
                  </div>
                )}

                {(thermocolAllowed || blackBoxAllowed) && (
                  <div style={{
                    marginTop: "4px",
                    fontSize: "11px",
                    color: "#6366f1",
                    background: "#eef2ff",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #c7d2fe",
                  }}>
                    ℹ️ Allowed custom materials and Outer Master Carton will be active for this job in the AI processing dropdown.
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                fontSize: "12px",
                color: "#94a3b8",
                fontStyle: "italic",
                padding: "6px 0",
              }}>
                No custom packing materials (Thermocol / Black Box) found in this BOM.
                Only Outer Master Carton will be used in packaging.
              </div>
            )}
          </div>

          {/* PUSH TO SHOP FLOOR Button - Shows when both confirmations are done */}
          {canPushToShopFloor && (
            <div
              style={{ padding: "15px" }}
            >
              {pushedToShopFloor ? (
                <div
                  style={{
                    width: "100%",
                    color: "#10b981",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "16px",
                    padding: "16px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  ✓ PUSHED TO SHOP FLOOR
                </div>
              ) : (
                <button
                  onClick={handlePushToShopFloor}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #10b981 0%, #10b981 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "16px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                  }}
                >
                  🚀 PUSH TO SHOP FLOOR
                </button>
              )}
            </div>
          )}

          {/* Hold History Section - MUI Accordion */}
          {AdminRole && (
            <Accordion
              sx={{
                mx: "15px",
                mb: "15px",
                borderRadius: "10px !important",
                border: "1px solid #e5e7eb",
                boxShadow: "none",
                "&:before": { display: "none" }, // removes default MUI top border line
                "&.Mui-expanded": { margin: "0 15px 15px 15px" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "16px",
                  color: "#1f2937",
                  "&.Mui-expanded": {
                    borderBottom: "1px solid #e5e7eb",
                    borderRadius: "10px 10px 0 0",
                  },
                }}
              >
                Hold History
              </AccordionSummary>

              <AccordionDetails sx={{ padding: "16px" }}>
                {data.hold_history && data.hold_history.length > 0 ? (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ textAlign: "left", color: "#64748b", borderBottom: "1px solid #f3f4f6" }}>
                          <th style={{ padding: "8px 4px" }}>Reason</th>
                          <th style={{ padding: "8px 4px" }}>Hold By</th>
                          <th style={{ padding: "8px 4px" }}>Start Date</th>
                          <th style={{ padding: "8px 4px" }}>Unhold By</th>
                          <th style={{ padding: "8px 4px" }}>End Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.hold_history.map((hold, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #f9fafb" }}>
                            <td style={{ padding: "10px 4px", color: "#1f2937", fontWeight: 500 }}>{hold.reason || "N/A"}</td>
                            <td style={{ padding: "10px 4px", color: "#475569" }}>{hold.hold_by?.name || "N/A"}</td>
                            <td style={{ padding: "10px 4px", color: "#64748b" }}>{hold.start_time || "N/A"}</td>
                            <td style={{ padding: "10px 4px", color: "#475569" }}>{hold.unhold_by?.name || (hold.end_time ? "N/A" : "-")}</td>
                            <td style={{ padding: "10px 4px", color: "#64748b" }}>{hold.end_time || (hold.start_time ? "Ongoing" : "N/A")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: "10px 0", color: "#94a3b8", fontStyle: "italic" }}>
                    No hold history found.
                  </div>
                )}
              </AccordionDetails>
            </Accordion>
          )}

        </div>

      </div>

      {/* Job Details Popup */}
      <JobDetailsPopup
        show={showJobDetailsPopup}
        onClose={() => setShowJobDetailsPopup(false)}
        bomData={currentBomData}
        groupedProcesses={groupedProcessesByDepartment}
      />
      {/* Hold History Section */}
      {/* {(AdminRole || (SalesRole && isHead)) && (
        <div
          style={{
            background: "#fff",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            padding: "20px",
            marginTop: "20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 700 }}>Hold History</h4>
          {data.hold_history && data.hold_history.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#64748b", borderBottom: "1px solid #f3f4f6" }}>
                    <th style={{ padding: "8px 4px" }}>Reason</th>
                    <th style={{ padding: "8px 4px" }}>Hold By</th>
                    <th style={{ padding: "8px 4px" }}>Start Date</th>
                    <th style={{ padding: "8px 4px" }}>Unhold By</th>
                    <th style={{ padding: "8px 4px" }}>End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.hold_history.map((hold, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f9fafb" }}>
                      <td style={{ padding: "10px 4px", color: "#1f2937", fontWeight: 500 }}>{hold.reason || "N/A"}</td>
                      <td style={{ padding: "10px 4px", color: "#475569" }}>{hold.hold_by?.name || "N/A"}</td>
                      <td style={{ padding: "10px 4px", color: "#64748b" }}>{hold.start_time || "N/A"}</td>
                      <td style={{ padding: "10px 4px", color: "#475569" }}>{hold.unhold_by?.name || (hold.end_time ? "N/A" : "-")}</td>
                      <td style={{ padding: "10px 4px", color: "#64748b" }}>{hold.end_time || (hold.start_time ? "Ongoing" : "N/A")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "10px 0", color: "#94a3b8", fontStyle: "italic" }}>
              No hold history found.
            </div>
          )}
        </div>
      )} */}
      <ImageLightbox
        src={previewImage}
        fileName={data.sub_job_no || "Job Image"}
        onClose={() => setPreviewImage(null)}
      />

      {/* Block Material Popup */}
      {showBlockPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              width: "400px",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Block Material</h3>
              <button
                onClick={() => setShowBlockPopup(false)}
                style={{ border: "none", background: "none", cursor: "pointer", fontSize: "20px", color: "#94a3b8" }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                Material Name
              </label>
              <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: 500 }}>
                {selectedMatForBlock?.material_name}
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                Quantity to Block ({selectedMatForBlock?.input?.unit || "Units"})
              </label>
              <input
                type="number"
                value={blockQty}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  const maxQty = selectedMatForBlock?.final_total || selectedMatForBlock?.input?.quantity || 0;
                  if (val <= maxQty) {
                    setBlockQty(val);
                  } else {
                    toast.warning(`Cannot exceed required quantity: ${maxQty}`);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                Max required quantity: {selectedMatForBlock?.final_total || selectedMatForBlock?.input?.quantity || 0}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowBlockPopup(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  color: "#64748b",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBlock}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#6366f1",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate RFQ Popup */}
      {showRFQPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              width: "400px",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Generate RFQ</h3>
              <button
                onClick={() => setShowRFQPopup(false)}
                style={{ border: "none", background: "none", cursor: "pointer", fontSize: "20px", color: "#94a3b8" }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                Material Name
              </label>
              <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: 500 }}>
                {selectedMatForRFQ?.material_name}
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                Purchase Quantity ({selectedMatForRFQ?.input?.unit || "Units"})
              </label>
              <input
                type="number"
                value={rfqQty}
                onChange={(e) => setRfqQty(parseFloat(e.target.value) || 0)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                Closure Deadline
              </label>
              <input
                type="datetime-local"
                min={new Date().toISOString().slice(0, 16)}
                value={rfqDeadline}
                onChange={(e) => setRfqDeadline(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowRFQPopup(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  color: "#64748b",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRFQ}
                disabled={isGeneratingRFQ}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "6px",
                  border: "none",
                  background: isGeneratingRFQ ? "#94a3b8" : "#6366f1",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: isGeneratingRFQ ? "not-allowed" : "pointer",
                }}
              >
                {isGeneratingRFQ ? "Generating..." : "Confirm RFQ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductViewActionDrawer;
