require("dotenv").config();

const moment = require("moment");
const today = moment(new Date()).format("MM/DD/YYYY");

const AirtableApi = require("./src/Airtable");
const HelperApi = require("./src/Helpers");

const Airtable = new AirtableApi(process.env.AIRTABLE_API_KEY);
const _ = new HelperApi();

const emailOutreach = require("./src/emailOutreach");

exports.emailCampaignSubdomain = async (req, res) => {
    try {
        const campaigns = await Airtable.getCampaigns("Email - HL subdomain");
        let accounts = _.accountsToRun(campaigns);

        const arrayEmailOutreach = accounts.map((account) => emailOutreach(account));

        const results = await Promise.all(arrayEmailOutreach);

        for (let result of results) {
            await Airtable.updateCampaign(result.recordID, {
                "Campaign Status": result.status,
                "Last Updated": today,
            });
        }

        res.status(200).send(results);
    } catch (error) {
        console.log("emailCampaignSubdomain()", error);
        res.status(500).send(error);
    }
};
