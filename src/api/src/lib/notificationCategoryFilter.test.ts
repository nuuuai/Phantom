import { describe, expect, it } from "vitest";
import {
  categoryWhereForDisabled,
  NOTIFICATION_CATEGORIES,
  isKnownNotificationCategory,
} from "./notificationCategoryFilter.js";

describe("notificationCategoryFilter", () => {
  it("lists four categories aligned with API + dashboard", () => {
    expect(NOTIFICATION_CATEGORIES).toEqual([
      "alias_health",
      "broker_removal",
      "security_alert",
      "system",
    ]);
  });

  it("categoryWhereForDisabled is empty when nothing disabled", () => {
    expect(categoryWhereForDisabled([])).toEqual({});
  });

  it("categoryWhereForDisabled excludes disabled categories", () => {
    expect(categoryWhereForDisabled(["alias_health"])).toEqual({
      category: { notIn: ["alias_health"] },
    });
  });

  it("isKnownNotificationCategory", () => {
    expect(isKnownNotificationCategory("broker_removal")).toBe(true);
    expect(isKnownNotificationCategory("nope")).toBe(false);
  });
});
