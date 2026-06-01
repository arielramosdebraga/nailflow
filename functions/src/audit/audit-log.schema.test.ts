import { describe, expect, it } from "vitest";

import { parseAuditLogInput } from "./audit-log.schema";

describe("audit/audit-log.schema", () => {
  it("normaliza campos opcionais", () => {
    const parsed = parseAuditLogInput({
      userId: " user-1 ",
      actorRole: " super_admin ",
      action: " salon.create ",
      targetType: " salon ",
      targetId: " salon-1 ",
      salonId: " salon-1 ",
      source: "callable",
      ipAddress: " 127.0.0.1 ",
      metadata: { foo: "bar" },
    });

    expect(parsed.userId).toBe("user-1");
    expect(parsed.actorRole).toBe("super_admin");
    expect(parsed.action).toBe("salon.create");
    expect(parsed.targetType).toBe("salon");
    expect(parsed.targetId).toBe("salon-1");
    expect(parsed.salonId).toBe("salon-1");
    expect(parsed.ipAddress).toBe("127.0.0.1");
    expect(parsed.metadata).toEqual({ foo: "bar" });
  });

  it("falha quando campos obrigatorios estao ausentes", () => {
    expect(() =>
      parseAuditLogInput({
        userId: "",
        actorRole: "super_admin",
        action: "salon.create",
        targetType: "salon",
        source: "callable",
      })
    ).toThrowError(/userId obrigatorio/);
  });
});
