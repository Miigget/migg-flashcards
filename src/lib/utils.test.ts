import { describe, it, expect } from "vitest";
import { cn } from "./utils"; // Assuming utils.ts is in the same directory

describe("cn utility function", () => {
  it("should merge classes correctly", () => {
    expect(cn("p-4", "m-2")).toBe("p-4 m-2");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const hasError = false;
    expect(cn("base", isActive && "active", hasError && "error")).toBe("base active");
  });

  it("should override conflicting Tailwind classes (tailwind-merge)", () => {
    // twMerge should handle conflicts like p-4 overriding p-2
    expect(cn("p-2", "p-4")).toBe("p-4");
    // twMerge should handle conflicts like pt-2 being overridden by p-4
    expect(cn("pt-2", "p-4")).toBe("p-4");
    // twMerge should handle conflicts across different types (e.g., padding and margin)
    expect(cn("p-4", "pt-2")).toBe("p-4 pt-2"); // Different properties, should merge
    expect(cn("m-2", "mt-4")).toBe("m-2 mt-4");
  });

  it("should handle different types of inputs (strings, objects, arrays)", () => {
    expect(cn("bg-red-500", { "text-white": true }, ["p-4", null, undefined, false, "m-2"])).toBe(
      "bg-red-500 text-white p-4 m-2"
    );
  });

  it("should return an empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("should handle falsy values correctly", () => {
    expect(cn(null, undefined, false, "", "valid-class")).toBe("valid-class");
  });
});
