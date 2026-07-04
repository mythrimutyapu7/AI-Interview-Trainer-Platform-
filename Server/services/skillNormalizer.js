const skillAliases = {

    "react.js": "react",
    "reactjs": "react",
    "react": "react",

    "node": "node.js",
    "nodejs": "node.js",
    "node.js": "node.js",

    "express": "express",
    "express.js": "express",
    "expressjs": "express",

    "mongodb": "mongodb",

    "rest api": "rest api",
    "rest apis": "rest api",
    "restful api": "rest api",
    "restful apis": "rest api",

    "git": "git",

    "aws": "aws",

    "docker": "docker",

    "langchain": "langchain",

    "python": "python",

    "java": "java",

    "c++": "c++",

    "c": "c"

};

function normalizeSkill(skill){

    const cleaned = skill
        .trim()
        .toLowerCase();

    return skillAliases[cleaned] || cleaned;

}

function normalizeSkills(skills){

    return skills.map(normalizeSkill);

}

module.exports = {

    normalizeSkill,

    normalizeSkills

};