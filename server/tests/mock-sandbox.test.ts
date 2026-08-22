import { describe, it, expect } from "bun:test";
import { MockSandbox } from "../src/sandbox/mock-sandbox";

describe("MockSandbox", () => {
  it("should deterministically execute support agent tools without side effects", async () => {
    const sandbox = new MockSandbox();

    // 1. get_customer
    const customerRes = await sandbox.execute("get_customer", { customerId: "cust_123" }, 1);
    expect(customerRes.result.customerId).toBe("cust_123");
    expect(customerRes.result.status).toBe("active");

    // 2. get_order
    const orderRes = await sandbox.execute("get_order", { orderId: "ord_456" }, 2);
    expect(orderRes.result.orderId).toBe("ord_456");
    expect(orderRes.result.totalAmount).toBe(89.99);

    // 3. issue_refund
    const refundRes = await sandbox.execute("issue_refund", { orderId: "ord_456", amount: 89.99 }, 3);
    expect(refundRes.result.success).toBe(true);
    expect(refundRes.result.amount).toBe(89.99);

    // 4. cancel_subscription
    const cancelRes = await sandbox.execute("cancel_subscription", { subscriptionId: "sub_999" }, 4);
    expect(cancelRes.result.success).toBe(true);
    expect(cancelRes.result.status).toBe("canceled");

    // 5. close_account
    const closeRes = await sandbox.execute("close_account", { customerId: "cust_123" }, 5);
    expect(closeRes.result.success).toBe(true);
    expect(closeRes.result.status).toBe("closed");

    // 6. send_email
    const emailRes = await sandbox.execute("send_email", { to: "user@example.com", subject: "Refund", body: "Done" }, 6);
    expect(emailRes.result.success).toBe(true);
    expect(emailRes.result.status).toBe("dispatched");

    // Verify history tracking
    const history = sandbox.getHistory();
    expect(history.length).toBe(6);
    expect(history.map((h) => h.toolName)).toEqual([
      "get_customer",
      "get_order",
      "issue_refund",
      "cancel_subscription",
      "close_account",
      "send_email",
    ]);
  });
});
