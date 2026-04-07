// Mock SMS Service (Twilio-like)
const sendSMS = async (to, message) => {
  try {
    // Simulate Twilio API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      sid: 'SM' + Math.random().toString(36).substr(2, 8),
      provider: 'twilio'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      provider: 'twilio'
    };
  }
};

export { sendSMS };
