export interface ScholarsSubmissionData {
  name: string;
  email: string;
  details?: string;
  createdAt?: Date;
  interests: string[];
  newsletter: boolean;
}

export interface PartnerSubmissionData {
  name: string;
  email: string;
  details?: string;
  companyName: string;
  newsletter: boolean;
  interests: string[] | string;
}

export interface GuidesSubmissionData {
  name: string;
  email: string;
  createdAt?: Date;
  interests: string[];
  digitalLink: string;
  daoInterests: string;
  personalValues: string;
}

export interface DiversitySubmissionData {
  ageRange: string;
  ethnicity: string;
  disability: string;
  equityScale: string;
  grantRound?: string;
  hasRoadmap: boolean;
  diverseTeam: string;
  uniqueValue: string;
  selfIdentity: string;
  suggestions?: string;
  marketImpact: string;
  grantProvider?: string;
  grantExperience?: string;
  sexualOrientation: string;
  reportsFinancials: boolean;
  runsGrantPrograms: boolean;
  selfIdentityCustom?: string;
  claritySuggestions?: string;
  engagementChannels: string[];
  diversityInitiatives: string;
  improvementSuggestions?: string;
  grantRoundParticipation?: string;
  activeGrantsParticipated?: string;
  underrepresentedLeadership: string;
  highlightsUnderrepresented: string;
  offeringClear: "Yes" | "No" | "Somewhat";
  decentralizedDecisionMaking: "Yes" | "No" | "Unsure";
}

// Email Templates
export const scholarsSubmissionTemplate = (
  data: ScholarsSubmissionData
): string => {
  return `
    <!DOCTYPE html><html lang="en"> <head> <meta charset="UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1" /> <title>SI U Scholar Submission</title> <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Montserrat:wght@500;700&display=swap" rel="stylesheet" /> <style> body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Inter', Arial, sans-serif; } .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0d5ff; } .header { background: linear-gradient(121.07deg, #211257 5.49%, #4C1192 48.19%, #790EB4 75.74%, #8A04C5 86.22%); color: #fff; padding: 24px; text-align: center; } .header h1 { margin: 0; font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 700; } .content { padding: 30px; color: #333; } .content p { font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 20px; color: #555; } .details-table { width: 100%; border-collapse: collapse; margin-top: 10px; } .details-table td { padding: 14px; vertical-align: top; font-size: 15px; } .details-table td.label { background-color: #faf5ff; color: #790EB4; font-weight: 600; width: 35%; border-bottom: 1px solid #eee; } .details-table td.value { background-color: #f9f9f9; color: #333; border-bottom: 1px solid #eee; } .footer { text-align: center; font-size: 13px; color: #999; padding: 20px; } @media only screen and (max-width: 600px) { .content { padding: 20px; } .details-table td { display: block; width: 100% !important; } .details-table td.label { border-bottom: none; } .details-table td.value { border-top: 0; padding-top: 4px; padding-bottom: 14px; } } </style> </head> <body> <div class="email-container"> <div class="header"> <h1>SI U Scholar Submission</h1> </div> <div class="content"> <p> A new scholar has applied to the Scholars Program. Here are the details: </p> <table class="details-table"> <tr> <td class="label">Name:</td> <td class="value">${
      data.name
    }</td> </tr> <tr> <td class="label">Email:</td> <td class="value">${
    data.email
  }</td> </tr> <tr> <td class="label">Interests:</td> <td class="value"> ${
    Array.isArray(data.interests) ? data.interests.join(", ") : data.interests
  } </td> </tr> ${
    data.details
      ? ` <tr> <td class="label">Additional Details:</td> <td class="value" style="white-space: pre-line;">${data.details}</td> </tr>`
      : ""
  } <tr> <td class="label">Newsletter Subscription:</td> <td class="value">${
    data.newsletter ? "Subscribed" : "Not Subscribed"
  }</td> </tr> </table> </div> <div class="footer"> This is an automated message. Please do not reply. </div> </div> </body></html>
  `;
};

export const scholarsReplyTemplate = (data: ScholarsSubmissionData): string => {
  return `
    <!DOCTYPE html><html lang="en"> <head> <meta charset="UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1" /> <title>Thank you for joining the waitlist</title> <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Montserrat:wght@500;700&display=swap" rel="stylesheet" /> <style> body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: "Inter", Arial, sans-serif; } .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0d5ff; } .header { background: linear-gradient( 121.07deg, #211257 5.49%, #4c1192 48.19%, #790eb4 75.74%, #8a04c5 86.22% ); color: #fff; padding: 24px; text-align: center; } .header h1 { margin: 0; font-family: "Montserrat", sans-serif; font-size: 24px; font-weight: 700; } .content { padding: 30px; color: #333; } .content p { font-size: 16px; line-height: 1.6; margin: 0 0 20px; color: #555; } .cta { text-align: center; margin-top: 30px; } .cta a { display: inline-block; padding: 12px 28px; background: linear-gradient( 121.07deg, #211257 5.49%, #4c1192 48.19%, #790eb4 75.74%, #8a04c5 86.22% ); color: #fff; font-family: "Inter", sans-serif; font-weight: 600; font-size: 16px; text-decoration: none; border-radius: 50px; } .socials { text-align: center; margin-top: 30px; } .socials a { display: inline-block; margin: 0 10px; text-decoration: none; } .socials svg { width: 24px; height: 24px; fill: #4c1192; vertical-align: middle; } .footer { text-align: center; font-size: 13px; color: #999; padding: 20px; border-top: 1px solid #eee; } .footer a { color: #4c1192; text-decoration: none; } @media only screen and (max-width: 600px) { .content { padding: 20px; } } </style> </head> <body> <div class="email-container"> <div class="header"><h1>Thank you for joining the waitlist</h1></div> <div class="content"> <p>Hi ${
      data.name || "There"
    },</p> <p> Thank you submitting to our waitlist to become a <strong>Si U Scholar</strong>. We've received your waitlist reponse and are excited to learn more about you. </p> <p> Look out for an onboarding email soon to join us as a Scholar and accelerate your professional development in Web3. </p> <p> While you wait, stay connected and feel free to explore our resources and community channels. </p> <div class="cta"> <a href="https://www.si3.space/">Visit SI&lt;3&gt; Ecosystem</a> </div> <div class="socials"> <a href="https://x.com/si3_ecosystem" target="_blank" aria-label="X"> <img src="https://img.icons8.com/ios-filled/50/twitterx--v1.png" alt="X" width="32" height="32" style="display: inline-block; margin: 0 5px" /> </a> <a href="https://www.linkedin.com/company/si3-ecosystem/" target="_blank" aria-label="LinkedIn" > <img src="https://img.icons8.com/ios-filled/50/linkedin.png" alt="LinkedIn" width="32" height="32" style="display: inline-block; margin: 0 5px" /> </a> </div> </div> <div class="footer"> This is an automated confirmation email. If you didn’t fill out the form, please ignore this message.<br /> <br /> For queries, contact us at <a href="mailto:scholars@si3.space">scholars@si3.space</a> </div> </div> </body></html>
  `;
};

export const partnerSubmissionTemplate = (
  data: PartnerSubmissionData
): string => {
  return `
    <!DOCTYPE html><html lang="en"> <head> <meta charset="UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1" /> <title>Si<3> Partner Inquiry</title> <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Montserrat:wght@500;700&display=swap" rel="stylesheet" /> <style> body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Inter', Arial, sans-serif; } .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0d5ff; } .header { background: linear-gradient( 121.07deg, #211257 5.49%, #4c1192 48.19%, #790eb4 75.74%, #8a04c5 86.22% ); color: #fff; padding: 24px; text-align: center; } .header h1 { margin: 0; font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 700; } .content { padding: 30px; color: #333; } .content p { font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 20px; color: #555; } .details-table { width: 100%; border-collapse: collapse; margin-top: 10px; } .details-table td { padding: 14px; vertical-align: top; font-size: 15px; } .details-table td.label { background-color: #faf5ff; color: #790eb4; font-weight: 600; width: 35%; border-bottom: 1px solid #eee; } .details-table td.value { background-color: #f9f9f9; color: #333; border-bottom: 1px solid #eee; } .footer { text-align: center; font-size: 13px; color: #999; padding: 20px; } @media only screen and (max-width: 600px) { .content { padding: 20px; } .details-table td { display: block; width: 100% !important; } .details-table td.label { border-bottom: none; } .details-table td.value { border-top: 0; padding-top: 4px; padding-bottom: 14px; } } </style> </head> <body> <div class="email-container"> <div class="header"> <h1>Si<3> Partner Inquiry</h1> </div> <div class="content"> <p>A new partnership application has been submitted:</p> <table class="details-table"> <tr> <td class="label">Name:</td> <td class="value">${
      data.name || "N/A"
    }</td> </tr> <tr> <td class="label">Email:</td> <td class="value">${
    data.email || "N/A"
  }</td> </tr> <tr> <td class="label">Company Name:</td> <td class="value">${
    data.companyName || "N/A"
  }</td> </tr> <tr> <td class="label">Interests:</td> <td class="value">${
    Array.isArray(data.interests)
      ? data.interests.join(", ")
      : data.interests || "N/A"
  }</td> </tr> <tr> <td class="label">Additional Details:</td> <td class="value" style="white-space: pre-line;">${
    data.details || "N/A"
  }</td> </tr> <tr> <td class="label">Newsletter Subscription:</td> <td class="value">${
    data.newsletter ? "Subscribed" : "Not Subscribed"
  }</td> </tr> </table> </div> <div class="footer"> This is an automated notification. Please do not reply. </div> </div> </body></html>
  `;
};

export const partnerReplyTemplate = (data: PartnerSubmissionData): string => {
  return `
    <!DOCTYPE html><html lang="en"> <head> <meta charset="UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1" /> <title>Thank you for your inquiry!</title> <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Montserrat:wght@500;700&display=swap" rel="stylesheet" /> <style> body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: "Inter", Arial, sans-serif; } .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0d5ff; } .header { background: linear-gradient( 121.07deg, #211257 5.49%, #4c1192 48.19%, #790eb4 75.74%, #8a04c5 86.22% ); color: #fff; padding: 24px; text-align: center; } .header h1 { margin: 0; font-family: "Montserrat", sans-serif; font-size: 24px; font-weight: 700; } .content { padding: 30px; color: #333; } .content p { font-size: 16px; line-height: 1.6; margin: 0 0 20px; color: #555; } .cta { text-align: center; margin-top: 30px; } .cta a { display: inline-block; padding: 12px 28px; background: linear-gradient( 121.07deg, #211257 5.49%, #4c1192 48.19%, #790eb4 75.74%, #8a04c5 86.22% ); color: #fff; font-family: "Inter", sans-serif; font-weight: 600; font-size: 16px; text-decoration: none; border-radius: 50px; } .socials { text-align: center; margin-top: 30px; } .socials a { display: inline-block; margin: 0 10px; text-decoration: none; } .socials svg { width: 24px; height: 24px; fill: #4c1192; vertical-align: middle; } .footer { text-align: center; font-size: 13px; color: #999; padding: 20px; border-top: 1px solid #eee; } .footer a { color: #4c1192; text-decoration: none; } @media only screen and (max-width: 600px) { .content { padding: 20px; } } </style> </head> <body> <div class="email-container"> <div class="header"><h1>Thank you for your inquiry!</h1></div> <div class="content"> <p>Hi ${
      data.name || "There"
    },</p> <p> Thank you for reaching out to <strong>SI&lt;3&gt;</strong> through our partner inquiry form. We are excited to explore opportunities for collaboration. </p> <p> Our team will review your inquiry and respond soon. In the meantime, feel free to discover our ecosystem and social channels to stay connected. </p> <div class="cta"> <a href="https://www.si3.space/">Visit SI&lt;3&gt; Ecosystem</a> </div> <div class="socials"> <a href="https://x.com/si3_ecosystem" target="_blank" aria-label="X"> <img src="https://img.icons8.com/ios-filled/50/twitterx--v1.png" alt="X" width="32" height="32" style="display: inline-block; margin: 0 5px" /> </a> <a href="https://www.linkedin.com/company/si3-ecosystem/" target="_blank" aria-label="LinkedIn" > <img src="https://img.icons8.com/ios-filled/50/linkedin.png" alt="LinkedIn" width="32" height="32" style="display: inline-block; margin: 0 5px" /> </a> </div> </div> <div class="footer"> This is an automated confirmation email. If you didn’t fill out the form, please ignore this message.<br /> <br /> For queries, contact us at <a href="mailto:partners@si3.space">partners@si3.space</a> </div> </div> </body></html>
  `;
};

export const guidesSubmissionTemplate = (
  data: GuidesSubmissionData
): string => {
  return `
    <!DOCTYPE html><html lang="en"> <head> <meta charset="UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1" /> <title>Si Her Guide Application</title> <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Montserrat:wght@500;700&display=swap" rel="stylesheet" /> <style> body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Inter', Arial, sans-serif; } .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0d5ff; } .header { background: linear-gradient(121.07deg, #211257 5.49%, #4C1192 48.19%, #790EB4 75.74%, #8A04C5 86.22%); color: #fff; padding: 24px; text-align: center; } .header h1 { margin: 0; font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 700; } .content { padding: 30px; color: #333; } .content p { font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 20px; color: #555; } .details-table { width: 100%; border-collapse: collapse; margin-top: 10px; } .details-table td { padding: 14px; vertical-align: top; font-size: 15px; } .details-table td.label { background-color: #faf5ff; color: #790EB4; font-weight: 600; width: 35%; border-bottom: 1px solid #eee; } .details-table td.value { background-color: #f9f9f9; color: #333; border-bottom: 1px solid #eee; } .footer { text-align: center; font-size: 13px; color: #999; padding: 20px; } @media only screen and (max-width: 600px) { .content { padding: 20px; } .details-table td { display: block; width: 100% !important; } .details-table td.label { border-bottom: none; } .details-table td.value { border-top: 0; padding-top: 4px; padding-bottom: 14px; } } </style> </head> <body> <div class="email-container"> <div class="header"> <h1>Si Her Guide Application</h1> </div> <div class="content"> <p> A new Si Her Guide application has been submitted: </p> <table class="details-table"> <tr> <td class="label">Name:</td> <td class="value">${
      data.name || "N/A"
    }</td> </tr> <tr> <td class="label">Email:</td> <td class="value">${
    data.email || "N/A"
  }</td> </tr> <tr> <td class="label">DAO Interests:</td> <td class="value">${
    data.daoInterests || "N/A"
  }</td> </tr> <tr> <td class="label">Interests:</td> <td class="value">${
    Array.isArray(data.interests) && data.interests.length > 0
      ? data.interests.join(", ")
      : "N/A"
  }</td> </tr> <tr> <td class="label">Personal Values:</td> <td class="value" style="white-space: pre-line;">${
    data.personalValues || "N/A"
  }</td> </tr> <tr> <td class="label">Digital Link:</td> <td class="value">${
    data.digitalLink
      ? `<a href="${data.digitalLink}" target="_blank" style="color: #C258FF; text-decoration: none;">${data.digitalLink}</a>`
      : "N/A"
  }</td> </tr> </table> </div> <div class="footer"> This is an automated notification. Please do not reply. </div> </div> </body></html>
  `;
};

export const guidesReplyTemplate = (data: GuidesSubmissionData): string => {
  return `
    <!DOCTYPE html><html lang="en"> <head> <meta charset="UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1" /> <title>Thank You for Applying!</title> <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Montserrat:wght@500;700&display=swap" rel="stylesheet" /> <style> body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: "Inter", Arial, sans-serif; } .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0d5ff; } .header { background: linear-gradient( 121.07deg, #211257 5.49%, #4c1192 48.19%, #790eb4 75.74%, #8a04c5 86.22% ); color: #fff; padding: 24px; text-align: center; } .header h1 { margin: 0; font-family: "Montserrat", sans-serif; font-size: 24px; font-weight: 700; } .content { padding: 30px; color: #333; } .content p { font-size: 16px; line-height: 1.6; margin: 0 0 20px; color: #555; } .cta { text-align: center; margin-top: 30px; } .cta a { display: inline-block; padding: 12px 28px; background: linear-gradient( 121.07deg, #211257 5.49%, #4c1192 48.19%, #790eb4 75.74%, #8a04c5 86.22% ); color: #fff; font-family: "Inter", sans-serif; font-weight: 600; font-size: 16px; text-decoration: none; border-radius: 50px; } .socials { text-align: center; margin-top: 30px; } .socials a { display: inline-block; margin: 0 10px; text-decoration: none; } .socials svg { width: 24px; height: 24px; fill: #4c1192; vertical-align: middle; } .footer { text-align: center; font-size: 13px; color: #999; padding: 20px; border-top: 1px solid #eee; } .footer a { color: #4c1192; text-decoration: none; } @media only screen and (max-width: 600px) { .content { padding: 20px; } } </style> </head> <body> <div class="email-container"> <div class="header"><h1>Thank You for Applying!</h1></div> <div class="content"> <p>Hi ${
      data.name || "There"
    },</p> <p> Thank you applying to become a Si Her Guide. We've received your application and are excited to learn more about you and your interests in joining our DAO. </p> <p> Our team will review your application and reach out soon with next steps. In the meantime, stay connected and feel free to explore our resources and community channels. </p> <div class="cta"> <a href="https://www.si3.space/">Visit SI&lt;3&gt; Ecosystem</a> </div> <div class="socials"> <a href="https://x.com/si3_ecosystem" target="_blank" aria-label="X"> <img src="https://img.icons8.com/ios-filled/50/twitterx--v1.png" alt="X" width="32" height="32" style="display: inline-block; margin: 0 5px" /> </a> <a href="https://www.linkedin.com/company/si3-ecosystem/" target="_blank" aria-label="LinkedIn" > <img src="https://img.icons8.com/ios-filled/50/linkedin.png" alt="LinkedIn" width="32" height="32" style="display: inline-block; margin: 0 5px" /> </a> </div> </div> <div class="footer"> This is an automated confirmation email. If you didn’t fill out the form, please ignore this message.<br /> <br /> For queries, contact us at <a href="mailto:guides@si3.space">guides@si3.space</a> </div> </div> </body></html>
  `;
};

export const diversityTrackerTemplate = (
  data: DiversitySubmissionData
): string => {
  const wrapRow = (
    label: string,
    value: string | undefined | boolean | string[]
  ) => {
    if (typeof value === "boolean")
      return `<tr><td class="label">${label}</td><td class="value">${
        value ? "Yes" : "No"
      }</td></tr>`;
    if (Array.isArray(value))
      return value.length > 0
        ? `<tr><td class="label">${label}</td><td class="value">${value.join(
            ", "
          )}</td></tr>`
        : "";
    return value
      ? `<tr><td class="label">${label}</td><td class="value">${value}</td></tr>`
      : "";
  };

  return `
    <!DOCTYPE html><html lang="en"><head> <meta charset="UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1" /> <title>Diversity Tracker Submission</title> <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Montserrat:wght@500;700&display=swap" rel="stylesheet" /> <style> body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Inter', Arial, sans-serif; } .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0d5ff; } .header { background: linear-gradient(121.07deg, #211257 5.49%, #4C1192 48.19%, #790EB4 75.74%, #8A04C5 86.22%); color: #fff; padding: 24px; text-align: center; } .header h1 { margin: 0; font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 700; } .content { padding: 30px; color: #333; } .content p { font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 20px; color: #555; } .details-table { width: 100%; border-collapse: collapse; margin-top: 10px; } .details-table td { padding: 14px; vertical-align: top; font-size: 15px; } .details-table td.label { background-color: #faf5ff; color: #790EB4; font-weight: 600; width: 35%; border-bottom: 1px solid #eee; } .details-table td.value { background-color: #f9f9f9; color: #333; border-bottom: 1px solid #eee; } .footer { text-align: center; font-size: 13px; color: #999; padding: 20px; } @media only screen and (max-width: 600px) { .content { padding: 20px; } .details-table td { display: block; width: 100% !important; } .details-table td.label { border-bottom: none; } .details-table td.value { border-top: 0; padding-top: 4px; padding-bottom: 14px; } } </style></head><body> <div class="email-container"> <div class="header"> <h1>Diversity Tracker Submission</h1> </div> <div class="content"> <p>A new submission was received through the Diversity Tracker form. Below are the submitted details:</p> <table class="details-table"> ${wrapRow(
      "Self Identity",
      data.selfIdentity
    )} ${wrapRow("Custom Self Identity", data.selfIdentityCustom)} ${wrapRow(
    "Age Range",
    data.ageRange
  )} ${wrapRow("Ethnicity", data.ethnicity)} ${wrapRow(
    "Disability",
    data.disability
  )} ${wrapRow("Sexual Orientation", data.sexualOrientation)} ${wrapRow(
    "Equity Scale",
    data.equityScale
  )} ${wrapRow(
    "Improvement Suggestions",
    data.improvementSuggestions
  )} ${wrapRow("Grant Provider", data.grantProvider)} ${wrapRow(
    "Grant Round",
    data.grantRound
  )} ${wrapRow("Suggestions", data.suggestions)} ${wrapRow(
    "Active Grants Participated",
    data.activeGrantsParticipated
  )} ${wrapRow("Offering Clear", data.offeringClear)} ${wrapRow(
    "Clarity Suggestions",
    data.claritySuggestions
  )} ${wrapRow("Engagement Channels", data.engagementChannels)} ${wrapRow(
    "Decentralized Decision Making",
    data.decentralizedDecisionMaking
  )} ${wrapRow("Has Roadmap", data.hasRoadmap)} ${wrapRow(
    "Reports Financials",
    data.reportsFinancials
  )} ${wrapRow("Runs Grant Programs", data.runsGrantPrograms)} ${wrapRow(
    "Grant Round Participation",
    data.grantRoundParticipation
  )} ${wrapRow("Grant Experience", data.grantExperience)} ${wrapRow(
    "Diversity Initiatives",
    data.diversityInitiatives
  )} ${wrapRow("Diverse Team", data.diverseTeam)} ${wrapRow(
    "Underrepresented Leadership",
    data.underrepresentedLeadership
  )} ${wrapRow(
    "Highlights Underrepresented",
    data.highlightsUnderrepresented
  )} ${wrapRow("Unique Value", data.uniqueValue)} ${wrapRow(
    "Market Impact",
    data.marketImpact
  )} </table> </div> <div class="footer"> <p>Thank you for your submission.</p> <p>&copy; ${new Date().getFullYear()} SI&lt;3&gt;. All rights reserved.</p> </div> </div></body></html>
  `;
};

export const otpEmailTemplate = (otp: string, email: string, purpose: string = "Login"): string => {
  return `
    <!DOCTYPE html><html lang="en"> <head> <meta charset="UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1.0" /> <title>SI U | OTP Verification</title> <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" /> <style> body { margin: 0; padding: 0; background-color: #eff8ff; font-family: 'Inter', sans-serif; } .container { max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e0d5ff; } .header { background: linear-gradient(121.07deg, #211257 5.49%, #4C1192 48.19%, #790EB4 75.74%, #8A04C5 86.22%); color: #ffffff; text-align: center; padding: 32px 20px; } .header h1 { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 28px; margin: 0; } .content { padding: 40px 30px; text-align: center; } .content h2 { font-family: 'Montserrat', sans-serif; font-size: 20px; font-weight: 600; color: #4C1192; margin-bottom: 24px; } .otp-box { display: inline-block; background-color: #f7f0fc; border: 2px dashed #8A04C5; border-radius: 16px; padding: 24px 32px; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #4C1192; font-family: 'Courier New', monospace; margin-bottom: 16px; } .expires { font-size: 14px; color: #790EB4; margin-top: 12px; } .warning { background-color: #fff1f2; border: 1px solid #fda4af; color: #b91c1c; padding: 16px; margin-top: 28px; border-radius: 12px; font-size: 14px; text-align: center; } .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 13px; color: #6b7280; } .footer a { color: #4C1192; text-decoration: none; font-weight: 500; } </style> </head> <body> <div class="container"> <div class="header"> <h1>SI U Secure Access Code</h1> <p style="margin: 8px 0 0; font-size: 15px; font-weight: 500;">Web3 Secure Access</p> </div> <div class="content"> <h2>Your ${purpose} Code</h2> <div class="otp-box">${otp}</div> <p class="expires">⏱️ Expires in ${
    process.env.OTP_EXPIRY_MINUTES || 10
  } minutes</p> <div class="warning"> 🔐 <strong>Security Tip:</strong> This code is private. Never share it with anyone. </div> </div> <div class="footer"> SI&lt;3&gt; • <a href="https://si3.space" target="_blank">si3.space</a> </div> </div> </body></html>
  `;
};

export const welcomeEmailTemplate = () => {
  return `
     <!DOCTYPE html><html lang="en"> <head> <meta charset="UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1" /> <title>Welcome to SI U</title> <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Montserrat:wght@500;700&display=swap" rel="stylesheet" /> <style> body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: "Inter", Arial, sans-serif; } .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0d5ff; } .header { background: linear-gradient( 121.07deg, #211257 5.49%, #4c1192 48.19%, #790eb4 75.74%, #8a04c5 86.22% ); color: #fff; padding: 24px; text-align: center; } .header h1 { margin: 0; font-family: "Montserrat", sans-serif; font-size: 24px; font-weight: 700; } .content { padding: 30px; color: #333; } .content p { font-size: 16px; line-height: 1.6; margin: 0 0 20px; color: #555; } .footer { text-align: center; font-size: 13px; color: #999; padding: 20px; } </style> </head> <body> <div class="email-container"> <div class="header"> <h1>Welcome to SI U</h1> </div> <div class="content"> <p>Hi there,</p> <p>We’re thrilled you’ve joined the SI U ecosystem.</p> <p> Whether you’re a Scholar, a Guide, a Partner, or just exploring the decentralized future — you’re now part of a growing community building something meaningful. </p> <p> Make the most of your journey by connecting with others, asking questions, and sharing your ideas. </p> <p><strong>Onward,</strong><br />The SI U Team</p> </div> <div class="footer"> This is an automated email. If you didn’t sign up, you can safely ignore this message.<br /> Visit us at <a href="https://si3.space">si3.space</a> </div> </div> </body></html>
  `;
};

export const loginAlertEmailTemplate = (params: {
  email: string;
  time: string;
  location?: string;
  ipAddress?: string;
}): string => {
  const { email, time, location = "Unknown", ipAddress = "Unknown" } = params;

  return `
     <!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1" /> <title>SI U Login Alert</title> <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Montserrat:wght@500;700&display=swap" rel="stylesheet" /> <style> body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: "Inter", Arial, sans-serif; } .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0d5ff; } .header { background: linear-gradient(121.07deg, #211257 5.49%, #4C1192 48.19%, #790EB4 75.74%, #8A04C5 86.22%); color: #fff; padding: 24px; text-align: center; } .header h1 { margin: 0; font-family: "Montserrat", sans-serif; font-size: 24px; font-weight: 700; } .content { padding: 30px; color: #333; } .content p { font-size: 16px; line-height: 1.6; margin: 0 0 20px; color: #555; } .info-box { background-color: #f9f9f9; border-left: 4px solid #8A04C5; padding: 16px; border-radius: 8px; font-size: 15px; margin-top: 20px; } .footer { text-align: center; font-size: 13px; color: #999; padding: 20px; } </style> </head> <body> <div class="email-container"> <div class="header"> <h1>Login Detected</h1> </div> <div class="content"> <p>Hi <strong>${email}</strong>,</p> <p>A new login to your SI U account was just detected.</p> <div class="info-box"> <strong>Time:</strong> ${time}<br/> <strong>Location:</strong> ${location}<br/> <strong>IP Address:</strong> ${ipAddress} </div> <p>If this was you, no action is needed.</p> <p>If you don’t recognize this activity, please reset your password or contact our team immediately.</p> </div> <div class="footer"> This is an automated alert. Questions? Contact us at <a href="mailto:scholars@si3.space">scholars@si3.space</a> </div> </div> </body> </html>
  `;
};
