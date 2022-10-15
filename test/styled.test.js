import {configure, styled, extractCss} from "../index.js";

const pragma = jest.fn((tag, props) => ({tag, props}));
configure({
    pragma: pragma,
    theme: {
        colors: {
            bg: "styled__bg",
        },
    },
});

describe("styled", () => {
    it("should call the pragma function", () => {
        styled("div", {})({});

        expect(pragma).toBeCalledTimes(1);
    });

    it("should forward props", () => {
        const vnode = styled("div", {})({align: "center"});

        expect(vnode.props.align).toEqual("center");
    });

    it("should allow to overwrite 'as' prop", () => {
        const vnode = styled("div", {})({as: "a"});

        expect(vnode.tag).toEqual("a");
    });

    it("should concat classNames", () => {
        const vnode = styled("div", {})({className: "test"});

        expect(vnode.props.className).toEqual(
            expect.stringContaining("test"),
        );
    });

    it("should support custom themes", () => {
        const vnode = styled("div", {
            backgroundColor: t => t.colors.bg,
        })({});

        expect(vnode.props.className).toEqual(expect.stringContaining("uni-"));
        expect(extractCss()).toEqual(expect.stringContaining("background-color: styled__bg;"));
    });

    it("should support variants", () => {
        const component = styled("div", {
            color: "white",
            variants: {
                default: {
                    fontSize: "16px",
                },
            },
        });
        const vnode = component({variant: "default"});

        expect(extractCss()).toEqual(
            expect.stringContaining("color: white; font-size: 16px;"),
        );
    });
});
