import emailService from "../config/protonMail";

interface BuyerData {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  telegramHandle?: string | null;
  tokenId?: string;
  owner?: string;
  lockAddress?: string;
  network?: string;
  eventDetails?: {
    eventName: string;
    eventStartDate?: string;
    eventStartTime?: string;
    eventEndDate?: string;
    eventEndTime?: string;
    eventTimezone?: string;
    eventAddress?: string;
    isInPerson?: boolean;
  } | null;
  metadata?: any;
}


export class EmailService {
  async sendPurchaseNotification(buyerData: BuyerData, transactionHash: string): Promise<boolean> {
    try {
      const { email, first_name, last_name, eventDetails, owner, tokenId, lockAddress, network } = buyerData;
      const fullName = [first_name, last_name].filter(Boolean).join(' ') || "Not provided";

      // Create event details HTML if available
      let eventDetailsHtml = '';
      if (eventDetails) {
        const eventStart = eventDetails.eventStartDate && eventDetails.eventStartTime
          ? `${eventDetails.eventStartDate} at ${eventDetails.eventStartTime} (${eventDetails.eventTimezone || 'UTC'})`
          : 'TBD';
        
        const eventEnd = eventDetails.eventEndDate && eventDetails.eventEndTime
          ? `${eventDetails.eventEndDate} at ${eventDetails.eventEndTime} (${eventDetails.eventTimezone || 'UTC'})`
          : 'TBD';
        
        const location = eventDetails.isInPerson
          ? (eventDetails.eventAddress || 'Location TBD')
          : eventDetails.eventAddress
          ? `<a href="${eventDetails.eventAddress}" target="_blank" style="color: #0066cc;">Join Virtual Event</a>`
          : 'Virtual Event - Link TBD';

        eventDetailsHtml = `
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">🎪 Event Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Event:</td><td style="padding: 8px 0;">${eventDetails.eventName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Start:</td><td style="padding: 8px 0;">${eventStart}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">End:</td><td style="padding: 8px 0;">${eventEnd}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Location:</td><td style="padding: 8px 0;">${location}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Type:</td><td style="padding: 8px 0;">${eventDetails.isInPerson ? 'In-Person' : 'Virtual'}</td></tr>
            </table>
          </div>
        `;
      }

      // Determine the correct explorer URL based on network
      const getExplorerUrl = (networkId: string, hash: string): string => {
        switch (networkId) {
          case '1': // Ethereum Mainnet
            return `https://etherscan.io/tx/${hash}`;
          case '137': // Polygon
            return `https://polygonscan.com/tx/${hash}`;
          case '11155111': // Sepolia
            return `https://sepolia.etherscan.io/tx/${hash}`;
          case '80001': // Mumbai
            return `https://mumbai.polygonscan.com/tx/${hash}`;
          default:
            return `https://etherscan.io/tx/${hash}`;
        }
      };

      const explorerUrl = getExplorerUrl(network || process.env.NETWORK_ID || '1', transactionHash);

      const mailOptions = {
        from: {
          name: process.env.SMTP_FROM_NAME || 'SI3 Notifications',
          address: process.env.SMTP_USER || ''
        },
        to: process.env.NOTIFICATION_EMAIL,
        subject: "🎉 New NFT Ticket Purchase!",
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Ticket Purchase</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🎫 New Ticket Purchase!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Someone just bought a ticket</p>
            </div>

            <div style="background-color: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">👤 Buyer Information</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; font-weight: bold;">Name:</td><td style="padding: 8px 0;">${fullName}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td style="padding: 8px 0;">${email || "Not provided"}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold;">Wallet:</td><td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${owner || "Unknown"}</td></tr>
                  ${buyerData.telegramHandle ? `<tr><td style="padding: 8px 0; font-weight: bold;">Telegram:</td><td style="padding: 8px 0;">@${buyerData.telegramHandle}</td></tr>` : ''}
                </table>
              </div>

              ${eventDetailsHtml}

              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">🔗 Transaction Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Transaction:</td>
                    <td style="padding: 8px 0;">
                      <a href="${explorerUrl}" target="_blank" style="color: #0066cc; text-decoration: none; font-family: monospace; font-size: 12px;">
                        ${transactionHash.substring(0, 20)}...${transactionHash.substring(transactionHash.length - 10)}
                      </a>
                    </td>
                  </tr>
                  <tr><td style="padding: 8px 0; font-weight: bold;">Token ID:</td><td style="padding: 8px 0;">${tokenId || "Unknown"}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold;">Network:</td><td style="padding: 8px 0;">${this.getNetworkName(network || process.env.NETWORK_ID || '1')}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold;">Lock Address:</td><td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${lockAddress || process.env.LOCK_ADDRESS || "Unknown"}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold;">Purchase Time:</td><td style="padding: 8px 0;">${new Date().toLocaleString()}</td></tr>
                </table>
              </div>

              <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
                <p style="margin: 0; color: #1976d2; font-size: 14px;">
                  📧 ${email ? 'The buyer has been automatically added to your EtherMail list.' : 'No email provided - buyer was not added to EtherMail list.'}
                </p>
              </div>

            </div>

            <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px;">
              <p>This notification was sent automatically by your SI3 webhook system.</p>
              <p>Generated at ${new Date().toISOString()}</p>
            </div>

          </body>
          </html>
        `,
        // Also include a plain text version for better deliverability
        text: `
🎫 NEW TICKET PURCHASE NOTIFICATION

👤 BUYER INFORMATION
Name: ${fullName}
Email: ${email || "Not provided"}
Wallet: ${owner || "Unknown"}
${buyerData.telegramHandle ? `Telegram: @${buyerData.telegramHandle}` : ''}

${eventDetails ? `
🎪 EVENT DETAILS
Event: ${eventDetails.eventName}
Start: ${eventDetails.eventStartDate} at ${eventDetails.eventStartTime} (${eventDetails.eventTimezone || 'UTC'})
End: ${eventDetails.eventEndDate} at ${eventDetails.eventEndTime} (${eventDetails.eventTimezone || 'UTC'})
Type: ${eventDetails.isInPerson ? 'In-Person' : 'Virtual'}
Location: ${eventDetails.isInPerson ? (eventDetails.eventAddress || 'TBD') : 'Virtual Event'}
` : ''}

🔗 TRANSACTION DETAILS
Transaction Hash: ${transactionHash}
Explorer: ${explorerUrl}
Token ID: ${tokenId || "Unknown"}
Network: ${this.getNetworkName(network || process.env.NETWORK_ID || '1')}
Lock Address: ${lockAddress || process.env.LOCK_ADDRESS || "Unknown"}
Purchase Time: ${new Date().toLocaleString()}

${email ? '✅ Buyer added to EtherMail list' : '⚠️ No email provided - not added to EtherMail'}

---
Generated automatically by SI3 webhook system
${new Date().toISOString()}
        `.trim()
      };

      const info = await emailService.sendEmail({
        senderName: process.env.SMTP_FROM_NAME || 'SI3 Notifications',
        senderEmail: process.env.SMTP_USER || '',
        toName: fullName,
        toEmail: process.env.NOTIFICATION_EMAIL || '',
        subject: "🎉 New NFT Ticket Purchase!",
        htmlContent: mailOptions.html,
        emailType: "basic"
      });
      console.log("✅ Purchase notification email sent successfully:", info.messageId);
      return true;

    } catch (error) {
      console.error("❌ Error sending purchase notification email:", error);
      return false;
    }
  }

  // Helper method to send custom emails
  async sendCustomEmail(
    to: string,
    subject: string,
    htmlContent: string,
    textContent?: string
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: {
          name: process.env.SMTP_FROM_NAME || 'SI3 Notifications',
          address: process.env.SMTP_USER || ''
        },
        to,
        subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML if no text version provided
      };

      const info = await emailService.sendEmail({
        senderName: process.env.SMTP_FROM_NAME || 'SI3 Notifications',
        senderEmail: process.env.SMTP_USER || '',
        toName: to,
        toEmail: to,
        subject,
        htmlContent: mailOptions.html,
        emailType: "basic"
      });
      console.log("✅ Custom email sent successfully:", info.messageId);
      return true;

    } catch (error) {
      console.error("❌ Error sending custom email:", error);
      return false;
    }
  }

  // Test email functionality
  async sendTestEmail(toEmail?: string): Promise<boolean> {
    const testEmail = toEmail || process.env.NOTIFICATION_EMAIL;
    
    if (!testEmail) {
      console.error("❌ No test email address provided");
      return false;
    }

    return this.sendCustomEmail(
      testEmail,
      "🧪 SI3 Email Service Test",
      `
        <h2>Email Service Test</h2>
        <p>This is a test email from your SI3 backend email service.</p>
        <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        <p>If you received this email, your SMTP configuration is working correctly! 🎉</p>
      `,
      `SI3 Email Service Test\n\nThis is a test email from your SI3 backend email service.\nSent at: ${new Date().toISOString()}\nEnvironment: ${process.env.NODE_ENV || 'development'}\n\nIf you received this email, your SMTP configuration is working correctly!`
    );
  }

  // Helper method to get network name
  private getNetworkName(networkId: string): string {
    const networks: { [key: string]: string } = {
      '1': 'Ethereum Mainnet',
      '137': 'Polygon',
      '11155111': 'Sepolia Testnet',
      '80001': 'Mumbai Testnet',
      '5': 'Goerli Testnet',
      '42': 'Kovan Testnet'
    };
    return networks[networkId] || `Network ${networkId}`;
  }
}