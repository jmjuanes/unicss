import {transform} from "../index.js";

describe("transform", () => {
    const context = {
        theme: {
            colors: {
                primary: "__primary",
                secondary: "__secondary",
            },
        },
        aliases: {
            size: ["height", "width"],
        },
    };
    const generateRules = css => transform(css, context);

    it("should apply custom aliases", () => {
        const rules = generateRules({
            ".test": {
                size: "1px",
            },
        });

        expect(rules[0]).toEqual(".test {height:1px;width:1px;}");
    });

    it("should apply theme", () => {
        const rules = generateRules({
            ".test": {
                backgroundColor: t => t.colors.secondary,
                color: t => t.colors.primary,
            },
        });

        expect(rules[0]).toEqual(
            ".test {background-color:__secondary;color:__primary;}",
        );
    });

    it("should apply global @media", () => {
        const rules = generateRules({
            "@media (max-width: 0px)": {
                test: {
                    color: "blue",
                },
            },
        });

        expect(rules[0]).toEqual("@media (max-width: 0px) {test {color:blue;}}");
    });

    it("should apply local @media", () => {
        const rules = generateRules({
            test: {
                "@media (max-width: 0px)": {
                    color: "blue",
                },
            },
        });

        expect(rules[0]).toEqual("@media (max-width: 0px) {test {color:blue;}}");
    });

    it("should apply @keyframes", () => {
        const rules = generateRules({
            "@keyframes test": {
                from: {opacity: 0},
                to: {opacity: 1},
            },
        });

        expect(rules[0]).toEqual("@keyframes test {from {opacity:0;} to {opacity:1;}}");
    });

    it("should apply @font-face", () => {
        const rules = generateRules({
            "@font-face": [
                {src: "source-font1"},
                {src: "source-font2"},
            ],
        });

        expect(rules[0]).toEqual("@font-face {src:source-font1;}");
        expect(rules[1]).toEqual("@font-face {src:source-font2;}");
    });

    it("should apply @import", () => {
        const rules = generateRules({
            "@import": [
                "source1",
                "source2",
            ],
        });
        expect(rules[0]).toEqual("@import source1;");
        expect(rules[1]).toEqual("@import source2;");
    });
});
