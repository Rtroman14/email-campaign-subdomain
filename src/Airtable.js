const Airtable = require("airtable");

module.exports = class AirtableApi {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error("Using Airtable requires an API key.");
        }

        this.apiKey = apiKey;
    }

    async assignAirtable(baseID) {
        try {
            return new Airtable({ apiKey: this.apiKey }).base(baseID);
        } catch (error) {
            console.log("NO API KEY PROVIDED ---", error);
        }
    }

    async getCampaign(baseID, view = "Alternate") {
        try {
            const base = await this.assignAirtable(baseID);

            const res = await base("Campaigns")
                .select({ maxRecords: view === "Alternate" ? 1 : 5, view })
                .firstPage();

            return res.map((record) => ({
                recordID: record.getId(),
                name: record.fields.Campaign,
                id: record.fields.campaignID,
                tag: record.fields.Tag || "",
            }));
        } catch (error) {
            console.log("ERROR GETCAMPAIGN() ---", error);
        }
    }

    async getCampaigns(view) {
        try {
            const base = await this.assignAirtable("appGB7S9Wknu6MiQb");

            const res = await base("Campaigns").select({ view }).all();

            const campaigns = res.map((campaign) => {
                return {
                    ...campaign.fields,
                    recordID: campaign.getId(),
                };
            });

            return campaigns;
        } catch (error) {
            console.log("ERROR GETCAMPAIGNS() ---", error);
        }
    }

    async updateCampaign(recordID, updatedFields) {
        try {
            const base = await this.assignAirtable("appGB7S9Wknu6MiQb");

            await base("Campaigns").update(recordID, updatedFields);
        } catch (error) {
            console.log("ERROR UPDATECAMPAIGN() ---", error);
        }
    }

    async getContact(baseID, recordID) {
        try {
            const base = await this.assignAirtable(baseID);

            return await (
                await base("Prospects").find(recordID)
            ).fields;
        } catch (error) {
            console.log("ERROR GETCONTACT() ---", error);
        }
    }

    async getContacts(baseID, view) {
        try {
            const base = await this.assignAirtable(baseID);

            const res = await base("Prospects")
                .select({
                    maxRecords: 5,
                    view,
                })
                .firstPage();

            const contacts = res.map((contact) => ({
                ...contact.fields,
                recordID: contact.getId(),
            }));

            return contacts.length > 0 ? contacts : false;
        } catch (error) {
            console.log("ERROR GETCONTACTS() ---", error);
            return false;
        }
    }

    async updateContact(baseID, recordID, updatedFields) {
        try {
            const base = await this.assignAirtable(baseID);

            await base("Prospects").update(recordID, updatedFields);
        } catch (error) {
            console.log("ERROR UPDATECONTACTS() ---", error);
        }
    }

    async hasProspects(baseID, view) {
        try {
            const base = await this.assignAirtable(baseID);

            const res = await base("Prospects")
                .select({
                    maxRecords: 10,
                    view,
                })
                .all();

            const contacts = res.map((contact) => ({
                ...contact.fields,
                recordID: contact.getId(),
            }));

            return contacts.length > 0 ? true : false;
        } catch (error) {
            console.log("ERROR NEEDMORECONTACTS() ---", error);
        }
    }
};
