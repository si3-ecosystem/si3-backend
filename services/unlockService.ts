import { ethers } from "ethers";
import crypto from "crypto";

export class UnlockService {
  private authToken: string | null = null;
  private tokenExpiry: Date | null = null;

  async authenticateWithUnlock(): Promise<string> {
    if (!process.env.UNLOCK_PRIVATE_KEY) {
      throw new Error("UNLOCK_PRIVATE_KEY environment variable is required");
    }

    try {
      const wallet = new ethers.Wallet(process.env.UNLOCK_PRIVATE_KEY);
      const nonce = crypto.randomBytes(8).toString("hex");
      const issuedAt = new Date().toISOString();

      const siweMessage = [
        `${process.env.WEBHOOK_BASE_URL || 'localhost'} wants you to sign in with your Ethereum account:`,
        wallet.address,
        ``,
        `Sign in to Unlock Protocol`,
        ``,
        `URI: ${process.env.WEBHOOK_BASE_URL || 'http://localhost:8080'}`,
        `Version: 1`,
        `Chain ID: ${process.env.NETWORK_ID || '11155111'}`,
        `Nonce: ${nonce}`,
        `Issued At: ${issuedAt}`,
      ].join("\n");

      const signature = await wallet.signMessage(siweMessage);

      const response = await fetch(
        `https://locksmith.unlock-protocol.com/v2/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: siweMessage,
            signature,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Authentication failed: ${await response.text()}`);
      }

      const data = await response.json() as { accessToken: string };
      
      this.authToken = data.accessToken;
      this.tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
      
      console.log("✅ Successfully authenticated with Unlock Protocol");
      return data.accessToken;
    } catch (error) {
      console.error("❌ Error authenticating with Unlock:", error);
      throw error;
    }
  }

  async getValidAuthToken(): Promise<string> {
    if (!this.authToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      console.log("🔄 Auth token expired or missing, refreshing...");
      return await this.authenticateWithUnlock();
    }
    return this.authToken;
  }

  async getBuyerMetadata(tokenId: string) {
    try {
      const token = await this.getValidAuthToken();
      
      const response = await fetch(
        `https://locksmith.unlock-protocol.com/v2/api/metadata/${process.env.NETWORK_ID}/locks/${process.env.LOCK_ADDRESS}/keys/${tokenId}`,
        {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch metadata: ${response.status} ${errorText}`);
        throw new Error(`Failed to fetch metadata: ${response.status} ${errorText}`);
      }

      const metadata = await response.json() as any;
      console.log("📊 Retrieved buyer metadata:", JSON.stringify(metadata, null, 2));
      
      const email = metadata?.userMetadata?.protected?.email || metadata?.userMetadata?.public?.email;
      const first_name = metadata?.userMetadata?.protected?.['first name'] || metadata?.userMetadata?.public?.['first name'];
      const last_name = metadata?.userMetadata?.protected?.['last name'] || metadata?.userMetadata?.public?.['last name'];
      const telegramHandle = metadata?.userMetadata?.protected?.['telegram username'];
      
      const eventDetails = metadata?.ticket ? {
        eventName: metadata.name || "Event",
        eventStartDate: metadata.ticket.event_start_date,
        eventStartTime: metadata.ticket.event_start_time,
        eventEndDate: metadata.ticket.event_end_date,
        eventEndTime: metadata.ticket.event_end_time,
        eventTimezone: metadata.ticket.event_timezone,
        eventAddress: metadata.ticket.event_address,
        isInPerson: metadata.ticket.event_is_in_person
      } : null;
      
      return {
        email,
        first_name,
        last_name,
        telegramHandle,
        eventDetails,
        tokenId: metadata.tokenId,
        owner: metadata.owner,
        lockAddress: metadata.lockAddress,
        network: metadata.network,
        metadata
      };
    } catch (error) {
      console.error("❌ Error fetching buyer metadata:", error);
      return { 
        email: null, 
        first_name: null, 
        last_name: null,
        telegramHandle: null, 
        eventDetails: null, 
        metadata: null 
      };
    }
  }

  async subscribeToPurchases(): Promise<void> {
    if (!process.env.LOCK_ADDRESS || !process.env.WEBHOOK_URL) {
      throw new Error("LOCK_ADDRESS and WEBHOOK_URL must be configured");
    }

    const endpoint = `https://locksmith.unlock-protocol.com/api/hooks/${process.env.NETWORK_ID}/keys`;
    const formData = new URLSearchParams();

    formData.set(
      "hub.topic",
      `https://locksmith.unlock-protocol.com/api/hooks/${process.env.NETWORK_ID}/keys?locks=${process.env.LOCK_ADDRESS}`
    );
    formData.set("hub.callback", process.env.WEBHOOK_URL);
    formData.set("hub.mode", "subscribe");
    formData.set("hub.secret", process.env.UNLOCK_SECRET || "unlock-is-best");

    const result = await fetch(endpoint, {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!result.ok) {
      throw new Error(`Failed to subscribe: ${await result.text()}`);
    }
    console.log("✅ Subscribed successfully:", await result.text());
  }

  async unsubscribeFromPurchases(): Promise<void> {
    if (!process.env.LOCK_ADDRESS || !process.env.WEBHOOK_URL) {
      throw new Error("Missing configuration");
    }

    const endpoint = `https://locksmith.unlock-protocol.com/api/hooks/${process.env.NETWORK_ID}/keys`;
    const formData = new URLSearchParams();

    formData.set(
      "hub.topic",
      `https://locksmith.unlock-protocol.com/api/hooks/${process.env.NETWORK_ID}/keys?locks=${process.env.LOCK_ADDRESS}`
    );
    formData.set("hub.callback", process.env.WEBHOOK_URL);
    formData.set("hub.mode", "unsubscribe");
    formData.set("hub.secret", process.env.UNLOCK_SECRET || "unlock-is-best");

    const result = await fetch(endpoint, {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!result.ok) {
      throw new Error(`Failed to unsubscribe: ${await result.text()}`);
    }
  }
}