const mongoose = require("mongoose");

const connectDb = async () => {
  const connectionString = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@10.0.2.28:27017/${process.env.DATABASE_NAME}?authSource=admin`;

  try {
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // increase timeout to 30 seconds
      socketTimeoutMS: 45000, // socket timeout
      maxPoolSize: 10, // Correct pool size setting
    });
    console.log("Database Connected");
  } catch (error) {
    console.log("Error: Database Connection Failed", error);
  }
};

module.exports = connectDb;