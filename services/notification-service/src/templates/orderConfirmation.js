const orderConfirmationTemplate = (order) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .header { background: #ff6b35; color: white; padding: 20px; }
        .order-details { padding: 20px; }
        .item { border-bottom: 1px solid #eee; padding: 10px 0; }
        .total { font-size: 18px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✅ Order Confirmed!</h1>
        <p>Order #${order.orderNumber}</p>
      </div>
      <div class="order-details">
        <h2>Thank you for your order!</h2>
        <p>Your order has been confirmed and will be processed shortly.</p>
        
        <h3>Order Summary</h3>
        ${order.items.map(item => `
          <div class="item">
            <strong>${item.name}</strong> × ${item.quantity}
            <span style="float:right">₹${(item.price * item.quantity).toLocaleString()}</span>
          </div>
        `).join('')}
        
        <div style="text-align:right; margin-top:20px;">
          <div>Total: ₹${order.totalAmount.toLocaleString()}</div>
        </div>
        
        <p style="margin-top:30px;">
          <strong>Delivery Address:</strong><br>
          ${order.shippingAddress.street}, ${order.shippingAddress.city}
        </p>
      </div>
    </body>
    </html>
  `;
};

export default orderConfirmationTemplate;
