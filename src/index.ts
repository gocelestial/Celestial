import express from "express";
import { PORT } from "./config/constants";

const app = express();

app.use(express.json());

// Testing
app.get("/", (req, res) => {
    res.send("Hello world!");
});

app.listen(PORT, (): void => {
    console.log(`Server is listening on ${PORT}`);
});
