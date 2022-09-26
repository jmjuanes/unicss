import React from "react";
import {createUni, classNames} from "@unicss/core";

const Context = React.createContext(null);

// Available hooks
export const useTheme = () => {
    return (React.useContext(Context)).theme;
};
export const useCss = styles => {
    return (React.useContext(Context)).css(styles);
};
export const useKeyframes = obj => {
    return (React.useContext(Context)).keyframes(obj);
};
export const useGlobalCss = styles => {
    return (React.useContext(Context)).globalCss(styles);
};

// Theme provider
export const ThemeProvider = props => {
    let ctx = React.useContext(Context);
    if (!ctx || ctx?.theme !== props?.theme) {
        ctx = createUni({
            ...(props.theme || {}),
            key: "react",
        });
    }
    return React.createElement(Context.Provider, {value: ctx}, props.children);
};

// HOC that wraps a component and adds the current theme as a prop
export const withTheme = Component => {
    const name = Component.displayName || Component.name || "Component";
    const ThemedComponent = React.forwardRef((props, ref) => {
        const theme = useTheme();
        return React.createElement(Component, {
            ...props,
            theme: theme,
            ref: ref,
        });
    });
    ThemedComponent.displayName = `withTheme(${name})`;
    return ThemedComponent;
};

const __createStyledElement = (type, props, ref, initialCss) => {
    const {as, css, ...rest} = props;
    const className = useCss({
        boxSizing: "border-box",
        minWidth: "0",
        ...initialCss,
        ...css,
    });
    return React.createElement(as || type, {
        ...rest,
        ref: ref,
        className: classNames(props.className, className),
    });
};

// Create an styled element
export const styled = (type, css) => {
    return React.forwardRef((props, ref) => {
        return __createStyledElement(type || "div", props, ref, css || {});
    });
};

// Wrapper component for applying styles
export const Box = React.forwardRef((props, ref) => {
    return __createStyledElement("div", props, ref, {});
});
