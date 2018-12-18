import express from "express";
import bodyParser from "body-parser";
import Blockchain from "./dev/blockchain";
import uuid from "uuid/v1";

const PORT = process.argv[2];
const URL = process.argv[3];
const app = express();
//const rp = require('request-promise');

const NODE_ADDRESS = uuid()
  .split("-")
  .join("");

const CHAIN = new Blockchain(URL);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(PORT, function() {
  console.log(`Blockchain Live.\n\nListening on port ${PORT}...`);
});
