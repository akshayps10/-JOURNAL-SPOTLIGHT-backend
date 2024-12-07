const multer = require("multer");
const path = require("path");
const fs = require("fs");
const express = require("express");
const app = express();

//  uploads directory exists
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Multer 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR); 
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Middleware  error handling
const handleError = (res, error) => {
  console.error(error.message);
  return res.status(500).json({ error: "Internal server error" });
};

// Add Article Route with Image
app.post("/add-article", authenticateToken, upload.single("image"), async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: "Title and description are required." });
  }

  try {
    const user = await SpotlightModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newArticle = {
      title,
      description,
      image: req.file ? `/uploads/${req.file.filename}` : null,
    };
    
    user.articles.push(newArticle);
    await user.save();

    res.status(201).json({ message: "Article added successfully", article: newArticle });
  } catch (err) {
    handleError(res, err);
  }
});

// Get  Articles 
app.get("/articles", async (req, res) => {
  try {
    const users = await SpotlightModel.find({}, "articles");
    const articles = users.flatMap(user => user.articles); 
    res.status(200).json(articles);
  } catch (err) {
    handleError(res, err);
  }
});

// Serve Uploaded
app.use("/uploads", express.static(UPLOADS_DIR));