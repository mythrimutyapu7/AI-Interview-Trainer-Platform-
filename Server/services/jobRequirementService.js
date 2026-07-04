const {
    extractJobRequirements
} = require("../utils/openaiService");

async function buildJobRequirements(jobDescription){

    return await extractJobRequirements(jobDescription);

}

module.exports = {

    buildJobRequirements

};