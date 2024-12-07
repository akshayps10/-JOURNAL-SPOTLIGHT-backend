const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { authenticateToken } = require("./middleware/middleware");
const SpotlightModel = require("./models/Spotlight");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();


require("dotenv").config();

const JWT_SECRET = "key123";


app.use(express.json());
app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });


app.use("/uploads", express.static(path.join(__dirname, "uploads"))); 

// MongoDB Connection
mongoose
.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Login Route
app.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await SpotlightModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No record found" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "The password is incorrect" });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
    return res.status(200).json({ status: "success", message: "Login successful", token });
  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Register Route
app.post("/sign-up", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const existingUser = await SpotlightModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists." });
    }

    const newUser = new SpotlightModel(req.body);
    await newUser.save();
    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    console.error("Error during registration:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Dashboard Route
app.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const user = await SpotlightModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Welcome to your dashboard!", user });
  } catch (err) {
    console.error("Error fetching dashboard data:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add Article Route
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
    console.error("Error adding article:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.delete("/delete-article/:articleId", authenticateToken, async (req, res) => {
  const { articleId } = req.params;

  try {
    const user = await SpotlightModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const article = user.articles.id(articleId); 
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

   
    if (article.image) {
      const imagePath = path.join(__dirname, article.image);
      fs.unlinkSync(imagePath); 
    }

    user.articles.pull(articleId);
    await user.save();

    res.status(200).json({ message: "Article deleted successfully" });
  } catch (err) {
    console.error("Error deleting article:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.put("/update-article/:articleId", authenticateToken, upload.single("image"), async (req, res) => {
  const { title, description } = req.body;
  const { articleId } = req.params;

  if (!title || !description) {
    return res.status(400).json({ message: "Title and description are required." });
  }

  try {
    const user = await SpotlightModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const article = user.articles.id(articleId); 
    if (!article) return res.status(404).json({ message: "Article not found" });

    
    if (req.file) {
      const oldImagePath = path.join(__dirname, 'uploads', article.image.split('/').pop());
      try {
        fs.unlinkSync(oldImagePath);
      } catch (error) {
        console.error("Error deleting old image:", error.message);
      }

      
      article.image = `/uploads/${req.file.filename}`;
    }

    
    article.title = title;
    article.description = description;

    await user.save();

    res.status(200).json({ message: "Article updated successfully", article });
  } catch (err) {
    handleError(res, err);
  }
});


app.get("/articles", async (req, res) => {
  try {
   
    const users = await SpotlightModel.find().select("articles").lean(); 
    const articles = users.flatMap(user => user.articles); 

    if (!articles || articles.length === 0) {
      return res.status(404).json({ message: "No articles found." });
    }

    res.status(200).json(articles); 
  } catch (err) {
    console.error("Error fetching articles:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}!`);
});
