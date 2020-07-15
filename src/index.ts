const express = require("express");
import { Liquid } from "liquidjs";
import { PORT } from "./config/constants";

const app = express();
const title: String = "Splisher";

app.use(express.json());

// Setup liquid and views
const engine = new Liquid({
	root: __dirname,
	extname: ".liquid",
});
app.engine("liquid", engine.express());
app.set("views", ["./views", "./templates"]);
app.set("view engine", "liquid");

app.get("/", (req, res) => {
	res.render("index", {
		title,
	});
});

app.listen(PORT, (): void => {
	console.log(`Server is listening on ${PORT}`);
});
