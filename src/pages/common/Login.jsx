import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import logo from "../../../public/logo.svg";
import { loginUser, clearError } from "../../reducer/authReducer.js";
// import { useAuth } from "../../context/auth.jsx";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  // const { setAuth } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);

  // Get Redux auth state
  const { isLoading, error, isAuthenticated, user, token } = useSelector(
    state => state.auth
  );

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user && token) {
      const dashboardRoute = "/dashboard";
      const redirectPath = location.state?.from?.pathname || dashboardRoute;
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, token, navigate, location]);

  // Handle login errors from Redux
  // useEffect(() => {
  //   if (error) {
  //     // toast.error(error);
  //     // Optional: Auto-clear error after 5 seconds
  //     const timer = setTimeout(() => {
  //       dispatch(clearError());
  //     }, 5000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [error, dispatch]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.username || !formData.password) {
      toast.error("Please enter both username and password.");
      return;
    }

    try {
      // Dispatch Redux login action
      const result = await dispatch(
        loginUser({
          username: formData.username,
          password: formData.password,
        })
      );

      // ✅ CORRECT: Check action type
      if (result.type === loginUser.fulfilled.type) {
        // Success - result.payload contains { token, user, success, message }
        const data = result.payload;

        // Optional: Update context if needed
        // if (setAuth) {
        //   setAuth(data);
        // }

        // Save to cookie if remember me is checked
        if (formData.rememberMe) {
          Cookies.set(
            "auth",
            JSON.stringify({
              token: data.token,
              user: data.user,
            }),
            { expires: 1 }
          );
        }

        toast.success(data.message || "Login successful!");

        // Navigate to dashboard
        const dashboardRoute = "/dashboard";
        const redirectPath = location.state?.from?.pathname || dashboardRoute;
        navigate(redirectPath, { replace: true });
      } else if (result.type === loginUser.rejected.type) {
        // Error - result.payload contains error message
        toast.error(result.payload || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Unexpected login error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      // const timer = setTimeout(() => {
      dispatch(clearError());
      // }, 5000);
    }
  };

  return (
    <>
      <div className="font-sans">
        <div
          id="login-page"
          className="min-h-screen bg-gradient-to-br flex items-center justify-center p-4 transition-all duration-500 from-blue-500 to-blue-200"
        >
          <div
            id="login-card"
            className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden transition-all duration-500 bg-white"
          >
            {/* Card Header */}
            <div
              id="card-header"
              className="p-6 flex justify-center transition-all duration-500 bg-gray-700"
            >
              <div
                id="logo"
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg pl-1"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center">
                  <img src={logo} alt="Logo" />
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div id="card-body" className="p-8">
              <h1
                className="text-3xl font-bold text-center mb-8 transition-colors duration-500 text-xl text-primary-darkGrey text-gray-700"
              >
                Sign In
              </h1>

              <form onSubmit={handleSubmit} id="login-form">
                {/* Username Field */}
                <div id="username-field" className="mb-6">
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium mb-1 transition-colors duration-500 text-gray-700"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="fa-regular fa-user text-gray-400"></i>
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all border-gray-300 bg-white text-gray-900"
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div id="password-field" className="mb-8">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium mb-1 transition-colors duration-500 text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="fa-solid fa-lock text-gray-400"></i>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all border-gray-300 bg-white text-gray-900"
                      placeholder="Enter your password"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
                      <i
                        onClick={togglePasswordVisibility}
                        disabled={isLoading}
                        className="flex items-center justify-center focus:outline-none text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        {showPassword ? (
                          <VisibilityIcon
                            sx={{
                              fontSize: { xs: 16, sm: 16, md: 20, lg: 20 },
                            }}
                          />
                        ) : (

                          <VisibilityOffIcon
                            sx={{
                              fontSize: { xs: 16, sm: 16, md: 20, lg: 20 },
                            }}
                          />
                        )}
                      </i>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center ${isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "primary-bgclr hover:bg-blue-700 text-white"
                    }`}
                >
                  {isLoading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                      Signing In...
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <i className="fa-solid fa-arrow-right ml-2"></i>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;