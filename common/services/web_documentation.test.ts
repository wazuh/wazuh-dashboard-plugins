import { DOCUMENTATION_WEB_BASE_URL, PLUGIN_VERSION_SHORT } from "../constants";
import { webDocumentationLink } from "./web_documentation";

test(`Generate a web documentation URL using to the plugin short version`, () => {
    expect(webDocumentationLink('user-manual/agent-enrollment/index.html')).toBe(`${DOCUMENTATION_WEB_BASE_URL}/${PLUGIN_VERSION_SHORT}/user-manual/agent-enrollment/index.html`);
});

test(`Generate a web documentation URL to the base URL using to the plugin short version`, () => {
    expect(webDocumentationLink('')).toBe(`${DOCUMENTATION_WEB_BASE_URL}/${PLUGIN_VERSION_SHORT}/`);
});

test(`Generate a web documentation URL using a specific version`, () => {
    expect(webDocumentationLink('user-manual/agent-enrollment/index.html', '4.5')).toBe(`${DOCUMENTATION_WEB_BASE_URL}/4.5/user-manual/agent-enrollment/index.html`);
});
