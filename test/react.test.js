import renderer, { create } from "react-test-renderer";
import {createCache} from "@unicss/core";
import {
    CacheProvider,
    useCache,
    ThemeProvider,
    useTheme,
    styled,
    Box,
} from "@unicss/react";
 
const selector = `style[data-source="uni/react"]`;

describe("[react] ThemeProvider", () => {
    it("should render", () => {
        const component = renderer.create((
            <ThemeProvider theme={{}}>
                <div>Hello world</div>
            </ThemeProvider>
        ));

        expect(component.toJSON()).toMatchSnapshot();
    });
});

describe("[react] Box", () => {
    it("should render", () => {
        const component = renderer.create((
            <ThemeProvider theme={{}}>
                <Box css={{color: "white"}}>Hello world</Box>
            </ThemeProvider>
        ));

        expect(component.toJSON()).toMatchSnapshot();
    });
});

describe("[react] useTheme", () => {
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
            <ThemeProvider theme={defaultTheme}>
                <TestComponent />
            </ThemeProvider>
        ));

        expect(theme).not.toBeNull();
        expect(theme?.colors?.primary).toBe(defaultTheme.colors.primary);
    });
});

describe("[react] styled", () => {
    it("should return a valid React component", () => {
        const StyledComponent = styled("div", {
            color: "white",
        });
        const component = renderer.create((
            <ThemeProvider theme={{}}>
                <StyledComponent>Hello world</StyledComponent>
            </ThemeProvider>
        ));

        expect(component.toJSON()).toMatchSnapshot();
    });

    it("should apply theme", () => {
        const theme = {
            scales: {
                colors: {
                    primary: "black",
                    secondary: "blue",
                },
            },
        };
        const StyledComponent = styled("div", {
            backgroundColor: "secondary",
            color: "primary",
        });
        const component = renderer.create((
            <ThemeProvider theme={theme}>
                <StyledComponent>Hello</StyledComponent>
            </ThemeProvider>
        ));
        const div = component.root.findByType("div");

        expect(div).toBeDefined();
        expect(div.props.className).toEqual(expect.stringContaining("uni-"));
        expect(document.querySelector(selector).innerHTML).toEqual(expect.stringContaining("color:black"));
    });
});

describe("[react] CacheProvider", () => {
    it("should render", () => {
        const component = renderer.create((
            <CacheProvider>
                <div>Hello world</div>
            </CacheProvider>
        ));

        expect(component.toJSON()).toMatchSnapshot();
    });

    it("should provide cache to ThemeProvider", () => {
        const cache = createCache({key: "react-test"});
        renderer.create((
            <CacheProvider cache={cache}>
                <ThemeProvider theme={{}}>
                    <Box css={{backgroundColor: "mint"}} />
                </ThemeProvider>
            </CacheProvider>
        ));

        expect(document.querySelector("style[data-source='uni/react-test']")).toBeDefined();
        // expect(cache.target.innerHTML).not.toBe("");
        expect(cache.target.innerHTML).toEqual(expect.stringContaining(".uni-"));
    });
});

describe("[react] useCache", () => {
    it("should return provided cache", () => {
        const cache = createCache();
        let providedCache = null;
        const InternalComponent = () => {
            providedCache = useCache();
            return null;
        };
        const component = renderer.create((
            <CacheProvider cache={cache}>
                <InternalComponent />
            </CacheProvider>
        ));

        expect(providedCache).toEqual(cache);
    });
});