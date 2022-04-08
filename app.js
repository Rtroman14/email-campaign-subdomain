const { emailCampaignHlSubdomain } = require("./index");

(async () => {
    try {
        const res = await emailCampaignHlSubdomain();

        console.log(res);
    } catch (error) {
        console.log(error);
    }
})();
