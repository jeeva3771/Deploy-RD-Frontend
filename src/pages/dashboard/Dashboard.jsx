import React from "react";
import { getUser } from "../../utils/permission/auth";
import ClientServicingHub from "../clientservicing/ClientServicingHub";
import PageNotFoundwork from "../common/wotking";

const Dashboard = () => {
  const user = getUser();
  const userRole = String(user?.role?.name || user?.role || "").toLowerCase();
  const isClientServicing = userRole.includes("client servicing");

  if (isClientServicing) {
    return <ClientServicingHub />;
  }

  return <PageNotFoundwork />;
};

export default Dashboard;
