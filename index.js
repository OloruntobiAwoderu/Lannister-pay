import express, { json } from "express";
import routes from "./routes";
import { redisClient } from "./db";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(json());
app.use(routes);
app.use("/", (req, res) => {
	return res.status(200).json("Hello World");
});

app.use((req, res, next) => next({ status: 404, customMessage: "Not Found" }));

app.use((err, req, res, next) => {
	res.status(err.status || 500).json({
		Error:
			err.customMessage ||
			"Error while processing request. It's not you, it's us",
	});
});

const port = process.env.PORT;
redisClient.connect();

app.listen(port, () => {
	console.log(`RUNNING on ${port}`);
});
