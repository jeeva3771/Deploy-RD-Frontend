import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { decodeJwt } from "../helper/jwtHelper";
import { getUserPermissions } from "../permission/auth";


export const useAuthData = () => {
  const navigate = useNavigate();

  const [isHead, setIsHead] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [permissions, setPermissions] = useState([]);

  const [isPricingSpecialist, setIsPricingSpecialist] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [userId, setUserId] = useState(null);




  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userData || !token) {
      navigate("/login");
      return;
    }

    const decoded = decodeJwt(token);
    if (!decoded) {
      navigate("/login");
      return;
    }

    setIsHead(decoded.is_head || false);
    setIsPricingSpecialist(decoded.is_pricing_specialist || false);
    setDepartmentId(decoded.department_id || "");
    setDepartmentName(decoded.department_name || "");

    setUserRole(decoded.role || "");
    setUserId(decoded.id || decoded._id || "");
  }, [navigate]);

  useEffect(() => {
    const userPermissions = getUserPermissions();
    setPermissions(userPermissions);
  }, []);

  const ProductionRole = userRole?.toLowerCase()?.includes("production");
  const AdminRole = userRole?.toLowerCase() === "admin executive";
  const SalesRole = userRole?.toLowerCase()?.includes("client servicing");
  const AssociateRole = userRole?.toLowerCase()?.includes("associate");


  return {
    isHead,
    userRole,
    permissions,
    ProductionRole,
    AdminRole,
    SalesRole,
    AssociateRole,
    isPricingSpecialist,
    departmentId,
    departmentName,
    userId: userId // Expose userId
  };
};
