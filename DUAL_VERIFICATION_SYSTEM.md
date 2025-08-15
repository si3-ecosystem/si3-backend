# Dual Verification System

## ✅ **New Verification Fields**

The user model now has **two separate verification fields**:

### **1. Email Verification (`isVerified`)**
- **Purpose**: Confirms user owns the email address
- **Method**: OTP verification via email
- **Set to `true`**: When user verifies email with OTP

### **2. Wallet Verification (`isWalletVerified`)**
- **Purpose**: Confirms user owns the private key
- **Method**: Cryptographic signature verification
- **Set to `true`**: When user signs message with wallet

## 🎯 **Authentication Flows**

### **Email Authentication**
```bash
POST /api/auth/email/verify-otp
{
  "email": "user@example.com",
  "otp": "123456"
}
```
**Result**: `isVerified = true`, `isWalletVerified = unchanged`

### **Wallet Authentication**
```bash
POST /api/auth/wallet/verify-signature
{
  "wallet_address": "0x...",
  "signature": "0x..."
}
```
**Result**: `isVerified = false`, `isWalletVerified = true`

### **Wallet Connection (to existing account)**
```bash
POST /api/auth/wallet/connect
Authorization: Bearer JWT_TOKEN
{
  "wallet_address": "0x...",
  "signature": "0x..."
}
```
**Result**: `isVerified = unchanged`, `isWalletVerified = true`

## 📊 **User States**

| Email Verified | Wallet Verified | User Type | Capabilities |
|----------------|-----------------|-----------|--------------|
| ✅ `true` | ❌ `false` | Email-only user | Email features only |
| ❌ `false` | ✅ `true` | Wallet-only user | Wallet features only |
| ✅ `true` | ✅ `true` | Fully verified user | All features |
| ❌ `false` | ❌ `false` | Unverified user | Limited access |

## 🛠️ **Database Schema**

### **User Model Fields**
```typescript
interface IUser {
  email: string;
  isVerified: boolean;        // Email verification status
  isWalletVerified: boolean;  // Wallet verification status
  wallet_address?: string;
  // ... other fields
}
```

### **MongoDB Indexes**
```javascript
// Existing
{ isVerified: 1, createdAt: -1 }

// New
{ isWalletVerified: 1, createdAt: -1 }
```

## 🔧 **Implementation Details**

### **Wallet Account Creation**
```typescript
// New wallet users
user = new UserModel({
  email: `${wallet_address}@wallet.temp`,
  wallet_address: wallet_address.toLowerCase(),
  isVerified: false,        // Email not verified (temp email)
  isWalletVerified: true,   // Wallet verified by signature
  roles: [UserRole.SCHOLAR],
  lastLogin: new Date(),
});
```

### **Email Verification**
```typescript
// Email verification sets isVerified = true
user.isVerified = true;
await user.save();
```

### **Wallet Connection**
```typescript
// Connecting wallet to existing account
user.wallet_address = wallet_address.toLowerCase();
user.isWalletVerified = true;  // Mark wallet as verified
await user.save();
```

### **Wallet Disconnection**
```typescript
// Disconnecting wallet
user.wallet_address = undefined;
user.isWalletVerified = false;  // Remove wallet verification
await user.save();
```

## 🎯 **Use Cases**

### **Feature Gating**
```typescript
// Email-only features
if (user.isVerified && !user.isWalletVerified) {
  // Show email-based features
}

// Wallet-only features  
if (user.isWalletVerified && !user.isVerified) {
  // Show wallet-based features
}

// Premium features (require both)
if (user.isVerified && user.isWalletVerified) {
  // Show all features
}
```

### **Security Policies**
```typescript
// Sensitive actions require both verifications
if (user.isVerified && user.isWalletVerified) {
  // Allow sensitive operations
} else {
  // Require additional verification
}
```

### **User Onboarding**
```typescript
// Guide users to complete verification
const verificationStatus = {
  emailVerified: user.isVerified,
  walletVerified: user.isWalletVerified,
  fullyVerified: user.isVerified && user.isWalletVerified
};
```

## 📋 **API Response Format**

### **User Object**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "isVerified": true,
  "isWalletVerified": false,
  "wallet_address": null,
  "verificationStatus": {
    "email": true,
    "wallet": false,
    "complete": false
  }
}
```

## 🎉 **Benefits**

- ✅ **Clear distinction** between verification types
- ✅ **Granular permissions** based on verification status
- ✅ **Better user experience** (users know what they've verified)
- ✅ **Flexible security policies**
- ✅ **Audit trail** for different authentication methods
- ✅ **Future-proof** for additional verification types

## 🔄 **Migration**

Existing users will have:
- `isVerified`: Current verification status (unchanged)
- `isWalletVerified`: `false` (default for new field)

When they connect a wallet, `isWalletVerified` will be set to `true`.

**The dual verification system provides much better granular control over user authentication and feature access!** 🚀
