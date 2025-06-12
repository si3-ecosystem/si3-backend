import mongoose from "mongoose";

const walletNonceSchema = new mongoose.Schema({
  wallet_address: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },

  nonce: {
    type: String,
    required: true,
  },

  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000),
  },
});

// Auto-delete expired nonces
walletNonceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("WalletNonce", walletNonceSchema);
