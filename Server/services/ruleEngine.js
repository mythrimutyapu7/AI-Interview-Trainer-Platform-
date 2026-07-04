/**
 * Extract skills from Job Description
 */
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

function compareSkills(resumeSkills, jdSkills){

    const matched = [];

    const missing = [];

    const extra = [];

    const resume = resumeSkills.map(s=>s.toLowerCase());

    const jd = jdSkills.map(s=>s.toLowerCase());

    jdSkills.forEach(skill=>{

        if(resume.includes(skill.toLowerCase())){

            matched.push(skill);

        }else{

            missing.push(skill);

        }

    });

    resumeSkills.forEach(skill=>{

        if(!jd.includes(skill.toLowerCase())){

            extra.push(skill);

        }

    });

    const percentage =
        jdSkills.length===0
            ?100
            :Math.round(
                (matched.length/jdSkills.length)*100
            );

    return{

        matched,

        missing,

        extra,

        percentage

    };

}

module.exports={

    extractSkillsFromJD,

    compareSkills

};