import axios from "axios";
import Cookies from "js-cookie";
import { backendUrl } from "../url/config";
import { axiosInstance } from "../url/config";
import { decodeJwt } from "../helper/jwtHelper";

export const sessionService = {
  async onCheck() {
    try {

      // const userData = Cookies.get("auth");
      // if (!userData) return false;

      // const parsed = JSON.parse(userData);
      const parsed = localStorage.getItem('token')
      if (!parsed) return false;

      const decoded = decodeJwt(parsed);
      if (!decoded) return false;

      const { id, uuid } = decoded; 
   

      const response = await axiosInstance.post(`/auth/session-service`, { Id: id, uuID: uuid });

      return response.data?.status || false;
    } catch (err) {
      console.error("Session check failed:", err);
      return false;
    }
  },
};
