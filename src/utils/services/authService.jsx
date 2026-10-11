import Cookies from "js-cookie";

export const authService = {
  getAuthToken() {
    return Cookies.get("auth") || null;
  },


  removeAuthToken() {
    Cookies.remove("auth");
  },
};
