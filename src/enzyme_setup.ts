import Enzyme from "enzyme";
// this is unofficial library, need to wait for official from enzyme developers
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import jasmineEnzyme from "jasmine-enzyme";

// Configure Enzyme for the appropriate React adapter
Enzyme.configure({ adapter: new Adapter() });

// Initialize global helpers
beforeEach(() => {
    jasmineEnzyme();
});

// Re-export all enzyme exports
export * from "enzyme";
