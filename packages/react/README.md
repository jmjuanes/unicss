# @unicss/react

Style your React components using UniCSS.

## Installation

Install this package using **npm**:

```bash
 npm install --save @unicss/react
```

## Usage

You can use `UniProvider` component to configure your theme, and the `styled` function to create styled components:

```js
import React from "react";
import {UniProvider, styled} from "@unicss/react";

const theme = {
    colors: {
        primary: "cadetblue",
    },
};

const Button = styled("a", {
    backgroundColor: "primary",
    color: "white",
    padding: "1rem",
    width: "100%",
});

const App = () => (
    <UniProvider config={{theme}}>
        <Button href="/">Hello world</Button>
    </UniProvider>
);
```

## API

### UniProvider

A simple React component that accepts a **unicss configuration object** as a prop and pass it top-down using [Context](https://reactjs.org/docs/context.html).

```jsx
import {UniProvider} from "@unicss/react";

// Create your configuration with your theme, mixins, custom properties...
const config = {
    // ...your config
};

export default App = () => (
    <UniProvider config={config}>
        ...
    </UniProvider>
);
```

### styled(type, css)

Generate a styled React component with the specified type and CSS styles.

```jsx
import {UniProvider, styled} from "@unicss/react";

const config = {
    theme: {
        colors: {
            primary: "#2271b1",
        },
    },
};

const ButtonLink = styled("a", {
    color: "$primary",
    display: "block",
    padding: "2rem",
    textDecoration: "none",
    "&:hover": {
        cursor: "pointer",
    },
});

const App = () => (
    <UniProvider config={config}>
        <ButtonLink href="/login">
            Login
        </ButtonLink>
    </UniProvider>
);
```

### useTheme()

A React [Hook](https://reactjs.org/docs/hooks-intro.html) that returns the current theme provided to `<UniProvider>`.

```jsx
import {useTheme} from "@unicss/react";

export const Text = props => {
    const theme = useTheme();

    return (
        <span style={{color: theme.colors.primary}}>
            {props.children}
        </span>
    );
};
```

### useCss(css)

A React Hook that accepts a CSS object and returns a classname for the provided styles. This hook will use the theme object provided to `<UniProvider>` component.

```jsx
import React from "react";
import {UniProvider, useCss} from "@unicss/react";

const theme = {
    colors: {
        primary: "cadetblue",
    },
};

const Button = props => {
    const className = useCss({
        backgroundColor: "primary",
        borderRadius: "0.5rem",
        color: "white",
        padding: "2re",
        width: "100%",
    });
    return (
        <a className={className} href={props.href}>
            {props.children}
        </a>
    );
};

const App = () => (
    <UniProvider config={{theme}}>
        <Button href="/">Hello world</Button>
    </UniProvider>
);
```

## License

[MIT License](https://github.com/jmjuanes/unicss/blob/main/LICENSE).
