export class EtherMailService {
  async addToList(email: string, first_name?: string, last_name?: string): Promise<boolean> {
    if (!email || !process.env.ETHERMAIL_API_KEY) {
      console.log("⚠️ No email or EtherMail API key provided, skipping EtherMail addition");
      return false;
    }

    try {
      const contactData: any = { 
        email, 
        lists: [process.env.ETHERMAIL_LIST_ID || "68643cb440274653e00b93fa"] 
      };
      
      if (first_name) contactData.first_name = first_name;
      if (last_name) contactData.last_name = last_name;

      const response = await fetch(
        `https://hub-gateway.ethermail.io/v1/contacts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ETHERMAIL_API_KEY,
            "x-api-secret": process.env.ETHERMAIL_API_SECRET || "",
          },
          body: JSON.stringify(contactData),
        }
      );

      if (response.ok) {
        console.log(`✅ Successfully added ${email} to EtherMail list`);
        return true;
      } else {
        const error = await response.text();
        console.error("❌ Error adding to EtherMail:", error);
        return false;
      }
    } catch (error) {
      console.error("❌ Error calling EtherMail API:", error);
      return false;
    }
  }
}