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
