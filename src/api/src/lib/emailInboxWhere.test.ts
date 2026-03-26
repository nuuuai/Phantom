import { describe, expect, it } from "vitest";
import { buildAliasInboxWhere } from "./emailInboxWhere.js";

describe("buildAliasInboxWhere", () => {
  it("scopes to user only when q empty", () => {
    expect(buildAliasInboxWhere("u1", "", false)).toEqual({ userId: "u1" });
    expect(buildAliasInboxWhere("u1", "   ", false)).toEqual({ userId: "u1" });
  });

  it("filters unread when unreadOnly", () => {
    expect(buildAliasInboxWhere("u1", "", true)).toEqual({
      userId: "u1",
      isRead: false,
    });
  });

  it("adds OR contains filters when q non-empty", () => {
    expect(buildAliasInboxWhere("u1", " acme ", false)).toEqual({
      AND: [
        { userId: "u1" },
        {
          OR: [
            { subject: { contains: "acme", mode: "insensitive" } },
            { fromAddress: { contains: "acme", mode: "insensitive" } },
            { snippet: { contains: "acme", mode: "insensitive" } },
          ],
        },
      ],
    });
  });

  it("combines unread with search", () => {
    expect(buildAliasInboxWhere("u1", "x", true)).toEqual({
      AND: [
        { userId: "u1", isRead: false },
        {
          OR: [
            { subject: { contains: "x", mode: "insensitive" } },
            { fromAddress: { contains: "x", mode: "insensitive" } },
            { snippet: { contains: "x", mode: "insensitive" } },
          ],
        },
      ],
    });
  });
});
