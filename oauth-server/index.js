const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const PORT = process.env.PORT || 4000;
const app = express();

app.use(express.json());
app.use(cors());

app.get("/", async (req, res) => {
  return res.send(`<h1>Welcome to OAuth server!</h1>`);
});

app.get("/auth/gtihub", async (req, res) => {
  const gtihubAuthURL = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user,repo,security_events`;
  res.redirect(gtihubAuthURL);
});

app.get("/auth/github/callback");
