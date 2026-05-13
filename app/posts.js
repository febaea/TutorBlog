const express = require("express");
const router = express.Router();
const multer = require('multer')
const path = require("path");

const db = require('./db');


//multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },

    filename: (req, file, cb) => {
        const safeName =
            Date.now() +
            path.extname(file.originalname);
        cb(null, safeName);
    }
});

//allow PDFs only
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);

    } else {
        cb(new Error('Only PDFs allowed'), false);
    }
};

//multer upload middleware
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter
});


function requireAuth(req, res, next) {
    //TEMP
    req.user = { id: 5 };
    // if (!req.user) {
    //     return res.status(401).send('Unauthorized');
    // }
    next();
}


router.post("/make-post", upload.single("upload"), async (req, res) =>{

    try{

        //REMOVE LATER
        // const userId = 1;
        //const userId = req.user.id;
        const {title, content} = req.body;

        if (!title || !content) {
            return res.status(400).send("Missing field.");
        }

        if (title.length > 255) {
            return res.status(400).send("Title too long.");
        }

        const pdfPath = req.file ? req.file.filename : null;

        // prevents sql injection
        await db.query(

            ` INSERT INTO posts (author_id, title, content, featured_image_url, created_at) 
            VALUES ($1, $2, $3, $4, NOW())`,
            //[req.user.id, title, content, pdfPath]
            //TEMP
            [5, title, content, pdfPath]

        );

        res.status(201).send('Post successfully shared.');

    }
    catch (error) {
        console.error(error);
        res.status(500).send("Post failed to share.");
    
    }
});

router.get("/my-posts", requireAuth, async (req, res) => {

    //check logged in
    if (!req.user) {
        return res.status(401).json({
            error: "Unauthorised"
        });
    }

    try {
        const result = await db.query(
            `SELECT id, title, content, created_at
            FROM posts
            WHERE author_id = $1
            ORDER BY created_at DESC
            `,
            //[req.user.id]
            //TEMP
            [5]
        );
        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to load posts"
        });
    }
});

router.post('/api/delete-post', async (req, res) => {
    //example logged-in user
    const userId = req.user.id;
    const { postId } = req.body;

    try {
        //verify ownership in SQL
        const result = await db.query(
            `DELETE FROM posts
            WHERE id = $1
            AND author_id = $2`,
            [postId, userId]
        );

        //nothing deleted
        if (result.rowCount === 0) {
            return res.status(403).json({
                error: 'Unauthorized'
            });
        }

        res.json({
            success: true
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Delete failed'
        });
    }
});

router.post('/api/edit-post', async (req, res) => {
    const userId = req.user.id;
    const {
        postId,
        title,
        content
    } = req.body;

    //validation
    if (!title || !content) {
        return res.status(400).json({
            error: 'Missing fields'
        });
    }

    try {
        const result = await db.query(
            `UPDATE posts
            SET
                title = $1,
                content = $2
            WHERE
                id = $3
            AND
                author_id = $4`,
            [
                title,
                content,
                postId,
                userId
            ]
        );

        //if no matching post is found
        if (result.rowCount === 0) {
            return res.status(403).json({
                error: 'Unauthorized'
            });
        }

        res.json({
            success: true
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Edit failed'
        });
    }
});


module.exports = router;


