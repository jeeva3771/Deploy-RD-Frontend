// import { createTheme } from '@mui/material/styles';

// const defaultTheme = createTheme({
//   typography: {
//     fontFamily: [
//       'Nunito Sans',
//     ].join(','),
//   },
//   palette: {
//     primary: {
//       main: '#1976d2',
//     },
//     secondary: {
//       main: '#dc004e',
//     },
//   },
  // Add other theme configurations as needed
// });

// export default defaultTheme;

import { createTheme } from "@mui/material/styles";

const defaultTheme = createTheme({
  typography: {
    fontFamily: ["Nunito Sans"].join(","),
  },
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },

  // Global Component Customizations
  components: {
    // Global override for <Select>
    MuiSelect: {
      styleOverrides: {
        select: {
          padding: "10px 14px",
          backgroundColor: "var(--theme-bg-primary)",
          color: "var(--theme-text-primary)",
        },
        outlined: {
          backgroundColor: "var(--theme-bg-primary)",
          borderRadius: "8px",
          transition: "all 0.25s ease",
        },
      },
    },

    // Override for <OutlinedInput> (borders & focus)
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "& fieldset": {
            borderColor: "var(--theme-border-secondary)",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          },
          "&.Mui-focused fieldset": {
            borderColor: "var(--theme-border-focus)",
            borderWidth: "2px",
            boxShadow: "0 0 0 0.2rem rgba(59,130,246,0.25)",
          },
        },
      },
    },

    // Dropdown menu (<Paper> used by <Menu>)
    MuiPaper: {
      styleOverrides: {
        root: {
          "&.MuiMenu-paper": {
            backgroundColor: "var(--theme-bg-primary)",
            color: "var(--theme-text-primary)",
            border: "1px solid var(--theme-border-secondary)",
            boxShadow: "0 8px 20px 0 var(--theme-shadow)",
            maxHeight: "192px",
            overflowY: "auto",
            // Custom scrollbar
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              background: "var(--theme-border-secondary)",
              borderRadius: "4px",
              border: "2px solid transparent",
              backgroundClip: "content-box",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "var(--theme-border-focus)",
              borderColor: "transparent",
            },
            scrollbarWidth: "thin",
            scrollbarColor: "var(--theme-border-secondary) transparent",
          },
        },
      },
    },
  },
});

export default defaultTheme;

