import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { isPrismaUniqueViolation } from "./prismaUnique.js";

describe("isPrismaUniqueViolation", () => {
  it("is true for P2002", () => {
    const err = new Prisma.PrismaClientKnownRequestError("Unique", {
      code: "P2002",
      clientVersion: "test",
    });
    expect(isPrismaUniqueViolation(err)).toBe(true);
  });

  it("is false for other errors", () => {
    expect(isPrismaUniqueViolation(new Error("x"))).toBe(false);
    expect(
      isPrismaUniqueViolation(
        new Prisma.PrismaClientKnownRequestError("Other", {
          code: "P2025",
          clientVersion: "test",
        })
      )
    ).toBe(false);
  });
});
