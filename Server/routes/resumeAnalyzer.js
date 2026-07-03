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

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Resume not uploaded"
            });
        }

        const { role, jobDescription } = req.body;

        res.json({
            success: true,
            filename: req.file.originalname,
            role,
            jobDescription,
            size: req.file.size
        });

    }
);

module.exports = router;