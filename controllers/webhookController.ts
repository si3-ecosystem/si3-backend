import { Request, Response, NextFunction } from "express";
import { UnlockService } from "../services/unlockService";
import { EtherMailService } from "../services/etherMailService";
import { EmailService } from "../services/emailService";

class UnlockWebhookController {
  private unlockService: UnlockService;
  private etherMailService: EtherMailService;
  private emailService: EmailService;

  constructor() {
    this.unlockService = new UnlockService();
    this.etherMailService = new EtherMailService();
    this.emailService = new EmailService();
  }

  // WebSub intent verification
  verifyIntent = (req: Request, res: Response): void => {
    console.log("🔍 Intent verification request:", req.query);

    const challenge = req.query["hub.challenge"] as string;
    const secret = req.query["hub.secret"] as string;
    const mode = req.query["hub.mode"] as string;

    // Verify the secret matches
    if (secret !== process.env.UNLOCK_SECRET) {
      console.error("❌ Invalid secret in verification request");
      res.status(400).send("Invalid secret");
      return;
    }

    if (mode === "subscribe") {
      console.log("✅ Webhook subscription verified successfully");
      res.status(200).send(challenge);
      return;
    }

    if (mode === "unsubscribe") {
      console.log("✅ Webhook unsubscription verified successfully");
      res.status(200).send(challenge);
      return;
    }

    res.status(400).send("Invalid mode");
  };

  // Handle purchase events
  handlePurchase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log("🎫 Purchase event received:", JSON.stringify(req.body, null, 2));

      const eventData = req.body;
      const lockAddress = eventData?.lock;

      // Verify this is for our lock
      if (lockAddress && lockAddress.toLowerCase() !== process.env.LOCK_ADDRESS?.toLowerCase()) {
        console.log("⚠️ Event is not for our lock, ignoring");
        res.status(200).send("OK");
        return;
      }

      let processedBuyers = [];

      // Process each key in the event data
      if (eventData.data && eventData.data.length > 0) {
        for (const key of eventData.data) {
          const tokenId = key.tokenId;
          const transactionHash = key.transactionsHash[0];

          if (tokenId) {
            console.log(`📊 Fetching metadata for token ID: ${tokenId}`);

            // Get buyer metadata
            const buyerData = await this.unlockService.getBuyerMetadata(tokenId);

            if (buyerData.email || buyerData.first_name) {
              processedBuyers.push(buyerData);

              console.log(`👤 Buyer Name: ${buyerData.first_name || "Not provided"}`);
              console.log(`📧 Buyer Email: ${buyerData.email || "Not provided"}`);

              // Send notification email only if we have valid data (not null values)
              if (buyerData.email !== null || buyerData.first_name !== null) {
                await this.emailService.sendPurchaseNotification(buyerData, transactionHash);
              }

              // Add to EtherMail list if email exists
              if (buyerData.email) {
                await this.etherMailService.addToList(
                  buyerData.email,
                  buyerData.first_name,
                  buyerData.last_name
                );
              }
            } else {
              console.log(`⚠️ No buyer data found for token ID: ${tokenId}`);
            }
          }
        }
      }

      console.log(`🎉 Successfully processed ${processedBuyers.length} buyer(s)`);
      res.status(200).send("Event processed successfully");
    } catch (error) {
      next(error);
    }
  };

  // Subscribe to webhooks
  subscribe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.unlockService.subscribeToPurchases();
      res.json({ success: true, message: "Subscription attempt completed" });
    } catch (error) {
      next(error);
    }
  };

  // Unsubscribe from webhooks
  unsubscribe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.unlockService.unsubscribeFromPurchases();
      res.json({ success: true, message: "Unsubscribed successfully" });
    } catch (error) {
      next(error);
    }
  };

  // Test authentication
  testAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = await this.unlockService.getValidAuthToken();
      const result = { 
        success: true, 
        message: "Authentication successful", 
        hasToken: !!token 
      };

      // If token ID provided, test fetching metadata
      if (req.params.tokenId) {
        const buyerData = await this.unlockService.getBuyerMetadata(req.params.tokenId);
        (result as any).testMetadata = buyerData;
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  // Get webhook info for debugging
getInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const unlockService = new UnlockService();
    const token = await unlockService.getValidAuthToken();
    
    res.json({
      webhook: {
        configured: !!(process.env.LOCK_ADDRESS && process.env.WEBHOOK_URL),
        authenticated: !!token,
        akashInfo: {
          nodeEnv: process.env.NODE_ENV,
          port: process.env.PORT,
          webhookUrl: process.env.WEBHOOK_URL,
          networkId: process.env.NETWORK_ID,
          lockAddress: process.env.LOCK_ADDRESS?.substring(0, 10) + '...',
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Unknown error" });
  }
};

// Force reinitialize webhook subscription
reinitialize = async (req: Request, res: Response): Promise<void> => {
  try {
    const unlockService = new UnlockService();
    
    // First authenticate
    await unlockService.authenticateWithUnlock();
    
    // Then subscribe
    await unlockService.subscribeToPurchases();
    
    res.json({ 
      success: true, 
      message: "Webhook reinitialized successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

  // Test EtherMail integration
  testEtherMail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, first_name } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: "Email is required in request body"
        });
        return;
      }

      console.log(`🧪 Testing EtherMail integration for: ${email} (${first_name || 'No name'})`);

      const result = await this.etherMailService.addToList(email, first_name);

      res.json({
        success: result,
        message: result
          ? `Successfully added ${email} to EtherMail list`
          : `Failed to add ${email} to EtherMail list`,
        email,
        first_name: first_name || null
      });
    } catch (error) {
      next(error);
    }
  };
}

export const unlockWebhookController = new UnlockWebhookController();