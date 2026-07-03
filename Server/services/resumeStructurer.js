const { structureResume } = require("../utils/openaiService");

/**
 * Convert raw resume text into structured JSON
 * @param {string} resumeText
 * @returns {Promise<Object>}
 */
async function buildResumeProfile(resumeText) {

    try {

        const structuredResume = await structureResume(resumeText);

        return structuredResume;

    } catch (error) {

        console.error("Resume Structurer Error:", error);

        throw new Error("Failed to structure resume.");

    }

}

module.exports = {
    buildResumeProfile
};