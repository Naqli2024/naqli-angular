const mongoose = require("mongoose");

const connectDb = async () => { 
  try {
    await mongoose
      .connect(
         `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.1iah8uf.mongodb.net/${process.env.DATABASE_NAME}?retryWrites=true&w=majority&appName=Cluster0`
      )
      .then(() => console.log("Database Connected"));
  } catch (error) {
    console.log("Error: Database Connection Failed", error);
  }
};

module.exports = connectDb;