const hashCode = str => {
    return "uni-" + Math.abs(Array.from(str).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0)).toString();
};

// Get value in object from path
export const get = (obj, path) => {
    return path.split(".").reduce((o, p) => o?.[p], obj);
};

// Merge CSS styles
export const merge = (source, target) => {
    source = {...source};
    Object.keys(target).forEach(key => {
        // Check for @font-face attribute
        if (key === "@font-face") {
            if (typeof source["@font-face"] !== "undefined") {
                source[key] = [source[key]].flat(1).concat(target[key]).flat(1);
                return;
            }
        }
        // Check for object property --> deep merge
        else if (typeof source[key] === "object" && typeof target[key] === "object") {
            source[key] = merge(source[key], target[key]);
            return;
        }
        // Other value --> override source property
        source[key] = target[key];
    });
    return source;
};

// Wrap CSS Rule
const wrapRule = (ruleName, ruleContent, separator) => {
    return `${ruleName} {${separator || ""}${ruleContent}${separator || ""}}`;
};

// Parse CSS property
const parseProp = (prop, config) => {
    // return (aliases[prop] || [prop]).map(item => {
    return [prop].map(item => {
        return item.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    })
};

// Parse CSS value
const parseValue = (prop, value, config) => {
    // const values = [value].flat(1);
    // if (values[0] === "value" && typeof vars["value"] !== "undefined") {
    //     values[0] = vars["value"]; // Replace value for vars
    // }
    // if (scales[property] && typeof values[0] === "string") {
    //     const key = scales[property];
    //     if (config[key]?.[values[0]]) {
    //         // only colors and fonts are allowed to generate css variables
    //         if (config.useCssVariables && cssVariablesNames[key]) {
    //             values[0] = `var(${getCssVariable(key, values[0])})`;
    //         }
    //         else {
    //             values[0] = config[key][values[0]];
    //         }
    //     }
    // }
    // return values.join(" ");
    return value;
};

// Main transform
export const transform = (selector, styles, config) => {
    // Check for mixins to apply to this styles
    // if (styles.apply) {
    //     return buildRule(parent, buildMixin(styles, config), config, vars);
    // }
    const result = [""];
    Object.keys(styles).forEach(key => {
        const value = styles[key];

        // skip content in the 'variants' key of the styles object
        // as is reserved only to register variants
        if (key === "variants" || value === null) {
            return;
        }

        if (typeof value === "object" && Array.isArray(value) === false) {
            // Media rules styles should be wrapped into a new rule
            if (/^@/.test(key)) {
                return result.push(
                    wrapRule(key, transform(selector, value, config), "\n"),
                );
            }

            // Add nested styles
            // We should replace the & with the current selector
            return result.push(
                transform(key.replaceAll("&", selector), value, config),
            );
        }

        // Other value --> append to the current css
        parseProp(key, config).forEach(prop => {
            result[0] = result[0] + `${prop}:${parseValue(key, value, config)};`;
        });
    });

    // result[0] contains the styles for the main selector, and should be wrapped into {}
    result[0] = wrapRule(selector, result[0], "");

    // Return joined CSS rules
    return result.flat(2).join("\n");
};

const createCssFunction = (styles, config) => {
    const cache = new Map();
    return variant => {
        if (cache.has(variant || "default")) {
            return cache.get(variant || "default");
        }

        const variantStyles = {
            ...(styles?.variants?.[variant || "default"] || {}),
        };
        const css = transform(".__uni__", merge(styles, variantStyles), config); 
        const hash = hashCode(css);

        // Save to cache and return the classname
        config.target.innerHTML = config.target.innerHTML + css.replaceAll("__uni__", hash);
        cache.set(variant || "default", hash);

        return hash;
    };
};

const createTarget = key => {
    // Check if we are in a DOM env
    if (typeof document !== "undefined") {
        let target = document.querySelector(`[data-source="uni/${key}"`);
        if (!target) {
            target = document.createElement("style");
            target.dataset.source = `uni/${key}`;
            target.innerHTML = "";
            document.head.appendChild(target);
        }
        return target;
    }

    // Default: return a fake <style> tag
    return {
        innerHTML: "",
    };
};

// Create a new instance of UniCSS
export const create = config => {
    config = config || {};
    config.target = config.target || createTarget("css");

    return {
        css: styles => createCssFunction(styles, config),
        extractCss: () => config.target?.innerHTML || "",
    };
};

// Tiny utility for conditionally joining classNames
const parseClassNames = items => {
    if (typeof items === "string") {
        return items.split(" ").filter(item => item.length);
    }
    else if (Array.isArray(items)) {
        return items.filter(item => typeof item === "string" && item.length); 
    }
    else if (typeof items === "object") {
        return Object.keys(items || {}).filter(key => !!items[key]);
    }
    //Over value --> return an empty array
    return [];
};

export const classNames = (...args) => {
    return (args || []).map(arg => parseClassNames(arg)).flat().join(" ");
};
