app.post("/add-article", authenticateToken, upload.single("image"), async (req, res) => {
    try {
      const user = await SpotlightModel.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const newArticle = {
        title: req.body.title,
        description: req.body.description,
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
  
  app.put('/update-article/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;
  
    try {
      const updateData = { title, description };
      if (image) updateData.image = image;
  
      const article = await Article.findByIdAndUpdate(id, updateData, { new: true });
      if (!article) return res.status(404).send({ message: 'Article not found' });
  
      res.send({ article });
    } catch (error) {
      res.status(500).send({ error: 'Error updating article' });
    }
  });
  