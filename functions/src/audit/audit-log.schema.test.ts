import { describe, expect, it } from "vitest";

import { parseWriteAuditLogInput } from "./audit-log.schema";

describe("audit/audit-log.schema", () => {
  it("normaliza campos opcionais", () => {
    const parsed = parseWriteAuditLogInput({
      userId: " user-1 ",
      userRole: "super_admin",
      action: " salon.create ",
      targetType: " salon ",
      targetId: " salon-1 ",
      metadata: { foo: "bar" },
      requestMetadata: {
        ipAddress: " 127.0.0.1 ",
        userAgent: " NailFlow Tests ",
        requestId: " req-1 ",
      },
    });

    expect(parsed.userId).toBe("user-1");
    expect(parsed.userRole).toBe("super_admin");
    expect(parsed.action).toBe("salon.create");
    expect(parsed.targetType).toBe("salon");
    expect(parsed.targetId).toBe("salon-1");
    expect(parsed.metadata).toEqual({ foo: "bar" });
    expect(parsed.requestMetadata).toEqual({
      ipAddress: "127.0.0.1",
      userAgent: "NailFlow Tests",
      requestId: "req-1",
    });
  });

  it("falha quando campos obrigatorios estao ausentes", () => {
    expect(() =>
      parseWriteAuditLogInput({
        userId: "",
        userRole: "super_admin",
        action: "salon.create",
        targetType: "salon",
        targetId: "salon-1",
        requestMetadata: {
          ipAddress: null,
          userAgent: null,
          requestId: null,
        },
      })
    ).toThrowError(/userId/);
  });
});