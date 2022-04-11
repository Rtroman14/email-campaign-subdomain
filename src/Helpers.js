const moment = require("moment");
const today = moment(new Date()).format("YYYY-MM-DD");

module.exports = class HelperApi {
    async minutesWait(minutes) {
        return await new Promise((resolve) => {
            setTimeout(resolve, 60000 * minutes);
        });
    }

    activeCampaigns(campaigns) {
        return campaigns.filter((campaign) => {
            if (
                "Campaign Status" in campaign &&
                "Base ID" in campaign &&
                "API Token" in campaign &&
                "Campaign ID" in campaign
            ) {
                if (
                    campaign["Campaign Status"] === "Live" ||
                    campaign["Campaign Status"] === "Need More Contacts"
                ) {
                    return campaign;
                }
            }
        });
    }

    campaignsDueToday(campaigns) {
        return campaigns.filter((campaign) => {
            if (!("Last Updated" in campaign)) {
                return campaign;
            }

            if ("Last Updated" in campaign && moment(campaign["Last Updated"]).isBefore(today)) {
                return campaign;
            }
        });
    }

    campaignsToRun(campaigns) {
        let emailCampaigns = [];

        campaigns.forEach((campaign) => {
            // check if client is in emailCampaigns
            const isClientPresent = emailCampaigns.some(
                (newCampaign) => newCampaign.Client === campaign.Client
            );

            if ("Type" in campaign && campaign.Type === "Specific") {
                return emailCampaigns.push(campaign);
            }

            // check if multiple same clients exist in campaigns
            const clientCampaigns = campaigns.filter((obj) => {
                if (!("Type" in obj)) {
                    return obj.Client === campaign.Client;
                }
            });

            if (clientCampaigns.length > 1 && !isClientPresent) {
                let clientAdded = false;

                clientCampaigns.some((obj) => {
                    if (!("Last Updated" in obj)) {
                        clientAdded = true;
                        return emailCampaigns.push(obj);
                    }
                });

                const [nextCampaign] = clientCampaigns.sort(
                    (a, b) => new Date(a["Last Updated"]) - new Date(b["Last Updated"])
                );

                !clientAdded && emailCampaigns.push(nextCampaign);
            }

            if (clientCampaigns.length === 1) {
                emailCampaigns.push(campaign);
            }
        });

        return emailCampaigns;
    }

    mapContact(contacts) {
        return contacts.map((contact) => {
            return {
                emailAddress: contact.email_first || contact.Email,
                fullName: contact.first_name || contact["First Name"],
                fields: {
                    city: contact.city || contact.City || "",
                    company:
                        contact.company_name || contact["Company Name"] || contact.Company || "",
                    "First Line": contact["First Line"] || contact["FIRST LINE"] || "",
                    job: contact.job_title || contact.Job || "",
                    "First Name": contact.first_name || contact["First Name"],
                    "Last Name": contact.last_name || contact["Last Name"],
                    "LinkedIn Page": contact.url || contact["LinkedIn Page"] || "",
                    recordID: contact.recordID,
                },
            };
        });
    }

    sortByKeyString(array, key) {
        return array.sort((a, b) => (a[key] > b[key] ? 1 : b[key] > a[key] ? -1 : 0));
    }

    accountsToRun(campaigns) {
        let accounts = [];

        let activeCampaigns = this.activeCampaigns(campaigns);
        let todayCampaigns = this.campaignsDueToday(activeCampaigns);

        todayCampaigns = todayCampaigns.sort(
            (a, b) => new Date(a["Last Updated"]) - new Date(b["Last Updated"])
        );

        for (let todayCampaign of todayCampaigns) {
            if (!("Last Updated" in todayCampaign)) {
                accounts.push(todayCampaign);
            }
        }

        let accountNames = [...new Set(todayCampaigns.map((el) => el.Account))];

        for (let accountName of accountNames) {
            const foundAccount = todayCampaigns.find((el) => el.Account === accountName);

            const accountInAccounts = accounts.find((el) => el.Account === accountName);

            if (!accountInAccounts) {
                accounts.push(foundAccount);
            }
        }

        accounts = this.sortByKeyString(accounts, "Account");

        return accounts;
    }

    sortSubdomainGroups(accounts, accountSubdomains) {
        let accountSubdomainGroups = [];

        for (let subdomain of accountSubdomains) {
            const accountsBySubdomain = accounts
                .filter((acc) => acc.Subdomain === subdomain)
                .sort((a, b) => new Date(a["Last Updated"]) - new Date(b["Last Updated"]));

            accountSubdomainGroups.push(accountsBySubdomain);
        }

        return accountSubdomainGroups.sort(
            (a, b) =>
                new Date(a[a.length - 1]["Last Updated"]) -
                new Date(b[b.length - 1]["Last Updated"])
        );
    }

    subdomainRanToday(sortedSubdomainGroups) {
        const mostRecentCampaign = sortedSubdomainGroups[0].pop();

        const isToday = moment(0, "HH").diff(mostRecentCampaign["Last Updated"], "days") == 0;

        return isToday;
    }

    test(campaigns) {
        let activeCampaigns = this.activeCampaigns(campaigns);

        let allAccounts = activeCampaigns.map((account) => account.Account);
        allAccounts = [...new Set(allAccounts)];

        let campaignsByAccount = [];

        for (let account of allAccounts) {
            const accounts = activeCampaigns.filter((campaign) => campaign.Account === account);

            // group by "Subdomain" - [ [{}], [{}], ... ]
            let accountSubdomains = accounts.map((campaign) => campaign.Subdomain);
            accountSubdomains = [...new Set(accountSubdomains)];

            let sortedSubdomainGroups = this.sortSubdomainGroups(accounts, accountSubdomains);

            let subdomainRanToday = false;
            if (sortedSubdomainGroups.length === 1) {
                subdomainRanToday = this.subdomainRanToday(sortedSubdomainGroups);
            }

            if (!subdomainRanToday) {
                campaignsByAccount.push(sortedSubdomainGroups[0][0]);
            }
        }

        return campaignsByAccount;
    }
};
