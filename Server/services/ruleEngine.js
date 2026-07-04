/**
 * Extract skills from Job Description
 * 
 */
const {
    normalizeSkills
} = require("./skillNormalizer");
function extractSkillsFromJD(jobDescription) {

    const commonSkills = [

        "Java",
        "Python",
        "C",
        "C++",
        "JavaScript",
        "TypeScript",

        "React",
        "Angular",
        "Vue",

        "Node.js",
        "Express",

        "MongoDB",
        "MySQL",
        "PostgreSQL",

        "Docker",
        "Kubernetes",

        "AWS",
        "Azure",
        "GCP",

        "Git",

        "REST API",
        "GraphQL",

        "Spring Boot",

        "FastAPI",

        "Flask",

        "Machine Learning",

        "LLM",

        "LangChain",

        "RAG"

    ];

    const jd = jobDescription.toLowerCase();

    return commonSkills.filter(skill =>
        jd.includes(skill.toLowerCase())
    );

}

/**
 * Compare Resume Skills with JD Skills
 */

function compareSkills(resumeSkills, jdSkills) {

    const matched = [];
    const missing = [];
    const extra = [];

    // Normalize both arrays
    const normalizedResume = normalizeSkills(resumeSkills);
    const normalizedJD = normalizeSkills(jdSkills);

    // Check matched & missing
    normalizedJD.forEach((skill, index) => {

        if (normalizedResume.includes(skill)) {
            matched.push(jdSkills[index]);
        } else {
            missing.push(jdSkills[index]);
        }

    });

    // Check extra
    normalizedResume.forEach((skill, index) => {

        if (!normalizedJD.includes(skill)) {
            extra.push(resumeSkills[index]);
        }

    });

    const percentage =
        normalizedJD.length === 0
            ? 100
            : Math.round((matched.length / normalizedJD.length) * 100);

    return {
        matched,
        missing,
        extra,
        percentage
    };
}
module.exports = {
    extractSkillsFromJD,
    compareSkills
};