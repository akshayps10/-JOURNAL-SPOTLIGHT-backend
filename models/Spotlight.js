const mongoose = require("mongoose");


const ArticleSchema = new mongoose.Schema({
  title: String,
  description: String, 
  imageData: Buffer,
  imageType: String,
  createdAt: { type: Date, default: Date.now },
});


const SpotlightSchema = new mongoose.Schema({
  name: String, 
  email: String,
  password: String,
  articles: [ArticleSchema], 
});

const SpotlightModel = mongoose.model("Spotlight", SpotlightSchema);

module.exports = SpotlightModel;
