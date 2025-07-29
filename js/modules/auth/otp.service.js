/**
 * OTP service for handling OTP generation and verification
 */
class OtpService {
  constructor() {
    this.otpMap = new Map();
    this.otpExpiry = 5 * 60 * 1000; // 5 minutes
  }

  generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  storeOtp(identifier, otp) {
    this.otpMap.set(identifier, {
      otp,
      expiry: Date.now() + this.otpExpiry
    });

    // Cleanup expired OTPs
    this.cleanupOtps();
  }

  verifyOtp(identifier, otp) {
    const otpData = this.otpMap.get(identifier);
    if (!otpData) return false;

    // Remove OTP after verification (one-time use)
    this.otpMap.delete(identifier);

    return otpData.otp === otp && Date.now() <= otpData.expiry;
  }

  cleanupOtps() {
    const now = Date.now();
    for (const [identifier, otpData] of this.otpMap.entries()) {
      if (now > otpData.expiry) {
        this.otpMap.delete(identifier);
      }
    }
  }
}

// Singleton instance
const otpService = new OtpService();

export default otpService;