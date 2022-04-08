const { emailCampaignSubdomain } = require("./index");

(async () => {
    try {
        const res = await emailCampaignSubdomain();

        console.log(res);
    } catch (error) {
        console.log(error);
    }
})();
