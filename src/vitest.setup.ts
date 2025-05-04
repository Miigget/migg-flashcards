import "@testing-library/jest-dom/vitest";

// Mock ResizeObserver for components like Combobox (cmdk)
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

// Mock scrollIntoView for components like Combobox (cmdk)
Element.prototype.scrollIntoView = vi.fn();

// Mock window.location for navigation attempts
const locationMock = {
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
  href: "",
};
// Use `Object.defineProperty` to allow modification
Object.defineProperty(window, "location", {
  value: locationMock,
  writable: true,
});
