import React from "react";
import {configure} from "unicss";

// Import theme
import theme from "./src/theme.js";

// Configure UniCSS for using React.createElement as the pragma function for styled
configure({
    pragma: React.createElement,
    theme: theme,
});

// Just a fake wrapper
// export const wrapRootElement = ({ element }) => {
//     return (
//         <React.Fragment>{element}</React.Fragment>
//     );
// };
