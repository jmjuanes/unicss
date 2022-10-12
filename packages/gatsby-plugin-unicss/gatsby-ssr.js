import React from "react";
import {extractCss, configure} from "unicss";

// Import theme
import theme from "./src/theme.js";

// Configure UniCSS for using React.createElement as the pragma function for styled
configure({
    pragma: React.createElement,
    theme: theme,
});

//Called after every page Gatsby server renders while building HTML
//https://www.gatsbyjs.com/docs/reference/config-files/gatsby-ssr/#onRenderBody
export const onRenderBody = ({setHeadComponents}) => {
    // const sheet = sheetsByPathname.get(pathname);
    setHeadComponents([
        <style
            data-source="unicss"
            dangerouslySetInnerHTML={{
                __html: extractCss(),
            }}
        />
    ]);
};
