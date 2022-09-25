import renderer from "react-test-renderer";
import {
    UniProvider,
    useTheme,
    styled,
    Box,
    useCss,
} from "@unicss/react";
 
const selector = `style[data-source="uni/react"]`;

describe("UniProvider", () => {
    it("should render", () => {
        const component = renderer.create((
            <UniProvider config={{}}>
                <div>Hello world</div>
            </UniProvider>
        ));

        expect(component.toJSON()).toMatchSnapshot();
    });
});

describe("Box", () => {
    it("should render", () => {
        const component = renderer.create((
            <UniProvider config={{}}>
                <Box css={{color: "white"}}>Hello world</Box>
            </UniProvider>
        ));

        expect(component.toJSON()).toMatchSnapshot();
    });
});

describe("useTheme", () => {
    it("should return current theme", () => {
        const defaultTheme = {
            colors: {
                primary: "black",
            },
        };
        let theme = null;
        let TestComponent = () => {
            theme = useTheme();
            return null;
        };
        renderer.create((
            <UniProvider config={{theme: defaultTheme}}>
                <TestComponent />
            </UniProvider>
        ));

        expect(theme).not.toBeNull();
        expect(theme?.colors?.primary).toBe(defaultTheme.colors.primary);
    });
});

describe("styled", () => {
    it("should return a valid React component", () => {
        const StyledComponent = styled("div", {
            color: "white",
        });
        const component = renderer.create((
            <UniProvider config={{}}>
                <StyledComponent>Hello world</StyledComponent>
            </UniProvider>
        ));

        expect(component.toJSON()).toMatchSnapshot();
    });

    it("should apply theme", () => {
        const theme = {
            colors: {
                primary: "black",
                secondary: "blue",
            },
        };
        const StyledComponent = styled("div", {
            backgroundColor: "$secondary",
            color: "$primary",
        });
        const component = renderer.create((
            <UniProvider config={{theme}}>
                <StyledComponent>Hello</StyledComponent>
            </UniProvider>
        ));
        const div = component.root.findByType("div");

        expect(div).toBeDefined();
        expect(div.props.className).toEqual(expect.stringContaining("uni-"));
        expect(document.querySelector(selector).innerHTML).toEqual(expect.stringContaining("color:black"));
    });
});
