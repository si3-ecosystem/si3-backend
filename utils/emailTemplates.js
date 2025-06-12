export const partnerProgramEmailTemplate = (data) => {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px;">
    <div style="background-color: #fff; border-radius: 8px; border: 1px solid #eee;">
        <div style="padding: 20px; border-radius: 8px;">
            <h1 style="text-align: center; color: #F927E9; margin-bottom: 25px; border-bottom: 2px solid #C258FF; padding-bottom: 10px;">Partner Program Submission</h1>
            <p style="text-align: center; font-size: 16px; color: #666; margin-bottom: 20px;">
                Thank you for your interest in partnering with us. Here are the details of your submission:
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Name:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.name
                    }</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Email:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.email
                    }</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Company:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.companyName
                    }</td>
                </tr>
                 <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Interests:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${(() => {
                      const interestsArray = Array.isArray(data.interests)
                        ? data.interests
                        : typeof data.interests === "string"
                        ? data.interests
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        : [];
                      return interestsArray.join(", ");
                    })()}</td>
                </tr>
                ${
                  data.details
                    ? `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Details:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${data.details}</td>
                </tr>
                `
                    : ""
                }
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Newsletter:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.newsletter ? "Yes" : "No"
                    }</td>
                </tr>
            </table>
            </div>
            <div style="text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee;">
                <p style="color: #888;">Thank you for your interest in our partner program. We will be in touch soon.</p>
                <p style="font-size: 12px; color: #666;">&copy; ${new Date().getFullYear()} SI<3>. All rights reserved.</p>
            </div>
        </div>
    </div>
  `;
};

export const guideEmailTemplate = (data) => {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px;">
      <div style="background-color: #fff; border-radius: 8px; border: 1px solid #eee;">
        <div style="padding: 20px; border-radius: 8px;">
          <h1 style="text-align: center; color: #F927E9; margin-bottom: 25px; border-bottom: 2px solid #C258FF; padding-bottom: 10px;">Si Her Guide Application</h1>
          <p style="text-align: center; font-size: 16px; color: #666; margin-bottom: 20px;">
            A new Si Her Guide application has been submitted:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF; width: 30%;">Name:</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                data.name || "N/A"
              }</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Email:</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                data.email || "N/A"
              }</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">DAO Interests:</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                data.daoInterests || "N/A"
              }</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Interests:</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                Array.isArray(data.interests) && data.interests.length > 0
                  ? data.interests.join(", ")
                  : "N/A"
              }</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Personal Values:</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8; white-space: pre-line;">${
                data.personalValues || "N/A"
              }</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Digital Link:</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">
                ${
                  data.digitalLink
                    ? `<a href="${data.digitalLink}" target="_blank" style="color: #C258FF; text-decoration: none;">${data.digitalLink}</a>`
                    : "N/A"
                }
              </td>
            </tr>
          </table>
        </div>
        <div style="text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee;">
          <p style="color: #888;">This is an automated notification. Please do not reply to this email.</p>
          <p style="font-size: 12px; color: #666;">&copy; ${new Date().getFullYear()} SI<3. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
};

export const diversityTrackerEmailTemplate = (data) => {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; border: 1px solid #eee;">
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px;">
            <h1 style="text-align: center; color: #F927E9; margin-bottom: 25px; border-bottom: 2px solid #C258FF; padding-bottom: 10px;">Diversity Tracker Submission</h1>

            <p style="text-align: center; font-size: 16px; color: #666; margin-bottom: 20px;">
                Here are the details of the diversity tracker submission:
            </p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; color: #333;">
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Self Identity:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.selfIdentity
                    }</td>
                </tr>
                ${
                  data.selfIdentityCustom
                    ? `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Custom Self Identity:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${data.selfIdentityCustom}</td>
                </tr>
                `
                    : ""
                }
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Age Range:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.ageRange
                    }</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Ethnicity:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.ethnicity
                    }</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Disability:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.disability
                    }</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Sexual Orientation:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.sexualOrientation
                    }</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Equity Scale:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.equityScale
                    }</td>
                </tr>
                ${
                  data.improvementSuggestions
                    ? `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Improvement Suggestions:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${data.improvementSuggestions}</td>
                </tr>
                `
                    : ""
                }
                ${
                  data.grantProvider
                    ? `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Grant Provider:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${data.grantProvider}</td>
                </tr>
                `
                    : ""
                }
                ${
                  data.grantRound
                    ? `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Grant Round:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${data.grantRound}</td>
                </tr>
                `
                    : ""
                }
                ${
                  data.suggestions
                    ? `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Suggestions:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${data.suggestions}</td>
                </tr>
                `
                    : ""
                }
                ${
                  data.activeGrantsParticipated
                    ? `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Active Grants Participated:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${data.activeGrantsParticipated}</td>
                </tr>
                `
                    : ""
                }
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Offering Clear:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.offeringClear
                    }</td>
                </tr>
                ${
                  data.claritySuggestions
                    ? `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Clarity Suggestions:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${data.claritySuggestions}</td>
                </tr>
                `
                    : ""
                }
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Engagement Channels:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${data.engagementChannels.join(
                      ", "
                    )}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Decentralized Decision Making:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.decentralizedDecisionMaking
                    }</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Has Roadmap:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.hasRoadmap
                    }</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Reports Financials:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.reportsFinancials
                    }</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Runs Grant Programs:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.runsGrantPrograms
                    }</td>
                </tr>
                ${
                  data.grantRoundParticipation
                    ? `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Grant Round Participation:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${data.grantRoundParticipation}</td>
                </tr>
                `
                    : ""
                }
                ${
                  data.grantExperience
                    ? `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Grant Experience:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${data.grantExperience}</td>
                </tr>
                `
                    : ""
                }
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Diversity Initiatives:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.diversityInitiatives
                    }</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Diverse Team:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.diverseTeam
                    }</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Underrepresented Leadership:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.underrepresentedLeadership
                    }</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Highlights Underrepresented:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.highlightsUnderrepresented
                    }</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Unique Value:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.uniqueValue
                    }</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #fff; font-weight: bold; color: #C258FF;">Market Impact:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; background-color: #f8f8f8;">${
                      data.marketImpact
                    }</td>
                </tr>
            </table>
        </div>
        
        <div style="text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee;">
            <p style="color: #888;">Thank you for your submission.</p>
            <p style="font-size: 12px; color: #666;">&copy; ${new Date().getFullYear()} SI<3>. All rights reserved.</p>
        </div>
    </div>
  `;
};

// utils/otpEmailTemplate.js
export const otpEmailTemplate = (otp, email) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7f7;">
      <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #1a1a1a; margin: 0; font-size: 28px; font-weight: 700;">
            SI&lt;3&gt;
          </h1>
          <p style="color: #6b7280; font-size: 16px; margin: 8px 0 0 0;">
            Secure Login Verification
          </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 40px;">
          <h2 style="color: #1f2937; margin-bottom: 16px; font-size: 24px;">
            Your Login Code
          </h2>
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 32px; margin: 24px 0;">
            <div style="background: white; border-radius: 8px; padding: 24px;">
              <div style="font-size: 48px; font-weight: bold; color: #1f2937; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
            </div>
          </div>
          <p style="color: #ef4444; font-size: 14px; font-weight: 500;">
            ⏱️ This code expires in ${
              process.env.OTP_EXPIRY_MINUTES || 10
            } minutes
          </p>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            🔒 <strong>Security Notice:</strong> Never share this code with anyone.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            SI&lt;3&gt; • <a href="https://si3.space" style="color: #667eea;">si3.space</a>
          </p>
        </div>
      </div>
    </div>
  `;
};

export const tempMail = () => {
  return `
   <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>SI HER KOLLAB</title><!-- FONT --><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet"><style>@font-face { font-family: 'Clesmont'; src: url('https://tbjpbn89yx.ufs.sh/f/Wxv4gGErZaS383JovdsetYoqcGAXax1l0fSJBZd5L46RMU8p') format('truetype'); font-weight: normal; font-style: normal; }@media (prefers-color-scheme: dark) { .body-wrapper { background-color: #1e1e1e !important; color: #ffffff !important; } .card { background-color: #2a2a2a !important; color: #ffffff !important; } a { color: #66ccff !important; }}* {box-sizing: border-box;}</style></head><body style="margin:0; padding:0;" class="body-wrapper"><!-- MAIN TABLE --> <table width="600" cellpadding="0" cellspacing="0" border="0" style="margin-left: auto;margin-right: auto;background-color: #EFF8FF;" class="body-wrapper"> <tr> <td> <!-- *************************** --> <!-- INNER TOP BAR --> <!-- *************************** --> <table width="100%" cellpadding="0" cellspacing="0" border="0" class="container" style="background: linear-gradient(121.07deg, #211257 5.49%, #4C1192 48.19%, #790EB4 75.74%, #8A04C5 86.22%);"> <tr> <td style="padding: 12px;text-align: center;"> <span style="font-family: 'Inter', sans-serif;font-weight: 400;font-size: 14px;line-height: 26px;text-align: center;color: #fff;">ADVANCING WOMEN TO THE FOREFRONT OF WEB3</span> </td> </tr> </table> <!-- *************************** --> <!-- INNER TITLE --> <!-- *************************** --> <table width="100%" cellpadding="0" cellspacing="0" border="0" class="container"> <tr> <td style="padding: 35px;text-align: center;background-color: #fff;"> <span style="font-family: 'Clesmont', sans-serif;font-weight: 400;font-size: 32px;line-height: 26px;color: #000;">SI HER KOLLAB</span> </td> </tr> </table> <!-- *************************** --> <!-- INNER CONTENT --> <!-- *************************** --> <table width="100%" cellpadding="0" cellspacing="0" border="0" class="container"> <tr> <td style="padding: 35px 70px;text-align: center;"> <h3 style="font-family: 'Montserrat', sans-serif;font-weight: 600;font-size: 20px;line-height: 27px;color:#4C1192;display: inline-block;display: block;margin: 0;">Dear Si Her Kollab Leaders,</h3> <p style="font-family: 'Inter', sans-serif;font-weight: 400;font-size: 16px;line-height: 27px;color: #000;margin-top: 21px;margin-bottom: 0;">This is our first bi-weekly newsletter where we will share updates on the activities within our growing collaborative. In each newsletter, we will introduce a new thought leadership theme, share updates on our developing DAO, and highlight you all as community leaders. </p> <p style="font-family: 'Inter', sans-serif;font-weight: 400;font-size: 16px;line-height: 27px;color: #000;margin-top: 28px;margin-bottom: 0;">We invite you to attend our bi-weekly calls on Thursdays, and share your ideas there and in our Telegram group. This DAO is being shaped by you, for you! </p> <p style="font-family: 'Inter', sans-serif;font-weight: 600;font-size: 16px;line-height: 27px;color: #000;margin-top: 28px;margin-bottom: 0;">With love,</p> <p style="font-family: 'Inter', sans-serif;font-weight: 400;font-size: 16px;line-height: 27px;color: #000;margin-top: 0px;margin-bottom: 0;">Kara</p> <a href="https://app.unlock-protocol.com/checkout?id=217e695c-93b7-4300-8fb9-e334194b1ba6" target="_blank" style="display: inline-block;padding: 13px 36px;background: linear-gradient(121.07deg, #211257 5.49%, #4C1192 48.19%, #790EB4 75.74%, #8A04C5 86.22%);font-family: 'Inter', sans-serif;font-weight: 600;font-size: 20px;line-height: 27px;color: #fff;text-decoration: none;border-radius: 50px;margin-top: 30px;">Claim Your Si Her Kollab NFT</a> </td> </tr> </table> <!-- *************************** --> <!-- CARD TABLE --> <!-- *************************** --> <table width="100%" cellpadding="0" cellspacing="0" border="0" class="container"> <tr> <td style="padding: 12px 32px 32px 32px;"> <h2 style="text-align: center;font-family: 'Montserrat', sans-serif;font-weight: 700;font-size: 30px;line-height: 46px;color: #000;">Si Her Kollab Highlights</h2> <!-- *************************** --> <!-- CARDS 1 --> <!-- *************************** --> <div style="border: 1px solid #F5EBFC;padding: 10px 10px 6px 10px;background-color: #fff;border-radius: 30px;margin-top: 18px;"> <table width="100%" cellpadding="0" cellspacing="0" border="0" class="container"> <tr> <td style="width: 154px;height: 152px;border-radius: 18px;padding: 0;"> <img src="https://tbjpbn89yx.ufs.sh/f/Wxv4gGErZaS3rbBmCaSXaZXseojyiA417uDb3ltHEKmSkNhd" alt="card-1" style="max-width: 100%;"> </td> <td style="padding-left: 16px;"> <a href="https://www.linkedin.com/posts/si3ecosystem_access-si3-womeninweb3-activity-7332910697590243328-iK4J?utm_source=share&utm_medium=member_desktop&rcm=ACoAADY3zREBb8wY_dXbXPMGcsVOlbg5Y3uEvxQ" target="_blank" style="font-family: 'Montserrat', sans-serif;font-weight: 600;font-size: 19px;line-height: 35px;color: #000;">Collaboration in Web3</a> <p style="margin-top: 2px;margin-bottom: 0px;font-family: 'Inter', sans-serif;font-weight: 400;font-size: 18px;line-height: 26px;color: #3D3D3D;">Join in as we kick off our thought leadership series on the topic of Collaboration in Web3.</p> </td> </tr> </table> </div> <!-- *************************** --> <!-- CARDS 2 --> <!-- *************************** --> <div style="border: 1px solid #F5EBFC;padding: 10px 10px 6px 10px;background-color: #fff;border-radius: 30px;margin-top: 18px;"> <table width="100%" cellpadding="0" cellspacing="0" border="0" class="container"> <tr> <td style="width: 154px;height: 152px;border-radius: 18px;padding: 0;"> <img src="https://tbjpbn89yx.ufs.sh/f/Wxv4gGErZaS3mSkrB79JEqwdDehWUt95zQfLs8y12xCX6Zpn" alt="card-1" style="max-width: 100%;"> </td> <td style="padding-left: 16px;"> <a href="https://www.linkedin.com/company/si3ecosystem/?trk=public_post_feed-actor-name" target="_blank" style="font-family: 'Montserrat', sans-serif;font-weight: 600;font-size: 19px;line-height: 35px;color: #000;">Accessibility in Web3</a> <p style="margin-top: 2px;margin-bottom: 0px;font-family: 'Inter', sans-serif;font-weight: 400;font-size: 18px;line-height: 26px;color: #3D3D3D;">Contribute to the conversation your unique experience in creating accessibility within your community.</p> </td> </tr> </table> </div> <!-- *************************** --> <!-- CARDS 3 --> <!-- *************************** --> <div style="border: 1px solid #F5EBFC;padding: 10px 10px 6px 10px;background-color: #fff;border-radius: 30px;margin-top: 18px;"> <table width="100%" cellpadding="0" cellspacing="0" border="0" class="container"> <tr> <td style="width: 154px;height: 152px;border-radius: 18px;padding: 0;"> <img src="https://tbjpbn89yx.ufs.sh/f/Wxv4gGErZaS39PgPOwdLvhcQEYMi0bCGlHnBRDdxNyKZfjpo" alt="card-1" style="max-width: 100%;"> </td> <td style="padding-left: 16px;"> <a style="font-family: 'Montserrat', sans-serif;font-weight: 600;font-size: 19px;line-height: 35px;color: #000;text-decoration: none;">Si Her Kollab Telegram</a> <p style="margin-top: 2px;margin-bottom: 0px;font-family: 'Inter', sans-serif;font-weight: 400;font-size: 18px;line-height: 26px;color: #3D3D3D;">Explore our evolving Telegram group as we organize sub-channels and create a supportive digital environment.</p> </td> </tr> </table> </div> <!-- *************************** --> <!-- CARDS 4 --> <!-- *************************** --> <div style="border: 1px solid #F5EBFC;padding: 10px 10px 6px 10px;background-color: #fff;border-radius: 30px;margin-top: 18px;"> <table width="100%" cellpadding="0" cellspacing="0" border="0" class="container"> <tr> <td style="width: 154px;height: 152px;border-radius: 18px;padding: 0;text-align: center;"> <img src="https://tbjpbn89yx.ufs.sh/f/Wxv4gGErZaS3NGAjAg1oYpgzur92Mnv36DRVFwidjm0TZef8" alt="card-1" style="max-width: 100%;border-radius: 18px;"> </td> <td style="padding-left: 16px;"> <a style="font-family: 'Montserrat', sans-serif;font-weight: 600;font-size: 19px;line-height: 35px;color: #000;text-decoration: none;">Tally for Governance</a> <p style="margin-top: 2px;margin-bottom: 0px;font-family: 'Inter', sans-serif;font-weight: 400;font-size: 18px;line-height: 26px;color: #3D3D3D;">In our last Si Her Kollab session, we learned about <a href="https://www.tally.xyz/" target="_blank" style="color: #682ed5">Tally.xyz</a> and their governance tools from coolhorse girl, Head of BD. Replay available soon!</p> </td> </tr> </table> </div> <!-- *************************** --> <!-- 2x BLOCK IMAGE --> <!-- *************************** --> <div style="padding: 25px;background: linear-gradient(121.07deg, #211257 5.49%, #4C1192 48.19%, #790EB4 75.74%, #8A04C5 86.22%); margin-top: 41px;text-align: center;border-top-left-radius: 20px;border-top-right-radius: 20px;"> <span style="font-family: 'Clesmont', sans-serif;font-weight: 500;font-size: 32px;line-height: 100%;color: #fff;">SI HER GUIDE</span> </div> <div style="padding: 22px 0px 40px 0px;background: linear-gradient(121.07deg, #211257 5.49%, #4C1192 48.19%, #790EB4 75.74%, #8A04C5 86.22%);border-bottom-right-radius: 20px;border-bottom-left-radius: 20px;"> <table width="100%" cellpadding="0" cellspacing="0" border="0" class="container"> <tr> <td style="width: 35%;padding: 0;text-align: center;"> <img src="https://tbjpbn89yx.ufs.sh/f/Wxv4gGErZaS3H9ETSERzdDTkCO5JwnF1EASt3srPvm7Kg4hR" alt="card-1" style="max-width: 100%;"> </td> <td style="padding-left: 16px;padding-right: 21px;width: 50%;"> <span style="font-family: 'Montserrat', sans-serif;font-weight: 600;font-size: 19px;line-height: 30px;color: #fff;display: inline-block;margin-top: 8px;">SI Her Guide Bi-Weekly Kickoff: June 20th</span> <p style="margin-top: 12px;margin-bottom: 0px;font-family: 'Inter', sans-serif;font-weight: 300;font-size: 16px;line-height: 25px;color: #fff;">Join us for the Solstice kickoff of our bi-weekly leadership call. Cerate your personal Web3 website with our custom-designed template!</p> </td> </tr> </table> </div> <!-- *************************** --> <!-- INTRODUCING --> <!-- *************************** --> <div style="padding: 21px;background: linear-gradient(121.07deg, #211257 5.49%, #4C1192 48.19%, #790EB4 75.74%, #8A04C5 86.22%); margin-top: 41px;text-align: center;border-top-left-radius: 20px;border-top-right-radius: 20px;"> <span style="font-family: 'Montserrat', sans-serif;font-weight: 600;font-size: 32px;line-height: 100%;color: #fff;">Meet Your DAO Initiator</span> </div> <div style="padding: 0px;background-color: #D7E0F2;"> <table width="100%" cellpadding="0" cellspacing="0" border="0" class="container"> <tr style="vertical-align: top;"> <td style="width: 50%;height: 229px;border-radius: 18px;padding: 0;"> <img src="https://tbjpbn89yx.ufs.sh/f/Wxv4gGErZaS3OolAJIi3R8uV1KW0IsPNwTtaDGCYeAX2MUZo" alt="card-1" style="max-width: 100%;width: 100%;"> </td> <td style="padding-left: 16px;padding-right: 21px;width: 50%;"> <span style="font-family: 'Montserrat', sans-serif;font-weight: 600;font-size: 17px;line-height: 26px;color: #000;display: inline-block;margin-top: 8px;">INTRODUCING</span> <h3 style="font-family: 'Montserrat', sans-serif;font-weight: 700;font-size: 24px;line-height: 27px;color: #4C1192;display: inline-block;display: block;margin: 0;margin-top: 6px;">KARA HOWARD</h3> <span style="font-family: 'Montserrat', sans-serif;font-weight: 600;font-size: 15px;line-height: 26px;color: #000;margin-top: 6px;display: inline-block;">SI<3> Ecosystem Lead</span> <p style="margin-top: 12px;margin-bottom: 0px;font-family: 'Inter', sans-serif;font-weight: 400;font-size: 13px;line-height: 21px;color: #000000B2;">Kara has been a women-in-tech community leader for twelve years, and experiences shared value as other women experience success.</p> </td> </tr> </table> </div> <!-- *************************** --> <!-- SOCIAL --> <!-- *************************** --> <div style="padding: 0px;background-color: #D7E0F2;border-bottom-left-radius: 20px;border-bottom-right-radius: 20px; margin-top: -4px;"> <table width="100%" cellpadding="0" cellspacing="0" border="0" class="container"> <tr style="vertical-align: top;"> <td style="width: 50%;height: 64px;background: linear-gradient(121.07deg, #211257 5.49%, #4C1192 48.19%, #790EB4 75.74%, #8A04C5 86.22%);text-align: center;padding: 20px;border-bottom-left-radius: 20px;"> <table cellpadding="0" cellspacing="0" border="0" class="container" style="margin-left: auto;margin-right: auto;"> <tr style="vertical-align: center"> <td><img src="https://tbjpbn89yx.ufs.sh/f/Wxv4gGErZaS3df1YHDVfxtpB6Z4RUnS7Ig8LsFNj1z20TYQy" alt="globe"></td> <td><a href="https://karahoward.siher.eth.link/" target="_blank" style="font-family: 'Inter', sans-serif;font-weight: 400;font-size: 13px;line-height: 18px;color: #fff;padding-left: 10px;">karahoward.siher.eth.link</a></td> </tr> </table> </td> <td style="width: 50%;height: 64px;background: #F1EFFC;text-align: center;padding: 20px;border-bottom-right-radius: 20px;"> <table cellpadding="0" cellspacing="0" border="0" class="container" style="margin-left: auto;margin-right: auto;"> <tr style="vertical-align:center"> <td><img src="https://tbjpbn89yx.ufs.sh/f/Wxv4gGErZaS3yKwFguzJ3pTRA5F9QbKXW4HjrEcmDoSiM2ts" alt="globe"></td> <td><a href="https://www.linkedin.com/in/decentralizing/" target="_blank" style="font-family: 'Inter', sans-serif;font-weight: 400;font-size: 13px;line-height: 18px;color: #000;padding-left: 10px;">@decentralizing</a></td> </tr> </table> </td> </tr> </table> </div> </td> </tr> </table> <!-- *************************** --> <!-- FOOTER --> <!-- *************************** --> <table width="100%" cellpadding="0" cellspacing="0" border="0" class="container"> <tr> <td style="padding: 41px 36px 54px 36px;background: linear-gradient(121.07deg, #211257 5.49%, #4C1192 48.19%, #790EB4 75.74%, #8A04C5 86.22%);text-align: center;"> <span style="display:block;font-family: 'Inter', sans-serif;font-weight: 400;font-size: 15px;line-height: 34px;letter-spacing: 5px;text-align: center;text-transform: uppercase;color: #fff;">WE ARE GRATEFUL FOR YOU</span> <table width="100%" cellpadding="0" cellspacing="0" border="0" class="container"> <td style="width: 33.33%;"> <div style="background-color: #fff;border-radius: 12px;padding: 13px 7px;margin-top: 22px;width: 92%;"> <table cellpadding="0" cellspacing="0" border="0" class="container" style="margin-left: auto;margin-right: auto;"> <tr style="vertical-align: center"> <td><img src="https://tbjpbn89yx.ufs.sh/f/Wxv4gGErZaS3rGgMNyXaZXseojyiA417uDb3ltHEKmSkNhdv" alt="x" height="23px" width="23px"></td> <td><a href="https://x.com/si3_ecosystem" target="_blank" style="font-family: 'Inter', sans-serif;font-weight: 400;font-size: 13px;line-height: 18px;color: #141414;padding-left: 8px;">@si3_ecosystem</a></td> </tr> </table> </div> </td> <td style="width: 33.33%;"> <div style="background-color: #fff;border-radius: 12px;text-align:center;padding: 13px 7px;margin-top: 22px; width: 92%;"> <table cellpadding="0" cellspacing="0" border="0" class="container" style="margin-left: auto;margin-right: auto;"> <tr style="vertical-align: center"> <td><img src="https://tbjpbn89yx.ufs.sh/f/Wxv4gGErZaS3aIIbDeGODKWs5EFubyQqtSw4CXUfoHvBgjA3" alt="globe" height="23px" width="23px"></td> <td><a href="https://www.si3.space/" target="_blank" style="font-family: 'Inter', sans-serif;font-weight: 400;font-size: 13px;line-height: 18px;color: #141414;padding-left: 8px;">www.si3.space</a></td> </tr> </table> </div> </td> <td style="width: 33.33%;"> <div style="background-color: #fff;border-radius: 12px;padding: 13px 7px;margin-top: 22px;width: 92%;text-align: center;"> <table cellpadding="0" cellspacing="0" border="0" class="container" style="margin-left: auto;margin-right: auto;"> <tr style="vertical-align: center;"> <td><img src="https://tbjpbn89yx.ufs.sh/f/Wxv4gGErZaS3P96ByZfbc60wbBCVzD7nRyxS52mNQT1kptga" alt="linkedin" height="22px" width="22px"></td> <td><a href="https://www.linkedin.com/company/si3ecosystem/" target="_blank" style="font-family: 'Inter', sans-serif;font-weight: 400;font-size: 13px;line-height: 18px;color: #141414;padding-left: 8px;">@si3ecosystem</a></td> </tr> </table> </div> </td> </table> </td> </tr> </table> </td> </tr> </table></body></html>
  `;
};
