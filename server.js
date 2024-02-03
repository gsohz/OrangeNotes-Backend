const express = require("express");
require("dotenv").config();
const cors = require("cors");
const user = require("./routes/user");
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const app = express();
app.use(express.json());

const whitelist = process.env.WHITELISTED_DOMAINS
  ? process.env.WHITELISTED_DOMAINS.split(",")
  : [];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
connectDB();

app.use("/", user);

app.use(errorHandler);
app.use(notFound);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server está online na porta ${port}: http://localhost:3001`);
});
