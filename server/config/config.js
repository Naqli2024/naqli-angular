const mongoose = require("mongoose");
require("dotenv").config();

const connectDb = async () => {
  // Use the correct MongoDB connection string format for your MongoDB Atlas instance.
  const connectionString = `mongodb://${process.env.MONGO_USERNAME}:${encodeURIComponent(process.env.MONGO_PASSWORD)}@10.0.2.28:27017/${process.env.DATABASE_NAME}?authSource=admin&useNewUrlParser=true&useUnifiedTopology=true`;

  try {
    await mongoose.connect(connectionString);
    console.log("Database Connected");
  } catch (error) {
    console.log("Error: Database Connection Failed", error);
  }
};

module.exports = connectDb;