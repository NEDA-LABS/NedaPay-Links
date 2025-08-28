// function to create notification
export const createNotification = async (
    transactionId: string,
    merchantId: string,
    amount: string,
    currency: string,
    description: string | undefined
  ) => {
    try {
      const message = description
        ? `Payment received: ${amount} usd for ${description}`
        : `Payment received: ${amount} usd`;

      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          recipient: merchantId,
          type: "payment_received",
          status: "unseen",
        //   relatedTransactionId: transactionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  };