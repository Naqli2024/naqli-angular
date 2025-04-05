const express = require("express");
const app = express();
const env = require("dotenv");
const connectDb = require("./config/config");
const cors = require("cors");
const path = require("path");
const http = require("http");
const userRoutes = require("./routes/userRoute");
const insertDataRoutes = require("./routes/insertDataRoute");
const getInsertedUnitsRoutes = require("./routes/getInsertedUnitsRoutes");
const bookingRoutes = require("./routes/bookingRoute");
const paymentRoute = require("./routes/paymentRoute");
const partnerRoute = require("./routes/partnerRoute");
const operatorRoute = require("./routes/operatorRoute");
const adminRoute = require("./routes/adminRoute");
const reportRoute = require("./routes/reportRoute");
const fileRoute = require("./routes/fileRoutes");
const createPayment = require("./routes/createPaymentRoute");
const estimate = require("./routes/estimateRoute");
const driverLocationRoute = require("./routes/driverLocationRoute");
const driverOtpRoute = require("./routes/driverTripRoutes");

//environment variables
env.config();

//Database
connectDb();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
// Middleware to set Content-Length header
app.use((req, res, next) => {
  if (req.headers["content-length"]) {
    res.setHeader("Content-Length", req.headers["content-length"]);
  }
  next();
});

//CORS configuration
app.use(
  cors({
    origin: ["https://naqlee.com"], // Allow only your frontend's domain
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true, // Include cookies if needed
  })
);

app.use("/api", userRoutes);
app.use("/api", insertDataRoutes);
app.use("/api", getInsertedUnitsRoutes);
app.use("/api", bookingRoutes);
app.use("/api", paymentRoute);
app.use("/api/partner", partnerRoute);
app.use("/api/partner", operatorRoute);
app.use("/api/admin", adminRoute);
app.use("/api/report", reportRoute);
app.use("/api", fileRoute);
app.use("/api", createPayment);
// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", estimate);
app.use("/api", driverLocationRoute);
app.use("/api", driverOtpRoute);

// Use HTTP/1.1 server instead of HTTP/2
const server = http.createServer(app);

server.listen(process.env.PORT, "0.0.0.0", () =>
  console.log(
    `Server running on http://0.0.0.0:${process.env.PORT} with HTTP/1.1`
  )
);

