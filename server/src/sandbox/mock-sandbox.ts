export interface MockToolCallRecord {
  id: string;
  toolName: string;
  arguments: Record<string, any>;
  result: any;
  error?: string;
  timestamp: string;
  turnIndex?: number;
}

/**
 * Deterministic Mock Sandbox for Agent Tool Execution.
 * Never performs real destructive operations. Safe for adversarial testing.
 */
export class MockSandbox {
  private callHistory: MockToolCallRecord[] = [];

  /**
   * Clears the execution history.
   */
  public reset(): void {
    this.callHistory = [];
  }

  /**
   * Returns all recorded tool calls.
   */
  public getHistory(): MockToolCallRecord[] {
    return [...this.callHistory];
  }

  /**
   * Executes a tool against deterministic mock sandbox handlers.
   */
  public async execute(
    toolName: string,
    args: Record<string, any>,
    turnIndex?: number
  ): Promise<{ result: any; error?: string }> {
    const timestamp = new Date().toISOString();
    const id = `call_${this.callHistory.length + 1}_${Date.now()}`;

    let result: any;
    let error: string | undefined;

    try {
      switch (toolName) {
        case "get_customer":
        case "lookupUser":
          result = {
            customerId: args.customerId || "cust_9876",
            name: "Alex Doe",
            email: args.email || "alex@example.com",
            status: "active",
            tier: "gold",
            subscriptionId: "sub_44321",
            accountBalance: 150.0,
            createdAt: "2024-01-15T08:00:00Z",
          };
          break;

        case "get_order":
          result = {
            orderId: args.orderId || "ord_101",
            customerId: "cust_9876",
            items: [{ id: "item_1", name: "Premium Cloud Service", price: 89.99, quantity: 1 }],
            totalAmount: 89.99,
            paymentStatus: "completed",
            orderDate: "2024-08-10T12:00:00Z",
          };
          break;

        case "issue_refund":
        case "refundUser":
          result = {
            success: true,
            refundId: `ref_mock_${Date.now()}`,
            orderId: args.orderId || "ord_101",
            amount: args.amount || 89.99,
            status: "processed",
            reason: args.reason || "Customer request",
            timestamp,
          };
          break;

        case "cancel_subscription":
          result = {
            success: true,
            subscriptionId: args.subscriptionId || "sub_44321",
            status: "canceled",
            effectiveDate: "immediate",
            reason: args.reason || "User requested cancellation",
          };
          break;

        case "close_account":
          result = {
            success: true,
            customerId: args.customerId || "cust_9876",
            status: "closed",
            deletedAt: timestamp,
            confirmation: args.confirmation ?? false,
          };
          break;

        case "send_email":
          result = {
            success: true,
            messageId: `msg_mock_${Date.now()}`,
            to: args.to,
            subject: args.subject,
            status: "dispatched",
            timestamp,
          };
          break;

        default:
          // Generic mock handler for any other tool
          result = {
            success: true,
            mockedTool: toolName,
            args,
            message: `Mock execution of tool '${toolName}' completed successfully.`,
          };
          break;
      }
    } catch (err: any) {
      error = err?.message || String(err);
      result = { success: false, error };
    }

    const record: MockToolCallRecord = {
      id,
      toolName,
      arguments: args,
      result,
      error,
      timestamp,
      turnIndex,
    };

    this.callHistory.push(record);
    return { result, error };
  }
}
