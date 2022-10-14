const isBrowser = typeof window !== "undefined";
const unitlessProperties = {
    animationIterationCount: true,
    flex: true,
    flexGrow: true,
    flexOrder: true,
    flexShrink: true,
    fontWeight: true,
    gridRow: true,
    gridColumn: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    widows: true,
    zIndex: true,
    zoom: true,
};

export const hashify = (str, prefix = "uni-") => {
    return prefix + Math.abs(Array.from(str).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0)).toString();
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

// Tiny utility for conditionally joining classNames
export const classNames = (...args) => {
    return (args || []).map(items => {
        if (typeof items === "string") {
            return items.split(" ").filter(item => item.length);
        }
        else if (Array.isArray(items)) {
            return items.filter(item => typeof item === "string" && item.length); 
        }
        else if (typeof items === "object") {
            return Object.keys(items || {}).filter(key => !!items[key]);
        }
        return [];
    }).flat().join(" ");
};

const wrapRule = (ruleName, ruleContent, separator) => {
    return `${ruleName} {${separator || ""}${ruleContent}${separator || ""}}`;
};

const parseProp = (prop, ctx) => {
    if (ctx?.aliases?.[prop]) {
        return [ctx.aliases[prop]].flat();
    }
    return [prop];
};

const parseValue = (prop, value, ctx) => {
    // Check for function value --> call it with the current theme
    if (typeof value === "function") {
        value = value(ctx.theme || {});
    }
    // Check for number and not unitless property
    // Automatically append 'px' to the value
    if (typeof value === "number" && !unitlessProperties[prop]) {
        return value.toString() + "px";
    }
    return value;
};

const parseAtRule = (key, ctx) => {
    return ctx?.media?.[key.slice(1)] ? `@media ${ctx.media[key.slice(1)]}` : key;
};

// Transform a selector rule
const transformSelector = (selector, styles, ctx) => {
    if (styles && Array.isArray(styles)) {
        return styles.map(s => transformSelector(selector, s, ctx)).flat();
    }
    const result = [""];
    Object.keys(styles)
        .filter(key => {
            // Skip content in the 'variants' key: reserved only to register variants
            // Skip null values
            return key !== "variants" && styles[key] !== null;
        })
        .forEach(key => {
            const value = styles[key];
            // Nested styles or @media rules 
            if (typeof value === "object") {
                // Media rules styles should be wrapped into a new rule
                if (key.startsWith("@")) {
                    return result.push(
                        wrapRule(parseAtRule(key, ctx), transformSelector(selector, value, ctx), ""),
                    );
                }
                // Add nested styles
                // We should replace the & with the current selector
                return result.push(
                    transformSelector(key.replaceAll("&", selector), value, ctx),
                );
            }
            // Just parse as a simple property
            parseProp(key, ctx).forEach(prop => {
                const p = prop.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
                result[0] = result[0] + `${p}:${parseValue(prop, value, ctx)};`;
            });
        });
    // result[0] contains the styles for the current selector, and should be wrapped into {}
    if (result[0].length > 0) {
        result[0] = wrapRule(selector, result[0], "");
    }
    return result.flat(2).filter(rule => !!rule);
};

// Transform a styles object to string
export const transform = (styles, ctx) => {
    const result = Object.entries(styles || {}).map(([key, value]) => {
        if (key.startsWith("@")) {
            // Check for @import rule, just add one @import for each source
            // value must be a string or an array of strings
            if (key === "@import") {
                return [value].flat().map(v => `@import ${v};`);
            }
            // Check for @font-face rule (or alias)
            else if (key === "@font-face" || key === "@fontface" || key === "@fontFace") {
                return transformSelector("@font-face", value, ctx);
            }
            // Other rule (for example @media or @keyframes)
            // else if (key.startsWith("@media") || key.startsWith("@keyframes")) {
            else {
                const rules = Object.keys(value).map(k => {
                    return transformSelector(k, value[k], ctx);
                });
                return wrapRule(parseAtRule(key, ctx), rules.join(" "));
            }
        }
        // Other value --> parse as regular classname
        return transformSelector(key, value, ctx);
    });
    return result.flat(2);
};

const createSheet = () => {
    let target = document.querySelector(`[data-source="unicss"`);
    if (!target) {
        target = document.createElement("style");
        target.dataset.source = "unicss";
        document.head.appendChild(target);
    }
    return target.sheet;
};

const createVirtualSheet = () => {
    const rules = [];
    return {
        type: "text/css",
        cssRules: rules,
        insertRule: css => rules.push({cssText: css}),
        ownerNode: null,
    };
};

// Create UniCSS instance
export const create = options => {
    const context = {
        key: options?.key || "",
        theme: options.theme || {},
        media: options.media || {},
        aliases: options.aliases || {},
        createElement: options.pragma || null,
    };
    const inserted = new Set();
    const sheet = isBrowser ? createSheet() : createVirtualSheet();

    // Hydrate current sheet
    if (isBrowser && sheet.cssRules.length > 0) {
        for (let index = 0; index < sheet.cssRules.length; index++) {
            const {cssText} = sheet.cssRules[index];
            // Hydratable rules will start with a comment prefixes with 'uni-'
            // Skip other rules
            if (cssText && cssText.startsWith("--uni")) {
                const id = cssText.match(/--uni:\s*(uni\-[\w]+);/)?.[1];
                if (id && id.startsWith("uni")) {
                    inserted.add(id);
                }
            }
        }
    }

    const _css = (styles, isGlobal = false, isKeyframes = false) => {
        let rules = null;
        if (isGlobal) {
            rules = transform(styles, context);
        }
        else if (isKeyframes) {
            rules = transform({"@keyframes __uni__": styles}, context);
        }
        else {
            rules = transform({".__uni__": styles}, context);
        }

        const hash = hashify(rules.join("\n"));
        if (!inserted.has(hash)) {
            sheet.insertRule(`--uni {--uni:'${hash}';}`, sheet.cssRules.length);
            rules.forEach(rule => {
                sheet.insertRule(rule.replaceAll("__uni__", hash), sheet.cssRules.length);
            });
            inserted.add(hash);
        }
        return hash;
    };

    const _createStyledElement = (type, initialCss) => {
        return props => {
            const {as, css: customCss, ...rest} = props;
            const className = _css({
                boxSizing: "border-box",
                minWidth: "0",
                ...initialCss,
                ...customCss,
            });

            return context.createElement(as || type || "div", {
                ...rest,
                className: classNames(props?.className, className),
            });
        };
    };
    
    return {
        css: styles => _css(styles, false, false),
        globalCss: styles => _css(styles, true, false),
        keyframes: styles => _css(styles, false, true),
        styled: (type, styles) => _createStyledElement(type, styles),
        extractCss: () => sheet.cssRules.map(rule => rule.cssText).join("\n"),
        configure: opt => {
            context.theme = opt.theme || context.theme || {};
            context.media = opt.media || context.media || {};
            context.aliases = opt.aliases || context.aliases || {};
            context.createElement = opt.pragma || context.createElement;
        },
    };
};

export const {configure, extractCss, styled, css, globalCss, keyframes} = create({});
