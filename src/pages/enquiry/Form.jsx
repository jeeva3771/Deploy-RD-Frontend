import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { axiosInstance, backendUrl } from "../../utils/url/config";
import { toast } from "react-toastify";
import { formatDateToDDMMYYYY } from "../../utils/enquiry/dateformat";
import { capitalizeFirst } from "../../utils/helper/capitalize";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { FormControl, Select, MenuItem, TextField, Autocomplete, Grid, Button, Chip } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DescriptionIcon from "@mui/icons-material/Description";
import CloseIcon from "@mui/icons-material/Close";
import { getFileName } from "../../utils/helper/FilenameURL";

const EnquiryForm = () => {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const { enquiryId } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const [showDetails, setShowDetails] = useState({
    client: true,
    images: true,
    product: true,
    coordinator: true,
    delivery: true,
  });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDeliveryModes, setLoadingDeliveryModes] = useState(true);
  const [loadingPaymentTerms, setLoadingPaymentTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [whoWillPayOptions, setWhoWillPayOptions] = useState([]);
  const [customDeliveryMode, setCustomDeliveryMode] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [designattachments, setDesignAttachments] = useState([]);

  const [existingImageKeys, setExistingImageKeys] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [attachmentsKeys, setAttachmentsKeys] = useState([]);



  const [errors, setErrors] = useState({});
  const [units, setUnits] = useState([]);
  const [unitValues, setUnitValues] = useState([]);


  const path = window.location.pathname;
  const parts = path.split("/");

  const section = parts[1];

  // console.log("section",section);

  const clientenquiryaddsection = section === "enquiriesc";
  const withoutdesignerenquiryaddsection = section === "enquiriesw";
  const withdesignerenquiryaddsection = section === "enquiries";


  // console.log("clientenquiryaddsection",clientenquiryaddsection)

  const steps = [
    { id: 1, label: "Client Details", icon: "fa-user", shortLabel: "Client" },
    { id: 2, label: "Image Upload", icon: "fa-image", shortLabel: "Images" },
    { id: 3, label: "Product Details", icon: "fa-box", shortLabel: "Product" },
    {
      id: 4,
      label: "Assign Coordinator",
      icon: "fa-user-tie",
      shortLabel: "Coordinator",
    },
    {
      id: 5,
      label: "Delivery Details",
      icon: "fa-truck",
      shortLabel: "Delivery",
    },
    { id: 6, label: "Payment", icon: "fa-credit-card", shortLabel: "Payment" },
  ];


  const copyrightOptions = [
    { id: 1, value: "This artwork is the intellectual property of RD Custom Awards Pvt. Ltd., and all copyrights are held exclusively by RD Custom Awards Pvt. Ltd" },
    { id: 2, value: "Please note Design Copyrights Apply & is credited with the designer of this design" },

  ];


  // Multi-step form data
  const [formData, setFormData] = useState({
    // Step 1: Client Details
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    enquiryOrigin: "",
    optionsRequired: "",
    referenceNo: "",
    category: "",
    subcategory: "",

    whatsapp_numbers: [],
    emails: [],
    show_logo: false,
    show_content: false,
    copyright_content: "",
    links_duration: "",


    // Step 3: Product Details
    productName: "",
    quantity: "",
    unit: "",
    size: "",
    budget: "",
    targetDesignPrice: "",
    material: "",
    productDescription: "",

    // Step 5: Delivery Details
    deliveryDate: "",
    deliveryType: "",
    deliveryLocation: "",
    deliveryMode: "",
    specialInstructions: "",

    cloned_from: "",

    isDesignerNeeded: false,
    quatationPurpose: false,

    // Step 4: Assign Coordinator
    coordinatorId: "",

    // Step 6: Payment
    payment_terms: "",
    designer_person: [],

    designer_remarks: ""
  });


  useEffect(() => {
    if (withdesignerenquiryaddsection === true) {
      setFormData(prev => ({
        ...prev,
        isDesignerNeeded: true,
      }));
    }
  }, [withdesignerenquiryaddsection]);

  useEffect(() => {
    if (!enquiryId) return;

    const fetchEnquiryById = async () => {
      try {
        setIsLoading(true);

        const res = await axiosInstance.get(
          `${backendUrl}/enquiry/${enquiryId}`
        );

        if (res.data.success) {
          const data = res.data.data;

          setFormData((prev) => ({
            ...prev,
            clientName: data?.name || "",
            clientPhone: data?.mobile_no || "",
            enquiryOrigin: data?.enquiry_origin || "",
            optionsRequired: String(data?.no_of_options || ""),
            referenceNo: data?.reference_no || "",
            category: data?.category || "",
            subcategory: data?.subcategory || "",
            emails: data?.email || [],
            whatsapp_numbers: data?.wp_number || [],
            productName: data?.product_name || "",
            quantity: data?.product_quantity || "",
            unit: data?.unit || "",
            product_size: data?.product_size?.[0] || {},
            budget: data?.budget || "",
            targetDesignPrice: data?.budget_to || "",
            material: data?.preferred_material || "",
            productDescription: data?.product_description || "",
            show_logo: data?.show_logo || false,
            show_content: data?.show_content || false,
            copyright_content: data?.copyright_content || "",
            links_duration: data?.links_duration || "",
            coordinatorId: data?.marketing_cordinator?._id || "",
            deliveryType: data?.delivery_type || "",
            deliveryMode: data?.delivery_mode || "",
            deliveryLocation: data?.delivery_location || "",
            specialInstructions: data?.briefing || "",
            whoWillPay: data?.who_will_pay || "",
            payment_terms: data?.payment_terms || "",
            isDesignerNeeded: data?.is_designer_needed,
            quatationPurpose: data?.quatation_purpose_only,
            cloned_from: data?.job_no || "",
            designer_person: data?.designer_person || [],
            designer_remarks: data?.designer_remarks || "",
          }));
          // console.log("formData.designer_person", JSON.stringify(formData.designer_person ))

          /* ================= IMAGES ================= */

          if (
            Array.isArray(data.reference_images) &&
            Array.isArray(data.storage_keys)
          ) {
            const images = data.reference_images.map((url, index) => ({
              id: index,
              url,
              key: data.storage_keys[index],
              name: getFileName(url),
            }));

            setFormData(prev => ({
              ...prev,
              uploadedImages: images,
            }));

            setExistingImageKeys(
              images.map(img => img.key)
            );
          }

          /* ================ ATTACHMENTS ================ */

          if (
            Array.isArray(data.additional_attachments) &&
            Array.isArray(data.attachment_keys)
          ) {
            const attachments = data.additional_attachments.map((url, index) => ({
              id: index,
              url,
              key: data.attachment_keys[index],
              name: getFileName(url),
            }));

            setExistingAttachments(attachments);
            setAttachmentsKeys(
              attachments.map(att => att.key)
            );
          }
        }
      } catch (error) {
        toast.error("Failed to load enquiry details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnquiryById();
  }, [enquiryId]);



  const [customers, setCustomers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [useExistingAddress, setUseExistingAddress] = useState(true);
  const [users, setUsers] = useState([]);
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [deliveryModes, setDeliveryModes] = useState([]);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [category, setCategory] = useState([]);
  const [subcategory, setSubCategory] = useState([]);

  const [emailInput, setEmailInput] = useState("");
  const [whatsappInput, setWhatsappInput] = useState("");



  const handleAttachmentChange = (e) => {
    const newFiles = Array.from(e.target.files);

    setAttachments((prev) => [...(prev || []), ...newFiles]);
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments((prev) => prev.filter((_, i) => i !== indexToRemove));
  };


  const handleDesignAttachmentChange = (e) => {
    const newFiles = Array.from(e.target.files);

    setDesignAttachments((prev) => [...(prev || []), ...newFiles]);
  };

  const removeDesignAttachment = (indexToRemove) => {
    setDesignAttachments((prev) => prev.filter((_, i) => i !== indexToRemove));
  };


  const removeExistingAttachment = (id) => {
    setExistingAttachments(prev => {
      const file = prev.find(a => a.id === id);

      if (file?.key) {
        setAttachmentsKeys(keys =>
          keys.filter(k => k !== file.key)
        );
      }

      return prev.filter(a => a.id !== id);
    });
  };


  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axiosInstance.get(`${backendUrl}/customer`);
        if (response.data.success) {
          setCustomers(response.data.data || []);
        }
      } catch (error) {
        // toast.error("Error fetching customers");
      }
    };
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await axiosInstance.get(
          `${backendUrl}/user?roleName=Marketing Manager,Marketing Executive&order=asc&is_active=true`
        );
        if (response.data.success) {
          setUsers(response.data.data || []);
        }
      } catch (error) {
        // toast.error("Error fetching users");
      } finally {
        setLoadingUsers(false);
      }
    };
    const fetchDeliveryTypes = async () => {
      try {
        const response = await axiosInstance.get(`${backendUrl}/deliverytype?order=asc`);
        if (response.data.success) {
          setDeliveryTypes(response.data.data || []);
        }
      } catch (error) {
        toast.error("Error fetching delivery types");
      }
    };
    const fetchDeliveryModes = async () => {
      try {
        setLoadingDeliveryModes(true);
        const response = await axiosInstance.get(`${backendUrl}/deliverymode?order=asc`);
        if (response.data.success) {
          setDeliveryModes(response.data.data || []);
        }
      } catch (error) {
        toast.error("Error fetching delivery modes");
      } finally {
        setLoadingDeliveryModes(false);
      }
    };
    const fetchPaymentTerms = async () => {
      try {
        setLoadingPaymentTerms(true);
        const response = await axiosInstance.get(`${backendUrl}/payment?order=asc`);
        if (response.data.success) {
          setPaymentTerms(response.data.data || []);
        }
      } catch (error) {
        toast.error("Error fetching payment terms");
      } finally {
        setLoadingPaymentTerms(false);
      }
    };
    const fetchCategory = async () => {
      try {
        const response = await axiosInstance.get(
          `${backendUrl}/enquirycategory?is_active=true&order=asc`
        );
        if (response.data.success) {
          setCategory(response.data.data || []);
        }
      } catch (error) {
        toast.error(error?.response.data.message);
      }
    };
    const fetchSubCategory = async () => {
      try {
        const response = await axiosInstance.get(
          `${backendUrl}/enquirysubcategory?is_active=true&order=asc`
        );
        if (response.data.success) {
          setSubCategory(response.data.data || []);
        }
      } catch (error) {
        toast.error(error?.response.data.message);
      }

    };
    const fetchWhoWillPay = async () => {
      try {
        const response = await axiosInstance.get(
          `${backendUrl}/whowillpay?is_active=true&order=asc`
        );
        if (response.data.success) {
          setWhoWillPayOptions(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching who will pay options:", error);
        toast.error(error?.response.data.message);

      }
    };


    const fetchUnits = async () => {
      try {
        const res = await axiosInstance.get(`${backendUrl}/units?is_active=true&order=asc`);
        if (res.data.success) setUnits(res.data.data);
      } catch (err) {
        console.error("Error fetching units:", err);
        toast.error("Failed to load units");
      }
    };



    fetchUnits();
    fetchWhoWillPay();
    fetchCustomers();
    fetchUsers();
    fetchDeliveryTypes();
    fetchDeliveryModes();
    fetchPaymentTerms();
    fetchCategory();
    fetchSubCategory();
  }, []);

  const getFullAddress = (customer) => {
    if (
      customer.address &&
      Array.isArray(customer.address) &&
      customer.address.length > 0
    ) {
      return customer.address
        .map((addr) => {
          const addressParts = [
            addr.address_1,
            addr.address_2,
            addr.city,
            addr.state,
            addr.postal_code,
            addr.gst_no,
          ].filter((part) => part && part.trim() !== "");

          return addressParts.join(", ");
        })
        .filter((address) => address);
    }
    return [];
  };

  useEffect(() => {
    if (useExistingAddress && selectedCustomer) {
      const addresses = getFullAddress(selectedCustomer);
      setFormData((prev) => ({
        ...prev,
        deliveryLocation: addresses.length > 0 ? addresses[0] : "",
      }));
    } else if (!useExistingAddress) {
      setFormData((prev) => ({
        ...prev,
        deliveryLocation: "",
      }));
    }
  }, [useExistingAddress, selectedCustomer]);


  useEffect(() => {
    if (formData.unit) {
      const selectedUnit = units.find(
        (u) => u.name.trim().toLowerCase() === formData.unit.trim().toLowerCase()
      );
      setUnitValues(selectedUnit?.values || []);
    }
  }, [formData.unit, units]);


  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "optionsRequired") {
      if (/^\d*$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (name === "clientName") {
      if (value.length > 0) {
        const filtered = customers.filter((c) =>
          c.name.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filtered);
      } else {
        setSuggestions([]);
      }
    }
  };

  const handleDynamicSizeChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      product_size: {
        ...prev.product_size,
        [name]: value,
      },
    }));
  };

  // Email functions
  const handleAddEmail = () => {
    if (emailInput.trim() !== "" && /\S+@\S+\.\S+/.test(emailInput)) {
      setFormData((prev) => ({
        ...prev,
        emails: [...prev.emails, emailInput.trim()],
      }));
      setEmailInput("");
    }
  };

  const handleRemoveEmail = (index) => {
    setFormData((prev) => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index),
    }));
  };

  // WhatsApp functions
  const handleAddWhatsapp = () => {
    if (whatsappInput.trim() !== "" && /^\d+$/.test(whatsappInput)) {
      setFormData((prev) => ({
        ...prev,
        whatsapp_numbers: [...prev.whatsapp_numbers, whatsappInput.trim()],
      }));
      setWhatsappInput("");
    }
  };

  const handleRemoveWhatsapp = (index) => {
    setFormData((prev) => ({
      ...prev,
      whatsapp_numbers: prev.whatsapp_numbers.filter((_, i) => i !== index),
    }));
  };



  const selectCustomer = (customer) => {
    setFormData((prev) => ({
      ...prev,
      clientName: capitalizeFirst(customer.name),
      clientEmail: customer.email,
      clientPhone: customer.mobile_no,
      enquiryOrigin: customer.enquiries_origin,
      deliveryType: customer.delivery_type?.name || "",
      payment_terms: customer.payment_terms?.name
    }));
    setSelectedCustomer(customer);
    setSuggestions([]);
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((file) => {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      return validTypes.includes(file.type);
    });

    const maxImages = parseInt(formData.optionsRequired) || 0;
    const currentImageCount = formData.uploadedImages?.length || 0;
    // const newImageCount = currentImageCount + validFiles.length;

    if (maxImages === 0) {
      toast.error("Please specify a valid number of options required first.");
      return;
    }

    let allowedMax = maxImages;

    if (formData.isDesignerNeeded === true) {
      allowedMax = maxImages - 1;
    }
    const newImageCount = currentImageCount + validFiles.length;

    if (newImageCount > maxImages) {
      toast.error(
        `Maximum ${maxImages} images allowed based on options required.`
      );
      return;
    }
    //    if (newImageCount > allowedMax) {
    //   toast.error(
    //     formData.isDesignerNeeded
    //       ? `Designer is needed so — only ${allowedMax} images allowed.`
    //       : `Maximum ${maxImages} images allowed based on options required.`
    //   );
    //   return;
    // }

    const newImages = validFiles.map((file) => ({
      file: file,
      id: Date.now() + Math.random(),
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    setFormData((prev) => ({
      ...prev,
      uploadedImages: [...(prev.uploadedImages || []), ...newImages],
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (imageId) => {
    setFormData(prev => {
      const img = prev.uploadedImages.find(i => i.id === imageId);

      if (img?.key) {
        setExistingImageKeys(keys =>
          keys.filter(k => k !== img.key)
        );
      }

      return {
        ...prev,
        uploadedImages: prev.uploadedImages.filter(i => i.id !== imageId),
      };
    });
  };


  const toggleDetails = useCallback((section) => {
    setShowDetails((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.category.trim())
        newErrors.category = "Category is required";

      if (!formData.subcategory.trim())
        newErrors.subcategory = "Subcategory is required";

      if (!formData.clientName.trim())
        newErrors.clientName = "Client name is required";
      // if (!formData.clientEmail.trim())
      //   newErrors.clientEmail = "Email is required";
      // else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.clientEmail))
      //   newErrors.clientEmail = "Enter a valid email";


      if (formData.clientPhone && !/^\d{10}$/.test(formData.clientPhone))
        newErrors.clientPhone = "Enter a 10-digit phone number";

      if (!formData.whatsapp_numbers || formData.whatsapp_numbers.length === 0) {
        newErrors.whatsapp_numbers = "Whatsapp number is required";
      } else if (!formData.whatsapp_numbers.every(num => /^\d{10}$/.test(num))) {
        newErrors.whatsapp_numbers = "All Whatsapp numbers must be 10 digits";
      }

      if (!formData.emails || formData.emails.length === 0) {
        newErrors.emails = "Email is required";
      } else if (!formData.emails.every(mail => /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(mail))) {
        newErrors.emails = "All emails must be valid";
      }

      if (!formData.optionsRequired.trim())
        newErrors.optionsRequired = "Options required is required";
      else if (!/^\d+$/.test(formData.optionsRequired))
        newErrors.optionsRequired = "Enter a valid number";

    }

    if (currentStep === 3) {
      if (!formData.productName?.trim())
        newErrors.productName = "Product name is required";
      if (!formData.quantity)
        newErrors.quantity = "Order quantity is required";
      if (!formData.unit)
        newErrors.unit = "Unit of measurement is required";
      if (!formData.budget)
        newErrors.budget = "Budget is required";



      if (formData.show_content) {
        if (!formData.copyright_content) {
          newErrors.copyright_content = "Copyright Content is required";
        }
      }

      if (!formData.links_duration)
        newErrors.links_duration = "Links Duration is required";


      if (clientenquiryaddsection && designattachments.length === 0) {
        newErrors.designattachments = "Client design files are required";

      }


      if (!formData.material?.trim())
        newErrors.material = "Material is required";
      if (!formData.productDescription?.trim())
        newErrors.productDescription = "Description is required";

      if (formData.unit) {
        const selectedUnit = units.find(
          (u) => u.name.trim().toLowerCase() === formData.unit.trim().toLowerCase()
        );

        if (selectedUnit?.values?.length) {
          const normalizedValues = selectedUnit.values.map((v) =>
            v.trim().toLowerCase()
          );

          const hasHeight = normalizedValues.includes("height");

          let missing = false;

          if (hasHeight) {
            const heightKey = selectedUnit.values.find(
              (v) => v.trim().toLowerCase() === "height"
            );
            if (!formData.product_size?.[heightKey]?.trim()) {
              missing = true;
            }
          }

          if (missing) {
            newErrors.product_size = "Height is required";
          }
        }
      }
    }


    if (step === 5) {
      if (!formData.deliveryDate)
        newErrors.deliveryDate = "Delivery date is required";
      if (!formData.deliveryType)
        newErrors.deliveryType = "Select delivery type";
      if (!formData.deliveryMode)
        newErrors.deliveryMode = "Select delivery mode";

      if (
        formData.deliveryMode === "Break" ||
        formData.deliveryMode === "Hand Delivery + Courier"
      ) {
        if (!customDeliveryMode.trim()) {
          newErrors.customDeliveryMode = `Details required for "${formData.deliveryMode}"`;
        }
      }


      if (!formData.deliveryLocation.trim())
        newErrors.deliveryLocation = "Delivery location is required";
      if (!formData.specialInstructions)
        newErrors.specialInstructions = "Briefing is required";
      if (!formData.whoWillPay && formData.deliveryMode !== "Client Pickup")
        newErrors.whoWillPay = "Please select who will pay";


    }

    if (step === 6) {
      if (!formData.payment_terms)
        newErrors.payment_terms = "Select a payment option";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step) => {
    setCurrentStep(step);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // console.log("existingAttachments",existingAttachments)

  // console.log("FINAL image keys:", existingImageKeys);
  // console.log("FINAL attachment keys:", attachmentsKeys);


  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;


    if (formData.quatationPurpose === false) {
      // if (formData.isDesignerNeeded === false) {
      if (clientenquiryaddsection) {

        const uploadedCount = formData.uploadedImages?.length || 0;
        if (uploadedCount !== Number(formData.optionsRequired)) {
          toast.error(
            `Designer not selected, so uploaded images (${uploadedCount}) must match Options Required (${formData.optionsRequired}).`
          );

          return;
        }
      }
    }

    setIsLoading(true);


    const lastDesignerUser =
      Array.isArray(formData.designer_person) && formData.designer_person.length > 0
        ? formData.designer_person[formData.designer_person.length - 1]?.user
        : null;

    console.log("lastDesignerUser", lastDesignerUser);

    try {
      const fd = new FormData();
      fd.append("name", formData.clientName);
      fd.append("mobile_no", formData.clientPhone);
      // fd.append("email", formData.clientEmail);
      // fd.append("email", formData.emails);

      formData.emails.forEach(num => {
        fd.append("email[]", num);
      });


      // fd.append("wp_number", formData.whatsapp_numbers);


      formData.whatsapp_numbers.forEach(num => {
        fd.append("wp_number[]", num);
      });


      fd.append("enquiry_origin", formData.enquiryOrigin);
      fd.append("reference_no", formData.referenceNo);
      fd.append("no_of_options", formData.optionsRequired);
      fd.append("product_name", formData.productName);
      fd.append("product_quantity", formData.quantity);
      fd.append("unit", formData.unit);
      // fd.append("product_size", formData.size);
      fd.append("product_size", JSON.stringify([formData.product_size]));


      fd.append("budget", formData.budget);
      fd.append("budget_to", formData.targetDesignPrice);


      fd.append("show_logo", formData.show_logo);
      fd.append("show_content", formData.show_content);
      fd.append("copyright_content", formData.copyright_content);
      fd.append("links_duration", formData.links_duration);




      fd.append("preferred_material", formData.material);
      fd.append("product_description", formData.productDescription);
      const formattedDate = formatDateToDDMMYYYY(formData.deliveryDate);
      fd.append("delivery_date", formattedDate);
      fd.append("delivery_type", formData.deliveryType);
      fd.append("delivery_location", formData.deliveryLocation);
      fd.append("delivery_mode", customDeliveryMode || formData.deliveryMode);
      fd.append("who_will_pay", formData.whoWillPay);
      fd.append("briefing", formData.specialInstructions);
      if (formData.coordinatorId) {
        fd.append("marketing_cordinator", formData.coordinatorId);
      }
      fd.append("payment_terms", formData.payment_terms);

      fd.append("category", formData.category);
      fd.append("subcategory", formData.subcategory);

      if (enquiryId) {
        fd.append("cloned_from", formData.cloned_from);
      }

      if (lastDesignerUser) {
        fd.append("designer_person", lastDesignerUser);
        fd.append("designer_remarks", formData.designer_remarks);
        fd.append("status", "design");
      }




      if (section === "enquiries") {
        fd.append("is_designer_needed", true);
      }

      if (section === "enquiriesw") {
        fd.append("is_designer_needed", false);
        fd.append("quatation_purpose_only", formData.quatationPurpose);
      }

      if (section === "enquiriesc") {
        fd.append("is_client_design", true);

      }



      designattachments?.forEach((file) => {
        fd.append("client_design_files", file);
      });






      fd.append("clone_image_keys", JSON.stringify(existingImageKeys));

      formData.uploadedImages?.forEach((image) => {
        if (image && image.file instanceof File) {
          fd.append("images", image.file);
        }
      });


      // formData.uploadedImages?.forEach((image) => {
      //   fd.append("images", image.file);
      // });



      fd.append("clone_attachment_keys", JSON.stringify(attachmentsKeys));


      if (attachments?.length > 0) {
        attachments.forEach((file) => {
          fd.append("attachments", file);
        });
      }


      await axiosInstance.post(`${backendUrl}/enquiry`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Enquiry created successfully");
      // navigate("/enquiries");
      navigate(-1);
    } catch (error) {
      setIsLoading(false);
      toast.error(error.response?.data?.message || "Error creating enquiry");
    }
  };

  const renderStepIndicator = (step) => {
    const isActive = currentStep === step.id;
    const isCompleted = currentStep > step.id;

    return (
      <div key={step.id} className="flex flex-col items-center flex-1 relative">
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-1 sm:mb-2 transition-colors ${isCompleted
            ? "bg-green-500 text-white"
            : isActive
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-500"
            }`}
        >
          <i
            className={`fa-solid ${step.icon} text-xs sm:text-sm md:text-base`}
          ></i>
        </div>
        <span
          className={`text-[10px] sm:text-xs md:text-sm font-medium text-center transition-colors ${isActive
            ? "text-blue-600"
            : isCompleted
              ? "text-green-500"
              : "text-gray-500"
            }`}
        >
          <span className="hidden sm:inline">{step.label}</span>
          <span className="inline sm:hidden">{step.shortLabel}</span>
        </span>
        {step.id < 6 && (
          <div
            className={`absolute top-4 sm:top-5 md:top-6 left-[calc(50%+1rem)] sm:left-[calc(50%+1.25rem)] md:left-[calc(50%+1.5rem)] w-[calc(100%-2rem)] sm:w-[calc(100%-2.5rem)] md:w-[calc(100%-3rem)] h-0.5 -z-10 transition-colors ${isCompleted ? "bg-green-500" : "bg-gray-300"
              }`}
          ></div>
        )}
      </div>
    );
  };

  const renderSummaryCard = (title, data, editAction, sectionKey) => {
    const isVisible = showDetails[sectionKey];
    return (
      <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-900/5 rounded-lg border">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <h3 className="font-medium text-gray-800 text-sm sm:text-base">
              {title}
            </h3>
            <button
              className="hover:text-gray-700 rounded transition-colors"
              title={isVisible ? "Hide details" : "Show details"}
              onClick={() => toggleDetails(sectionKey)}
            >
              {isVisible ? (
                <VisibilityIcon
                  sx={{
                    fontSize: { xs: 14, sm: 16, md: 20, lg: 20 }, // responsive sizes
                    color: "text.secondary",
                  }}
                />
              ) : (
                <VisibilityOffIcon
                  sx={{
                    fontSize: { xs: 14, sm: 16, md: 20, lg: 20 },
                    color: "text.secondary",
                  }}
                />
              )}
              {/* <i
                className={`fa-solid ${
                  isVisible ? "fa-eye" : "fa-eye-slash"
                } text-xs sm:text-sm`}
              ></i> */}
            </button>
          </div>
          <button
            onClick={editAction}
            className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm flex items-center gap-1 transition-colors"
          >
            <i className="fa-solid fa-pen-to-square"></i>
            <span>Edit</span>
          </button>
        </div>
        {isVisible && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="break-words">
                <span className="text-gray-500">{key}:</span>
                <span className="ml-1 font-medium">
                  {value || "Not specified"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderImagesSummaryCard = (title, editAction, sectionKey) => {
    const isVisible = showDetails[sectionKey];
    return (
      <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-900/5 rounded-lg border">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <h3 className="font-medium text-gray-800 text-sm sm:text-base">
              {title}
            </h3>
            <button
              onClick={() => toggleDetails(sectionKey)}
              className="hover:text-gray-700 rounded transition-colors"
              title={isVisible ? "Hide details" : "Show details"}
            >
              {isVisible ? (
                <VisibilityIcon
                  sx={{
                    fontSize: { xs: 16, sm: 16, md: 20, lg: 20 }, // responsive sizes
                    color: "text.secondary",
                  }}
                />
              ) : (
                <VisibilityOffIcon
                  sx={{
                    fontSize: { xs: 16, sm: 16, md: 20, lg: 20 },
                    color: "text.secondary",
                  }}
                />
              )}
            </button>
          </div>
          <button
            onClick={editAction}
            className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm flex items-center gap-1 transition-colors"
          >
            <i className="fa-solid fa-pen-to-square"></i>
            <span className="xs:inline">Edit</span>
          </button>
        </div>
        {isVisible && (
          <div className="flex flex-wrap gap-2">
            {formData.uploadedImages && formData.uploadedImages.length > 0 ? (
              formData.uploadedImages.map((image, index) => (
                <div
                  key={image.id}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-gray-100 p-1"
                >
                  <img
                    src={image.url}
                    alt={`Uploaded image ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ))
            ) : (
              <span className="text-xs sm:text-sm text-gray-500">
                No images uploaded
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="flex-1 bg-gray-100 h-[calc(100vh-50px)] overflow-hidden"
      style={{ marginTop: "50px" }}
    >
      <div className="max-w-5xl mx-auto p-3 sm:p-4 md:p-6 flex flex-col max-h-full">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            {enquiryId ? "Cloned Enquiry Form" : "Enquiry Form"}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Complete all steps to submit your enquiry
          </p>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="flex justify-between gap-1 sm:gap-2">
            {steps.map((step) => renderStepIndicator(step))}
          </div>
        </div>

        {/* Step Content Container */}
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 md:p-6 flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
            {/* Step 1: Client Details */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
                  Client Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">



                  <FormControl fullWidth variant="outlined" size="small">
                    <label
                      className="block text-sm font-semibold text-gray-700 mb-2"
                      htmlFor="category-select"
                    >
                      Category <span className="text-red-600">*</span>
                    </label>

                    <Select
                      name="category"
                      id="category-select"
                      value={formData.category}
                      onChange={handleFormChange}
                      displayEmpty
                      size="small"
                    >
                      <MenuItem value="">
                        <span className="text-[var(--theme-text-muted)]">Select Category</span>
                      </MenuItem>
                      {category.length > 0 &&
                        [...category]
                          .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                          .map((cat) => (
                            <MenuItem key={cat._id} value={cat.name}>
                              {capitalizeFirst(cat.name)}
                            </MenuItem>
                          ))}
                    </Select>

                    {errors.category && (
                      <p className="text-red-600 text-sm mt-1">{errors.category}</p>
                    )}
                  </FormControl>

                  {/* Subcategory */}
                  <FormControl fullWidth variant="outlined" size="small" className="mt-4">
                    <label
                      className="block text-sm font-semibold text-gray-700 mb-2"
                      htmlFor="subcategory-select"
                    >
                      Subcategory <span className="text-red-600">*</span>
                    </label>

                    <Select
                      name="subcategory"
                      id="subcategory-select"
                      value={formData.subcategory}
                      onChange={handleFormChange}
                      displayEmpty
                      size="small"
                    >
                      <MenuItem value="">
                        <span className="text-[var(--theme-text-muted)]">Select Subcategory</span>
                      </MenuItem>
                      {subcategory.length > 0 &&
                        [...subcategory]
                          .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                          .map((sub) => (
                            <MenuItem key={sub._id} value={sub.name}>
                              {capitalizeFirst(sub.name)}
                            </MenuItem>
                          ))}
                    </Select>

                    {errors.subcategory && (
                      <p className="text-red-600 text-sm mt-1">{errors.subcategory}</p>
                    )}
                  </FormControl>


                  <div className="relative">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Client Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleFormChange}
                      className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${errors.clientName ? "border-red-500" : "border-gray-300"
                        }`}
                      placeholder="Enter client name"
                    />
                    {suggestions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto">
                        {suggestions.map((customer) => (
                          <li
                            key={customer._id}
                            onClick={() => selectCustomer(customer)}
                            className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                          >
                            {capitalizeFirst(customer.name)}
                          </li>
                        ))}
                      </ul>
                    )}
                    {errors.clientName && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.clientName}
                      </span>
                    )}
                  </div>
                  {/* <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="clientEmail"
                    value={formData.clientEmail}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Enter email address"
                  />

                  {errors.clientEmail && (
                    <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                      {errors.clientEmail}
                    </span>
                  )}
                </div> */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="Enter email address"
                        className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleAddEmail}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm sm:text-base"
                        style={{ backgroundColor: "#574fdd" }}
                      >
                        Add
                      </button>
                    </div>

                    {/* Display added emails as tags */}
                    {formData.emails.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.emails.map((mail, idx) => (
                          <div
                            key={idx}
                            className="flex items-center bg-gray-100 border border-gray-300 rounded-full px-3 py-1 text-sm"
                          >
                            {mail}
                            <button
                              type="button"
                              onClick={() => handleRemoveEmail(idx)}
                              className="ml-2 text-red-500 hover:text-red-700 font-bold"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {errors.emails && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.emails}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      name="clientPhone"
                      value={formData.clientPhone}
                      inputMode="numeric"
                      maxLength={10}
                      onChange={(e) => {
                        const value = e.target.value;

                        if (/^\d*$/.test(value) && value.length <= 10) {
                          handleFormChange(e);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Enter contact number (optional)"
                    />
                    {errors.clientPhone && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.clientPhone}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      WhatsApp Number <span className="text-red-500">*</span>
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={whatsappInput}
                        maxLength={10}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (/^\d*$/.test(value) && value.length <= 10) {
                            setWhatsappInput(e.target.value);
                          }
                        }}
                        // onChange={(e) => setWhatsappInput(e.target.value)}
                        placeholder="Enter WhatsApp number"
                        inputMode="numeric"
                        className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleAddWhatsapp}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm sm:text-base"
                        style={{ backgroundColor: "#574fdd" }}
                      >
                        Add
                      </button>
                    </div>

                    {/* Display added WhatsApp numbers as tags */}
                    {formData.whatsapp_numbers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.whatsapp_numbers.map((num, idx) => (
                          <div
                            key={idx}
                            className="flex items-center bg-gray-100 border border-gray-300 rounded-full px-3 py-1 text-sm"
                          >
                            {num}
                            <button
                              type="button"
                              onClick={() => handleRemoveWhatsapp(idx)}
                              className="ml-2 text-red-500 hover:text-red-700 font-bold"
                            >
                              ×
                            </button>
                          </div>
                        ))}


                      </div>
                    )}

                    {errors.whatsapp_numbers && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.whatsapp_numbers}
                      </span>
                    )}

                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Reference No
                    </label>
                    <input
                      type="text"
                      name="referenceNo"
                      value={formData.referenceNo}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                          handleFormChange(e);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Enter reference number (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Enquiry Origin
                    </label>
                    <input
                      type="text"
                      name="enquiryOrigin"
                      value={formData.enquiryOrigin}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Enter enquiry origin (optional)"
                    />
                    {errors.enquiryOrigin && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.enquiryOrigin}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Number of Options Required{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="optionsRequired"
                      value={formData.optionsRequired}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Enter number of options required"
                    />
                    {errors.optionsRequired && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.optionsRequired}
                      </span>
                    )}
                  </div>

                  <div>
                    {/* <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
  type="checkbox"
  id="isDesignerNeeded"
  name="isDesignerNeeded"
  checked={!!formData.isDesignerNeeded}
  onChange={(e) =>
    setFormData((prev) => ({
      ...prev,
      isDesignerNeeded: e.target.checked,
      quatationPurpose: e.target.checked ? false : prev.quatationPurpose,   
    }))
  }
  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
/>
                <label
                  htmlFor="isDesignerNeeded"
                  className="ml-2 block text-sm sm:text-base text-gray-700 font-medium"
                >
                  Designer Needed
                </label>
              </div>

                <div className="flex items-center">
                 <input
  type="checkbox"
  id="quatationPurpose"
  name="quatationPurpose"
  checked={!!formData.quatationPurpose}
  onChange={(e) =>
    setFormData((prev) => ({
      ...prev,
      quatationPurpose: e.target.checked,
      isDesignerNeeded: e.target.checked ? false : prev.isDesignerNeeded, 
    }))
  }
  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
/>
                  <label
                    htmlFor="quatationPurpose"
                    className="ml-2 block text-sm sm:text-base text-gray-700 font-medium"
                  >
                    For Quotation purpose only
                  </label>
                </div>
              </div> */}

                  </div>


                </div>
                <div className="mt-6 sm:mt-8 flex justify-end">
                  <button
                    onClick={nextStep}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg transition duration-200 flex items-center text-sm sm:text-base"
                    style={{ backgroundColor: "#574fdd" }}
                  >
                    Next
                    <i className="fa-solid fa-arrow-right ml-2"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Image Upload */}
            {currentStep === 2 && (
              <div>
                {renderSummaryCard(
                  "Client Details",
                  {
                    "Category": formData.category,
                    "Subcategory": formData.subcategory,
                    "Client Name": formData.clientName,
                    "Email": Array.isArray(formData.emails) ? formData.emails.join(", ") : formData.emails,
                    "Contact Number": formData.clientPhone,
                    "Whatsapp Number": Array.isArray(formData.whatsapp_numbers) ? formData.whatsapp_numbers.join(", ") : formData.whatsapp_numbers,
                    "Enquiry Origin": formData.enquiryOrigin,
                    "Options Required": formData.optionsRequired,
                    "Designer Needed": formData.isDesignerNeeded ? "Yes" : "No",
                    "Quatation purpose only": formData.quatationPurpose ? "Yes" : "No",

                  },
                  () => goToStep(1),
                  "client"
                )}

                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
                  Reference Image Upload
                </h2>

                <div
                  className={`border-2 border-dashed rounded-lg p-4 sm:p-6 md:p-8 text-center mb-4 sm:mb-6 transition-colors ${dragActive
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                    }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="mb-3 sm:mb-4">
                    <i className="fa-solid fa-cloud-arrow-up text-3xl sm:text-4xl text-gray-400"></i>
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2">
                    Drag & Drop your images here
                  </h3>
                  <p className="text-sm text-gray-500 mb-3 sm:mb-4">or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 sm:px-4 rounded-lg transition duration-200 text-sm sm:text-base"
                  >
                    Browse Files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                    Maximum {formData.optionsRequired || 0} images allowed
                  </p>
                </div>

                {formData.uploadedImages &&
                  formData.uploadedImages.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-800 mb-3 text-sm sm:text-base">
                        Uploaded Images ({formData.uploadedImages.length}/
                        {formData.optionsRequired || 0})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                        {formData.uploadedImages.map((image) => (
                          <div key={image.id} className="relative group">
                            <img
                              src={image.url}
                              alt={image.name}
                              className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-300"
                            />
                            <button
                              onClick={() => removeImage(image.id)}
                              className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                            >
                              ×
                            </button>
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              {image.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="mt-6 sm:mt-8 flex justify-between">
                  <button
                    onClick={previousStep}
                    className="border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg transition duration-200 flex items-center text-sm sm:text-base"
                  >
                    <i className="fa-solid fa-arrow-left mr-2"></i>
                    <span className="hidden xs:inline">Previous</span>
                    <span className="inline xs:hidden">Prev</span>
                  </button>
                  <button
                    onClick={nextStep}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg transition duration-200 flex items-center text-sm sm:text-base"
                    style={{ backgroundColor: "#574fdd" }}
                  >
                    Next
                    <i className="fa-solid fa-arrow-right ml-2"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Product Details */}
            {currentStep === 3 && (
              <div>
                {renderSummaryCard(
                  "Client Details",
                  {
                    "Category": formData.category,
                    "Subcategory": formData.subcategory,
                    "Client Name": formData.clientName,
                    "Email": Array.isArray(formData.emails) ? formData.emails.join(", ") : formData.emails,
                    "Contact Number": formData.clientPhone,
                    "Whatsapp Number": Array.isArray(formData.whatsapp_numbers) ? formData.whatsapp_numbers.join(", ") : formData.whatsapp_numbers,
                    "Enquiry Origin": formData.enquiryOrigin,
                    "Options Required": formData.optionsRequired,
                    "Designer Needed": formData.isDesignerNeeded ? "Yes" : "No",
                    "Quatation purpose only": formData.quatationPurpose ? "Yes" : "No",


                  },
                  () => goToStep(1),
                  "client"
                )}

                {renderImagesSummaryCard(
                  "Image Upload",
                  () => goToStep(2),
                  "images"
                )}

                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
                  Product Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Product Name / Theme <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="productName"
                      value={formData.productName}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Enter product name or theme"
                    />
                    {errors.productName && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.productName}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Order Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleFormChange}
                      min="1"
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Enter order quantity"
                    />

                    {errors.quantity && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.quantity}
                      </span>
                    )}
                  </div>

                  {/* <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Size <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="size"
                    value={formData.size}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Enter size"
                  />

                  {errors.size && (
                    <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                      {errors.size}
                    </span>
                  )}
                </div> */}

                  {/* Unit of Measurement */}



                  <div className="mb-6">
                    <FormControl fullWidth variant="outlined" size="small">
                      <label
                        className="block text-sm font-semibold text-gray-700 mb-2"
                        htmlFor="unit-select"
                      >
                        Unit of Measurement <span className="text-red-600">*</span>
                      </label>

                      <Select
                        name="unit"
                        id="unit-select"
                        value={formData.unit || ""}
                        onChange={(e) => {
                          const selectedUnit = units.find((u) => u.name === e.target.value);
                          setFormData((prev) => ({
                            ...prev,
                            unit: e.target.value,
                            product_size: prev.product_size || {},
                          }));
                          setUnitValues(selectedUnit?.values || []);
                        }}
                        displayEmpty
                        size="small"
                      >
                        <MenuItem value="">
                          <span className="text-gray-400">Select Unit</span>
                        </MenuItem>

                        {units.map((unit) => (
                          <MenuItem key={unit._id} value={unit.name}>
                            {unit.name}
                          </MenuItem>
                        ))}
                      </Select>

                      {errors.unit && (
                        <p className="text-red-600 text-sm mt-1">{errors.unit}</p>
                      )}
                    </FormControl>
                  </div>


                  {formData.unit && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-700 mb-3">
                        Product Size Details
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {unitValues.map((param) => {
                          const isHeight = param.trim().toLowerCase() === "height";

                          return (
                            <div key={param}>
                              <label className="block text-sm font-medium mb-1">
                                {param}
                                {isHeight && <span className="text-red-500 ml-1">*</span>}
                              </label>

                              <input
                                type="text"
                                inputMode="decimal"
                                value={formData.product_size?.[param] || ""}
                                onChange={(e) => {
                                  const numericValue = e.target.value.replace(/[^0-9.]/g, "");
                                  const cleanedValue = numericValue.replace(/(\..*?)\..*/g, "$1");

                                  setFormData((prev) => ({
                                    ...prev,
                                    product_size: {
                                      ...prev.product_size,
                                      [param]: cleanedValue,
                                    },
                                  }));
                                }}
                                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-600"
                                placeholder={`Enter ${param}`}
                                required={isHeight}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {errors.product_size && (
                        <span className="text-red-500 text-sm mt-2">{errors.product_size}</span>
                      )}
                    </div>
                  )}







                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Budget From <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Enter budget"
                    />

                    {errors.budget && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.budget}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Budget To
                    </label>
                    <input
                      type="number"
                      name="targetDesignPrice"
                      value={formData.targetDesignPrice}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Enter Budget To"
                    />
                  </div>

                  {/* Show Logo & Show Content */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.show_logo}
                        onChange={(e) =>
                          setFormData({ ...formData, show_logo: e.target.checked })
                        }
                        className="mr-2"
                      />
                      <label className="block text-sm font-medium text-gray-700">Show RD Logo</label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.show_content}
                        onChange={(e) =>
                          setFormData({ ...formData, show_content: e.target.checked })
                        }
                        className="mr-2"
                      />
                      <label className="block text-sm font-medium text-gray-700">Show RD Content</label>

                    </div>

                  </div>


                  {formData.show_content && (
                    <div className="mb-6">

                      <FormControl fullWidth variant="outlined" size="small" sx={{ width: '100%' }}>
                        <label
                          className="block text-sm font-medium text-gray-700 mb-2"
                          htmlFor="copyright_content"
                        >
                          Copyright Content <span className="text-red-600">*</span>
                        </label>

                        <Select
                          name="copyright_content"
                          id="copyright_content"
                          value={formData.copyright_content || ""}
                          onChange={handleFormChange}
                          displayEmpty
                          size="small"
                          sx={{
                            width: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <MenuItem value="">
                            <span className="text-gray-400">Select copyright content</span>
                          </MenuItem>

                          {copyrightOptions.map((copyrightOption) => (
                            <MenuItem key={copyrightOption.id} value={copyrightOption.value}>
                              {copyrightOption.value}
                            </MenuItem>
                          ))}
                        </Select>

                        {errors.copyright_content && (
                          <p className="text-red-600 text-sm mt-1">{errors.copyright_content}</p>
                        )}
                      </FormControl>


                    </div>


                  )}

                  {/* Links Duration */}
                  <div className="mt-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Links Duration (Hours) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="links_duration"
                      value={formData.links_duration}
                      onChange={handleFormChange}
                      placeholder="Enter links duration"
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      required
                    />
                    {errors.links_duration && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.links_duration}
                      </span>
                    )}
                  </div>




                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Preferred Material <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="material"
                      value={formData.material}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Enter preferred material"
                    />

                    {errors.material && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.material}
                      </span>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Product Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="productDescription"
                      value={formData.productDescription}
                      onChange={handleFormChange}
                      rows="3"
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Enter product description"
                    ></textarea>

                    {errors.productDescription && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.productDescription}
                      </span>
                    )}
                  </div>

                  <div className="md:col-span-2 mt-6">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Additional Attachments
                    </label>

                    {/* Upload Box */}
                    <div
                      className="
      border-2 border-dashed border-gray-300 rounded-lg p-6 text-center 
      hover:border-blue-500 transition cursor-pointer bg-gray-50
    "
                    >
                      <input
                        type="file"
                        name="attachments"
                        multiple
                        onChange={handleAttachmentChange}
                        className="hidden"
                        id="attachmentInput"
                      />

                      <label htmlFor="attachmentInput" className="cursor-pointer flex flex-col items-center">
                        <UploadFileIcon className="!text-gray-400" sx={{ fontSize: 48 }} />

                        <span className="text-sm text-gray-600 mt-2">
                          Drag & drop files here or{" "}
                          <span className="text-blue-600 font-medium">browse</span>
                        </span>
                      </label>
                    </div>

                    {/* File List */}
                    {attachments?.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Uploaded Files</h4>

                        <ul className="space-y-2">
                          {attachments.map((file, index) => (
                            <li
                              key={index}
                              className="
              flex items-center justify-between p-3 bg-white border border-gray-200 
              rounded-md shadow-sm
            "
                            >
                              <div className="flex items-center space-x-3">
                                <DescriptionIcon className="text-gray-500" />
                                <span className="text-sm text-gray-700">{file.name}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <CloseIcon fontSize="small" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Existing Attachments */}
                    {existingAttachments?.length > 0 && (
                      <div className="mt-2">


                        <ul className="space-y-2">
                          {existingAttachments.map((att) => (
                            <li
                              key={att.id}
                              className="
            flex items-center justify-between p-3 bg-white border border-gray-200
            rounded-md shadow-sm
          "
                            >
                              <div className="flex items-center space-x-3">
                                <DescriptionIcon className="text-gray-500" />
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-gray-700 hover:underline"
                                >
                                  {att.name}
                                </a>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeExistingAttachment(att.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <CloseIcon fontSize="small" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}


                  </div>



                  {clientenquiryaddsection && (
                    <div className="md:col-span-2 mt-6">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Client Design Files <span className="text-red-500">*</span>
                      </label>

                      <div
                        className="
        border-2 border-dashed border-gray-300 rounded-lg p-6 text-center
        hover:border-blue-500 transition cursor-pointer bg-gray-50
      "
                      >
                        <input
                          type="file"
                          name="clientfiles"
                          multiple
                          onChange={handleDesignAttachmentChange}
                          className="hidden"
                          id="clientfilesInput"
                        />

                        <label
                          htmlFor="clientfilesInput"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <UploadFileIcon className="!text-gray-400" sx={{ fontSize: 48 }} />

                          <span className="text-sm text-gray-600 mt-2">
                            Drag & drop files here or{" "}
                            <span className="text-blue-600 font-medium">browse</span>
                          </span>
                        </label>
                      </div>

                      {designattachments?.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Uploaded Files
                          </h4>

                          <ul className="space-y-2">
                            {designattachments.map((file, index) => (
                              <li
                                key={index}
                                className="
                flex items-center justify-between p-3 bg-white border border-gray-200
                rounded-md shadow-sm
              "
                              >
                                <div className="flex items-center space-x-3">
                                  <DescriptionIcon className="text-gray-500" />
                                  <span className="text-sm text-gray-700">{file.name}</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeDesignAttachment(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <CloseIcon fontSize="small" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {errors.designattachments && (
                        <span className="text-red-500 text-xs mt-1">
                          {errors.designattachments}
                        </span>
                      )}
                    </div>
                  )}


                </div>

                <div className="mt-6 sm:mt-8 flex justify-between">
                  <button
                    onClick={previousStep}
                    className="border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg transition duration-200 flex items-center text-sm sm:text-base"
                  >
                    <i className="fa-solid fa-arrow-left mr-2"></i>
                    <span className="hidden xs:inline">Previous</span>
                    <span className="inline xs:hidden">Prev</span>
                  </button>
                  <button
                    onClick={nextStep}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg transition duration-200 flex items-center text-sm sm:text-base"
                    style={{ backgroundColor: "#574fdd" }}
                  >
                    Next
                    <i className="fa-solid fa-arrow-right ml-2"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Assign Coordinator */}
            {currentStep === 4 && (
              <div>
                {renderSummaryCard(
                  "Client Details",
                  {
                    "Category": formData.category,
                    "Subcategory": formData.subcategory,
                    "Client Name": formData.clientName,
                    "Email": Array.isArray(formData.emails) ? formData.emails.join(", ") : formData.emails,
                    "Contact Number": formData.clientPhone,
                    "Whatsapp Number": Array.isArray(formData.whatsapp_numbers) ? formData.whatsapp_numbers.join(", ") : formData.whatsapp_numbers,
                    "Enquiry Origin": formData.enquiryOrigin,
                    "Options Required": formData.optionsRequired,
                    "Designer Needed": formData.isDesignerNeeded ? "Yes" : "No",
                    "Quatation purpose only": formData.quatationPurpose ? "Yes" : "No",


                  },
                  () => goToStep(1),
                  "client"
                )}

                {renderImagesSummaryCard(
                  "Image Upload",
                  () => goToStep(2),
                  "images"
                )}

                {renderSummaryCard(
                  "Product Details",
                  {
                    "Product Name": formData.productName,
                    "Order Quantity": formData.quantity,
                    unit: formData.unit,
                    size: JSON.stringify([formData.product_size]),
                    Budget: formData.budget,
                    "Budget To": formData.targetDesignPrice,
                    "Preferred Material": formData.material,
                    "Product Description": formData.productDescription,
                  },
                  () => goToStep(3),
                  "product"
                )}

                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
                  Assign Marketing Coordinator
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Coordinator
                    </label>
                    <select
                      name="coordinatorId"
                      value={formData.coordinatorId}
                      onChange={handleFormChange}
                      className="appearance-none w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      disabled={loadingUsers}
                    >
                      <option value="" disabled>Select coordinator</option>
                      {loadingUsers ? (
                        <option value="" disabled>
                          Loading...
                        </option>
                      ) : users.length > 0 ? (
                        [...users]
                          .sort((a, b) =>
                            a.name
                              .toLowerCase()
                              .localeCompare(b.name.toLowerCase())
                          )
                          .map((user) => (
                            <option key={user._id} value={user._id}>
                              {capitalizeFirst(user.name)} - ({user?.role?.name})
                            </option>
                          ))
                      ) : (
                        <option value="" disabled>
                          No coordinators available
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="mt-6 sm:mt-8 flex justify-between">
                  <button
                    onClick={previousStep}
                    className="border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg transition duration-200 flex items-center text-sm sm:text-base"
                  >
                    <i className="fa-solid fa-arrow-left mr-2"></i>
                    <span className="hidden xs:inline">Previous</span>
                    <span className="inline xs:hidden">Prev</span>
                  </button>
                  <button
                    onClick={nextStep}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg transition duration-200 flex items-center text-sm sm:text-base"
                    style={{ backgroundColor: "#574fdd" }}
                  >
                    Next
                    <i className="fa-solid fa-arrow-right ml-2"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Delivery Details */}
            {currentStep === 5 && (
              <div>
                {renderSummaryCard(
                  "Client Details",
                  {
                    "Category": formData.category,
                    "Subcategory": formData.subcategory,
                    "Client Name": formData.clientName,
                    "Email": Array.isArray(formData.emails) ? formData.emails.join(", ") : formData.emails,
                    "Contact Number": formData.clientPhone,
                    "Whatsapp Number": Array.isArray(formData.whatsapp_numbers) ? formData.whatsapp_numbers.join(", ") : formData.whatsapp_numbers,
                    "Enquiry Origin": formData.enquiryOrigin,
                    "Options Required": formData.optionsRequired,
                    "Designer Needed": formData.isDesignerNeeded ? "Yes" : "No",
                    "Quatation purpose only": formData.quatationPurpose ? "Yes" : "No",


                  },
                  () => goToStep(1),
                  "client"
                )}

                {renderImagesSummaryCard(
                  "Image Upload",
                  () => goToStep(2),
                  "images"
                )}

                {renderSummaryCard(
                  "Product Details",
                  {
                    "Product Name": formData.productName,
                    "Order Quantity": formData.quantity,
                    unit: formData.unit,
                    size: JSON.stringify([formData.product_size]),
                    Budget: formData.budget,
                    "Budget To": formData.targetDesignPrice,
                    "Preferred Material": formData.material,
                    "Product Description": formData.productDescription,
                  },
                  () => goToStep(3),
                  "product"
                )}

                {renderSummaryCard(
                  "Assign Coordinator",
                  {
                    Coordinator:
                      users.find((u) => u._id === formData.coordinatorId)?.name ||
                      "Not specified",
                  },
                  () => goToStep(4),
                  "coordinator"
                )}

                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
                  Delivery Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Delivery Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="deliveryDate"
                      value={formData.deliveryDate}
                      onChange={handleFormChange}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                    {errors.deliveryDate && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.deliveryDate}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Delivery Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="deliveryType"
                      value={formData.deliveryType}
                      onChange={handleFormChange}
                      className="appearance-none w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    >
                      <option value="" disabled>Select delivery type</option>
                      {deliveryTypes.length > 0 ? (
                        [...deliveryTypes]
                          .sort((a, b) =>
                            a.name
                              .toLowerCase()
                              .localeCompare(b.name.toLowerCase())
                          )
                          .map((type) => (
                            <option key={type._id} value={type.name}>
                              {type.name}
                            </option>
                          ))
                      ) : (
                        <option value="" disabled>
                          No delivery types available
                        </option>
                      )}
                    </select>
                    {errors.deliveryType && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.deliveryType}
                      </span>
                    )}
                  </div>
                  {/* <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Delivery Mode <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="deliveryMode"
                      value={formData.deliveryMode}
                      onChange={handleFormChange}
                      className="appearance-none w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      disabled={loadingDeliveryModes}
                    >
                      <option value="" disabled>Select delivery mode</option>
                      {loadingDeliveryModes ? (
                        <option value="" disabled>
                          Loading delivery modes...
                        </option>
                      ) : deliveryModes.length > 0 ? (
                        [...deliveryModes]
                          .sort((a, b) =>
                            a.name
                              .toLowerCase()
                              .localeCompare(b.name.toLowerCase())
                          )
                          .map((mode) => (
                            <option key={mode._id} value={mode.name}>
                              {mode.name}
                            </option>
                          ))
                      ) : (
                        <option value="" disabled>
                          No delivery modes available
                        </option>
                      )}
                    </select>
                    {errors.deliveryMode && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.deliveryMode}
                      </span>
                    )}
                  </div> */}


                  {/* Delivery Mode Selection */}
                  {/* Delivery Mode Selection */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Delivery Mode <span className="text-red-500">*</span>
                    </label>

                    <select
                      name="deliveryMode"
                      value={formData.deliveryMode}
                      onChange={(e) => {
                        handleFormChange(e);
                        // Reset custom input if mode changes
                        const value = e.target.value;
                        if (value !== "Break" && value !== "Hand Delivery + Courier") {
                          setCustomDeliveryMode("");
                        }

                        // Clear and disable 'Who Will Pay' if Client Pickup
                        if (value === "Client Pickup") {
                          setFormData((prev) => ({
                            ...prev,
                            whoWillPay: "",
                          }));
                        }
                      }}
                      className="appearance-none w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      disabled={loadingDeliveryModes}
                    >
                      <option value="" disabled>Select delivery mode</option>
                      {loadingDeliveryModes ? (
                        <option value="" disabled>
                          Loading delivery modes...
                        </option>
                      ) : deliveryModes.length > 0 ? (
                        [...deliveryModes]
                          .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                          .map((mode) => (
                            <option key={mode._id} value={mode.name}>
                              {mode.name}
                            </option>
                          ))
                      ) : (
                        <option value="" disabled>No delivery modes available</option>
                      )}
                    </select>

                    {/* Show input only for Break or Hand Delivery + Courier */}
                    {(formData.deliveryMode === "Break" ||
                      formData.deliveryMode === "Hand Delivery + Courier") && (
                        <input
                          type="text"
                          value={customDeliveryMode}
                          onChange={(e) => setCustomDeliveryMode(e.target.value)}
                          placeholder={`Enter details for "${formData.deliveryMode}"`}
                          className="mt-2 w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                      )}

                    {errors.deliveryMode && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.deliveryMode}
                      </span>
                    )}
                    {errors.customDeliveryMode && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.customDeliveryMode}
                      </span>
                    )}
                  </div>



                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Who Will Pay {formData.deliveryMode !== "Client Pickup" && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      name="whoWillPay"
                      value={formData.whoWillPay || ""}
                      onChange={handleFormChange}
                      disabled={formData.deliveryMode === "Client Pickup"}
                      className="appearance-none w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled>
                        Select who will pay
                      </option>
                      {whoWillPayOptions.length > 0 ? (
                        [...whoWillPayOptions]
                          .sort((a, b) =>
                            a.name.toLowerCase().localeCompare(b.name.toLowerCase())
                          )
                          .map((option) => (
                            <option key={option._id} value={option.name}>
                              {option.name}
                            </option>
                          ))
                      ) : (
                        <option value="" disabled>
                          No options available
                        </option>
                      )}
                    </select>
                    {errors.whoWillPay && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.whoWillPay}
                      </span>
                    )}
                  </div>



                  <div className="md:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Delivery Location <span className="text-red-500">*</span>
                    </label>
                    {selectedCustomer ? (
                      <div>
                        <div className="flex flex-col xs:flex-row gap-2 xs:gap-4 mb-2">
                          <label className="flex items-center text-sm">
                            <input
                              type="radio"
                              checked={useExistingAddress}
                              onChange={() => setUseExistingAddress(true)}
                              className="mr-2"
                            />
                            Use Existing Address
                          </label>
                          <label className="flex items-center text-sm">
                            <input
                              type="radio"
                              checked={!useExistingAddress}
                              onChange={() => setUseExistingAddress(false)}
                              className="mr-2"
                            />
                            New Address
                          </label>
                        </div>
                        {useExistingAddress ? (
                          <select
                            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                deliveryLocation: e.target.value,
                              }))
                            }
                            value={formData.deliveryLocation}
                          >
                            <option value="" disabled>Select an address</option>
                            {selectedCustomer &&
                              getFullAddress(selectedCustomer).map(
                                (address, index) => (
                                  <option key={index} value={address}>
                                    {address}
                                  </option>
                                )
                              )}
                          </select>
                        ) : (
                          <textarea
                            name="deliveryLocation"
                            value={formData.deliveryLocation}
                            onChange={handleFormChange}
                            rows="3"
                            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            placeholder="Enter new delivery address"
                          ></textarea>
                        )}
                      </div>
                    ) : (
                      <textarea
                        name="deliveryLocation"
                        value={formData.deliveryLocation}
                        onChange={handleFormChange}
                        rows="3"
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="Enter delivery address"
                      ></textarea>
                    )}
                    {errors.deliveryLocation && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.deliveryLocation}
                      </span>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Briefing <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="specialInstructions"
                      value={formData.specialInstructions}
                      onChange={handleFormChange}
                      rows="3"
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Enter briefing"
                    ></textarea>
                    {errors.specialInstructions && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                        {errors.specialInstructions}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 sm:mt-8 flex justify-between">
                  <button
                    onClick={previousStep}
                    className="border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg transition duration-200 flex items-center text-sm sm:text-base"
                  >
                    <i className="fa-solid fa-arrow-left mr-2"></i>
                    <span className="hidden xs:inline">Previous</span>
                    <span className="inline xs:hidden">Prev</span>
                  </button>
                  <button
                    onClick={nextStep}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg transition duration-200 flex items-center text-sm sm:text-base"
                    style={{ backgroundColor: "#574fdd" }}
                  >
                    Next
                    <i className="fa-solid fa-arrow-right ml-2"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 6: Payment */}
            {currentStep === 6 && (
              <div>
                {/* Summary of previous steps */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  {renderSummaryCard(
                    "Client Details",
                    {
                      "Category": formData.category,
                      "Subcategory": formData.subcategory,
                      "Client Name": formData.clientName,
                      "Email": Array.isArray(formData.emails) ? formData.emails.join(", ") : formData.emails,
                      "Contact Number": formData.clientPhone,
                      "Whatsapp Number": Array.isArray(formData.whatsapp_numbers) ? formData.whatsapp_numbers.join(", ") : formData.whatsapp_numbers,
                      "Enquiry Origin": formData.enquiryOrigin,
                      "Options Required": formData.optionsRequired,
                      "Designer Needed": formData.isDesignerNeeded ? "Yes" : "No",
                      "Quatation purpose only": formData.quatationPurpose ? "Yes" : "No",


                    },
                    () => goToStep(1),
                    "client"
                  )}


                  {renderImagesSummaryCard(
                    "Image Upload",
                    () => goToStep(2),
                    "images"
                  )}


                  {renderSummaryCard(
                    "Product Details",
                    {
                      "Product Name": formData.productName,
                      "Order Quantity": formData.quantity,
                      unit: formData.unit,
                      size: JSON.stringify([formData.product_size]),
                      Budget: formData.budget,
                      "Budget To": formData.targetDesignPrice,
                      "Preferred Material": formData.material,
                      "Product Description": formData.productDescription,
                    },
                    () => goToStep(3),
                    "product"
                  )}

                  {renderSummaryCard(
                    "Assign Coordinator",
                    {
                      Coordinator:
                        users.find((u) => u._id === formData.coordinatorId)
                          ?.name || "Not specified",
                    },
                    () => goToStep(4),
                    "coordinator"
                  )}

                  {renderSummaryCard(
                    "Delivery Details",
                    {
                      "Delivery Date": formatDateToDDMMYYYY(
                        formData.deliveryDate
                      ),
                      "Delivery Type": formData.deliveryType,
                      "Delivery Mode": formData.deliveryMode,
                      Location: formData.deliveryLocation,
                      Briefing: formData.specialInstructions,
                      "Who Will Pay": formData.whoWillPay,
                    },
                    () => goToStep(5),
                    "delivery"
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
                  Payment Options <span className="text-red-500">*</span>
                </h2>
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  {loadingPaymentTerms ? (
                    <p className="text-gray-500 text-sm">
                      Loading payment terms...
                    </p>
                  ) : paymentTerms.length > 0 ? (
                    paymentTerms.map((term) => (
                      <div
                        key={term._id}
                        className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-600 hover:bg-blue-900/5 transition-colors"
                      >
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="radio"
                            name="payment_terms"
                            value={term.name}
                            checked={formData.payment_terms === term.name}
                            onChange={handleFormChange}
                            className="mt-1 mr-2 sm:mr-3 accent-blue-600 flex-shrink-0"
                          />
                          <div>
                            <span className="font-medium text-gray-800 block mb-1 text-sm sm:text-base">
                              {term.name}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No payment terms available
                    </p>
                  )}
                  {errors.payment_terms && (
                    <span className="text-red-500 text-xs sm:text-sm mt-1 block">
                      {errors.payment_terms}
                    </span>
                  )}
                </div>

                <div className="mt-6 sm:mt-8 flex justify-between items-center">
                  {/* Previous Button */}
                  <button
                    onClick={previousStep}
                    className="border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg transition duration-200 flex items-center text-sm sm:text-base"
                  >
                    <i className="fa-solid fa-arrow-left mr-2"></i>
                    <span className="hidden xs:inline">Previous</span>
                    <span className="inline xs:hidden">Prev</span>
                  </button>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg transition duration-200 flex items-center text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#574fdd" }}

                  >
                    {isLoading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnquiryForm;
