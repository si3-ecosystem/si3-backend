import { body } from "express-validator";

export const validateSignMessageRequest = [
  body("wallet_address")
    .notEmpty()
    .withMessage("Wallet address is required")
    .isString()
    .withMessage("Wallet address must be a string")
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage("Invalid Ethereum wallet address format")
    .customSanitizer((value) => value.toLowerCase()),
];

export const validateSignatureVerification = [
  body("wallet_address")
    .notEmpty()
    .withMessage("Wallet address is required")
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage("Invalid Ethereum wallet address format")
    .customSanitizer((value) => value.toLowerCase()),

  body("signature")
    .notEmpty()
    .withMessage("Signature is required")
    .isString()
    .withMessage("Signature must be a string")
    .matches(/^0x[a-fA-F0-9]{130}$/)
    .withMessage("Invalid signature format - must be 65 bytes hex string"),
];
