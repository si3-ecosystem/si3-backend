"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EtherMailService = void 0;
class EtherMailService {
    addToList(email, first_name, last_name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!email || !process.env.ETHERMAIL_API_KEY) {
                console.log("⚠️ No email or EtherMail API key provided, skipping EtherMail addition");
                return false;
            }
            try {
                const contactData = {
                    email,
                    lists: [process.env.ETHERMAIL_LIST_ID || "68643cb440274653e00b93fa"]
                };
                if (first_name)
                    contactData.first_name = first_name;
                if (last_name)
                    contactData.last_name = last_name;
                const response = yield fetch(`https://hub-gateway.ethermail.io/v1/contacts`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": process.env.ETHERMAIL_API_KEY,
                        "x-api-secret": process.env.ETHERMAIL_API_SECRET || "",
                    },
                    body: JSON.stringify(contactData),
                });
                if (response.ok) {
                    console.log(`✅ Successfully added ${email} to EtherMail list`);
                    return true;
                }
                else {
                    const error = yield response.text();
                    console.error("❌ Error adding to EtherMail:", error);
                    return false;
                }
            }
            catch (error) {
                console.error("❌ Error calling EtherMail API:", error);
                return false;
            }
        });
    }
}
exports.EtherMailService = EtherMailService;
