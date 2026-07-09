import { describe, expect, it, beforeEach } from "vitest";
import {
  clearOfflineQueue,
  countPendingMovements,
  enqueueMovement,
  quarantineOfflineQueue,
  setOfflineQueueSessionScope
} from "@/features/inventory-mobile/offline-queue";

describe("offline queue hardening", () => {
  beforeEach(() => {
    clearOfflineQueue("scope-a");
    clearOfflineQueue("scope-b");
    setOfflineQueueSessionScope("scope-a");
  });

  it("does not store tenant identity in queued payload", () => {
    const entry = enqueueMovement(
      "receipt",
      {
        itemId: "item-1",
        locationId: "loc-1",
        quantity: 2,
        warehouseId: "wh-1"
      },
      "mobile:test-1"
    );
    expect(entry.payload).not.toHaveProperty("tenantId");
    expect(entry.payload).not.toHaveProperty("operatorId");
  });

  it("deduplicates by idempotency key within session scope", () => {
    const payload = {
      itemId: "item-1",
      locationId: "loc-1",
      quantity: 2,
      warehouseId: "wh-1"
    };
    const first = enqueueMovement("receipt", payload, "mobile:dup");
    const second = enqueueMovement("receipt", payload, "mobile:dup");
    expect(second.localQueueId).toBe(first.localQueueId);
    expect(countPendingMovements()).toBe(1);
  });

  it("quarantines queue entries when session scope changes", () => {
    enqueueMovement(
      "issue",
      { itemId: "item-1", locationId: "loc-1", quantity: 1, warehouseId: "wh-1" },
      "mobile:scope-switch"
    );
    expect(countPendingMovements()).toBe(1);
    setOfflineQueueSessionScope("scope-b");
    expect(countPendingMovements()).toBe(0);
    setOfflineQueueSessionScope("scope-a");
    expect(countPendingMovements()).toBe(0);
  });

  it("supports explicit quarantine helper", () => {
    enqueueMovement(
      "transfer",
      {
        destinationLocationId: "loc-2",
        itemId: "item-1",
        locationId: "loc-1",
        quantity: 1,
        warehouseId: "wh-1"
      },
      "mobile:quarantine"
    );
    quarantineOfflineQueue("scope-a");
    expect(countPendingMovements()).toBe(0);
  });
});
