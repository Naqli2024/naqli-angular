const mongoose = require("mongoose");

const connectDb = async () => {
  const connectionString = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@10.0.2.28:27017/${process.env.DATABASE_NAME}?authSource=admin`;
  
  try {
    await mongoose.connect(connectionString);
    console.log("Database Connected");
  } catch (error) {
    console.log("Error: Database Connection Failed", error);
  }
};

module.exports = connectDb;