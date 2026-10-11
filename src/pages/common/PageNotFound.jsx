// import React from 'react';
// import { Link as RouterLink } from 'react-router-dom'; 
// import { Container, Typography, Button, Grid, Link } from '@mui/material';
// import { makeStyles } from '@mui/styles'; 

// const useStyles = makeStyles((theme) => ({
//   root: {
//     height: '100vh',
//     display: 'flex',
//     flexDirection: 'column',
//     justifyContent: 'center',
//     alignItems: 'center',
//     textAlign: 'center',
//   },
//   heading: {
//     marginBottom: theme.spacing(2),
//   },
//   button: {
//     marginTop: theme.spacing(2),
//     color: 'white !important',
//     fontWeight: 'bold',
//   },
// }));

// const PageNotFound = () => {
//   const classes = useStyles();

//   return (
//     <Container maxWidth="sm" className={classes.root}>
//       <Grid container spacing={2} justifyContent="center">
//         <Grid item xs={12}>
//           <Typography variant="h1" className={classes.heading}>
//             404
//           </Typography>
//           <Typography variant="h5" gutterBottom>
//             Oops! Page not found.
//           </Typography>
//           <Typography variant="body1">
//             The page you are looking for might have been removed, had its name changed,
//             or is temporarily unavailable.
//           </Typography>
//           <Button
//             variant="contained"
//             color="primary"
//             component={RouterLink}
//             to="/dashboard"
//             className={classes.button}
//           >
//             Go to Home
//           </Button>
//         </Grid>
//         <Grid item xs={12}>
//           <Typography variant="body2">
//             Need assistance? Contact us at {' '}
//             <Link href="mailto:support@example.com">support@gmail.com</Link>
//           </Typography>
//         </Grid>
//       </Grid>
//     </Container>
//   );
// };

// export default PageNotFound;



import React from 'react';
import { Link as RouterLink } from 'react-router-dom'; 
import { Container, Typography, Button, Grid, Link } from '@mui/material';
import { makeStyles } from '@mui/styles'; 

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  heading: {
    marginBottom: theme.spacing(2),
  },
  button: {
    marginTop: theme.spacing(2),
    color: 'white !important',
    fontWeight: 'bold',
  },
}));

const PageNotFound = () => {
  const classes = useStyles();

  return (
    <Container maxWidth="sm" className={classes.root}>
      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={12}>
          {/* <Typography variant="h1" className={classes.heading}>
            404
          </Typography> */}
          <Typography variant="h5" gutterBottom>
            We're working on it!
          </Typography>
          {/* <Typography variant="body1">
            The page you're trying to access is currently unavailable. It might be under maintenance or in development. Please check back later.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/dashboard"
            className={classes.button}
          >
            Return to Dashboard
          </Button> */}
        </Grid>
        {/* <Grid item xs={12}>
          <Typography variant="body2">
            Need assistance? Reach out at{' '}
            <Link href="mailto:support@example.com">support@example.com</Link>
          </Typography>
        </Grid> */}
      </Grid>
    </Container>
  );
};

export default PageNotFound;
