import {transform} from "../packages/unicss/index.js";

describe("transform", () => {
    const theme = {
        media: {
            mobile: "(min-width: 900px)",
        },
        colors: {
            primary: "__primary",
            secondary: "__secondary",
        },
        mapping: {
            backgroundColor: "colors",
            color: "colors"
        },
        aliases: {
            size: ["height", "width"],
        },
    };
    const generateRules = css => transform(css, theme);

    it("should apply custom aliases", () => {
        const rules = generateRules({
            ".test": {
                size: "1px",
            },
        });

        expect(rules[0]).toEqual(".test {height:1px;width:1px;}");
    });

    it("should apply theme tokens", () => {
        const rules = generateRules({
            ".test": {
                backgroundColor: "$secondary",
                color: "$primary",
            },
        });

        expect(rules[0]).toEqual(
            ".test {background-color:__secondary;color:__primary;}",
        );
    });

    it("should apply theme tokens from path", () => {
        const rules = generateRules({
            test: {
                border: "2px solid $colors.primary",
            },
        });

        expect(rules[0]).toEqual(
            "test {border:2px solid __primary;}",
        );
    });

    it("should apply local tokens", () => {
        const rules = generateRules({
            test: {
                "$bg": "__bg",
                backgroundColor: "$bg!important",
            },
        });

        expect(rules[0]).toEqual(
            "test {background-color:__bg!important;}",
        );
    });

    it("should apply custom media queries", () => {
        const rules = generateRules({
            test: {
                color: "white",
                "@mobile": {
                    color: "black"
                },
            },
        });

        expect(rules[0]).toEqual("test {color:white;}");
        expect(rules[1]).toEqual("@media (min-width: 900px) {test {color:black;}}");
    });

    it("should apply custom media queries to individual properties", () => {
        const rules = generateRules({
            test: {
                color: "white",
                "@mobile:color": "black",
            },
        });

        expect(rules[0]).toEqual("test {color:white;}");
        expect(rules[1]).toEqual("@media (min-width: 900px) {test {color:black;}}");
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
