// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import "./index.css";
import "./output.css";
import App from "./App.jsx";
import { ThemeProvider } from "./context/Themecontext.jsx";
import "./darkmode.css";
import { LoaderProvider } from "./context/LoaderContext";
// import { AuthProvider } from "./context/auth";
// import { PriorityColorProvider } from "./context/PriorityColorContext";
import "react-toastify/dist/ReactToastify.css";
import { Provider } from "react-redux";
import store from "./store.js";


const savedTheme = localStorage.getItem("PP-theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

createRoot(document.getElementById("root")).render(
  <>
    <Provider store={store}>
      {/* <AuthProvider> */}
        <LoaderProvider>
          {/* <ThemeProvider> */}
            {/* <PriorityColorProvider> */}
            <App />
            {/* </PriorityColorProvider> */}
          {/* </ThemeProvider> */}
        </LoaderProvider>
      {/* </AuthProvider> */}
    </Provider>
  </>
);
