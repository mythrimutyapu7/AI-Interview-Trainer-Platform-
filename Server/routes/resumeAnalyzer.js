const { parseResume } = require("../services/resumeParser");
const express = require("express");
const multer = require("multer");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

router.post(
    "/analyze",
    upload.single("resume"),
    async (req, res) => {

        try {

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Resume not uploaded"
                });
            }

            const { role, jobDescription } = req.body;

            const resumeText = await parseResume(req.file.buffer);

            res.json({

                success: true,

                role,

                jobDescription,

                resumeText

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success:false,

                message:error.message

            });

        }

    }
);

module.exports = router;