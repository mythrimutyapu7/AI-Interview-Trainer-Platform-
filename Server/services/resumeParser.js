const { PDFParse } = require("pdf-parse");

/**
 * Extract text from uploaded resume PDF
 * @param {Buffer} pdfBuffer
 * @returns {Promise<string>}
 */
async function parseResume(pdfBuffer) {
    try {

        const parser = new PDFParse({
            data: pdfBuffer
        });

        const parsed = await parser.getText();

        return parsed.text.trim();

    } catch (error) {

        console.error("Resume Parsing Error:", error);

        throw new Error("Unable to parse resume.");

    }
}

module.exports = {
    parseResume
};