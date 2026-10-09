import express from "express";
import errorsHandler from "./middlewares/errors/errorsHandler";
import notFoundError from "./middlewares/errors/notFoundError";
import normalizeBody from "./middlewares/normalizeBody";
import mainRouter from "./routers";

// Security middlewares grab
const morgan = require("morgan");
const cors = require("cors");
const { default: helmet } = require("helmet");

const app = express(); // Server creation

// Main server middleware chain
app.use(cors());
app.use(morgan("dev"));
app.use(helmet());
app.use(express.json());
app.use(normalizeBody);

app.use(mainRouter); // Main router is outr root router

// Error handiling middlewares
app.use(notFoundError);
app.use(errorsHandler);

export default app;
