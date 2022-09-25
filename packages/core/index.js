// Default theme scales mapping
export const defaultThemeMap = {
    backgroundColor: "colors",
    borderColor: "colors",
    borderBottomColor: "colors",
    borderLeftColor: "colors",
    borderRightColor: "colors",
    borderTopColor: "colors",
    borderRadius: "radius",
    borderBottomLeftRadius: "radius",
    borderBottomRightRadius: "radius",
    borderTopLeftRadius: "radius",
    borderTopRightRadius: "radius",
    borderWidth: "sizes",
    borderBottomWidth: "sizes",
    borderLeftWidth: "sizes",
    borderRightWidth: "sizes",
    borderTopWidth: "sizes",
    bottom: "spacing",
    boxShadow: "shadows",
    color: "colors",
    fill: "colors",
    fontFamily: "fonts",
    fontSize: "fontSizes",
    fontWeight: "fontWeights",
    height: "sizes",
    left: "spacing",
    lineHeight: "lineHeights",
    margin: "spacing",
    marginBottom: "spacing",
    marginLeft: "spacing",
    marginRight: "spacing",
    marginTop: "spacing",
    maxHeight: "sizes",
    maxWidth: "sizes",
    minHeight: "sizes",
    minWidth: "sizes",
    opacity: "opacities",
    padding: "spacing",
    paddingBottom: "spacing",
    paddingLeft: "spacing",
    paddingRight: "spacing",
    paddingTop: "spacing",
    right: "spacing",
    textShadow: "shadows",
    top: "spacing",
    width: "sizes",
};

const hashCode = str => {
    return "uni-" + Math.abs(Array.from(str).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0)).toString();
};

// Exclude a field from the specified object
const exclude = (obj, field) => {
    return Object.fromEntries(Object.entries(obj).filter(e => e[0] !== field));
};

// Tiny reducer alias
const toObject = (list, fn) => list.reduce(fn, {});

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
const parseProp = (prop, value, config) => {
    let propsToParse = {
        [prop]: value,
    };

    // Check if custom properties object has been provided
    if (typeof config?.properties?.[prop] === "function") {
        const newProps = config.properties[prop](value);
        if (newProps && typeof newProps === "object") {
            propsToParse = newProps;
        }
    }

    // Parse props
    return Object.keys(propsToParse).map(item => ([
        item.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`),
        propsToParse[item],
    ]));
};

// Parse CSS value
const parseValue = (prop, value, config) => {
    if (typeof value === "string" && value.indexOf("$") > -1 && defaultThemeMap[prop]) {
        const scaleName = defaultThemeMap[prop];
        const scale = config?.theme?.[scaleName];

        if (scale && typeof scale === "object") {
            return value.replace(/\$([^\s]+)/g, (match, key) => {
                return typeof scale[key] !== "undefined" ? scale[key].toString() : match;
            });
        }
    }
    
    return value;
};

// Parse mixins
const parseMixins = (styles, config, prev) => {
    prev = prev || new Set();
    if (config?.mixins && styles?.apply && (typeof styles.apply === "string" || Array.isArray(styles.apply))) {
        const mixinsList = [styles.apply].flat().filter(n => {
            return n && typeof n === "string";
        });

        return {
            ...exclude(styles, "apply"),
            ...toObject(mixinsList, (newStyles, mixinName) => {
                // Check for circular mixins found
                if (prev.has(mixinName)) {
                    // const items = Array.from(prev);
                    // throw new Error(`Circular mixins found: ${items.join("->")}->${mixinName}`);
                    return newStyles;
                }

                // Apply styles from this mixin
                prev.add(mixinName);
                return {
                    ...newStyles,
                    ...parseMixins(get(config?.mixins || {}, mixinName), config, prev),
                };
            }),
        };
    }

    // No mixins to apply --> return styles
    return styles || {};
};

// Main transform
export const transform = (selector, styles, config) => {
    const result = [""];
    Object.entries(parseMixins(styles, config)).forEach(([key, value]) => {
        // skip content in the 'variants' key: reserved only to register variants
        // Skip content in the 'apply' key: reserved only to mixins
        if (key === "variants" || key === "apply" || value === null) {
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

        // Just parse as a simple property
        parseProp(key, value, config).forEach(([prop, value]) => {
            result[0] = result[0] + `${prop}:${parseValue(prop, value, config)};`;
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
        config.target.innerHTML = config.target.innerHTML + css.replaceAll("__uni__", hash) + "\n";
        cache.set(variant || "default", hash);

        return hash;
    };
};

const createKeyframes = (styles, config) => {
    const css = wrapRule(
        "@keyframes __uni__",
        Object.keys(styles).map(k => transform(k, styles[k], config)).join(" "),
    );
    const hash = hashCode(css);

    // Check for saving keyframes definition in target
    // As at this moment we are not saving a cache of css rules, we need to check
    // if the generated hash is defined in the target
    if (config.target?.innerHTML?.indexOf(`@keyframes ${hash}`) < 0) {
        config.target.innerHTML = config.target.innerHTML + css.replaceAll("__uni__", hash) + "\n";
    }

    // Return generated keyframes name
    return hash;
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

    // Other case: we are not in an env supporting DOM (maybe SSR)
    // return a fake <style> tag
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
        keyframes: styles => createKeyframes(styles, config),
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
