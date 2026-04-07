const paymentSuccessTemplate = (transaction) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .header { background: #4CAF50; color: white; padding: 20px; }
        .content { padding: 20px; }
        .success-icon { font-size: 48px; text-align: center; }
        .details { background: #f5f5f5; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Payment Successful!</h1>
      </div>
      <div class="content">
        <div class="success-icon">✅</div>
        <h2>Thank you for your payment</h2>
        <p>Your transaction has been completed successfully.</p>
        
        <div class="details">
          <h3>Transaction Details</h3>
          <p><strong>Transaction ID:</strong> ${transaction.transactionId || 'N/A'}</p>
          <p><strong>Amount:</strong> ₹${transaction.amount || 0}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>If you have any questions, please contact our support team.</p>
      </div>
    </body>
    </html>
  `;
};

export default paymentSuccessTemplate;
