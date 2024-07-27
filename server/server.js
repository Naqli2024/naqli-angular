const express = require("express");
const app = express();
const env = require("dotenv");
const connectDb = require("./config/config");
const cors = require("cors");
const userRoutes = require("./routes/userRoute");
const insertDataRoutes = require("./routes/insertDataRoute");
const getInsertedUnitsRoutes = require("./routes/getInsertedUnitsRoutes");
const bookingRoutes = require("./routes/bookingRoute");
const paymentRoute = require("./routes/paymentRoute");
const partnerRoute = require("./routes/partnerRoute");
const operatorRoute = require("./routes/operatorRoute");
const adminRoute = require("./routes/adminRoute");
const reportRoute = require("./routes/reportRoute");

//environment variables
env.config();

//Database
connectDb();

app.use(express.json());
app.use(cors());
app.use("/api", userRoutes);
app.use("/api", insertDataRoutes);
app.use("/api", getInsertedUnitsRoutes);
app.use("/api", bookingRoutes);
app.use("/api", paymentRoute);
app.use("/api/partner", partnerRoute);
app.use("/api/partner", operatorRoute);
app.use("/api/admin", adminRoute);
app.use("/api/report", reportRoute);

app.listen(process.env.PORT, () =>
  console.log(`Server is connected at port ${process.env.PORT}`)
);
