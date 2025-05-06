const express = require("express");
const cors = require("cors");
const axios = require("axios");
const secureCookie = require("./services/index");
const cookieParser = require("cookie-parser");
const { verifyAccessToken } = require("./middleware/index");
require("dotenv").config();

const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(cookieParser());

app.get("/", async (req, res) => {
  return res.send(`<h1>Welcome to OAuth server!</h1>`);
});

app.get("/user/profile/github", verifyAccessToken, async (req, res) => {
  console.log("Reached /user/profile/github route");
  try {
    const { access_token } = req.cookies;
    const githubUserResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    res.json({ user: githubUserResponse.data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/user/profile/google", verifyAccessToken, async (req, res) => {
  try {
    const { access_token } = req.cookies;
    const googleUserResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    res.json({ user: googleUserResponse.data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/auth/github", async (req, res) => {
  const gtihubAuthURL = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user,repo,security_events`;
  res.redirect(gtihubAuthURL);
});

app.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json.send("Authorization code not provided");
  }
  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: "application/json" },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // res.cookie("access_token", accessToken);
    secureCookie(res, accessToken);
    return res.redirect(`${process.env.FRONTEND_URL}/v2/profile/github`);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

//google oauth
app.get("/auth/google", (req, res) => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:${PORT}/auth/google/callback&response_type=code&scope=profile email`;

  res.redirect(googleAuthUrl);
});

app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json.send("Authorization code not provided");
  }

  let accessToken;

  try {
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `http://localhost:${PORT}/auth/google/callback`,
      },
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    accessToken = tokenResponse.data.access_token;
    // res.cookie("access_token", accessToken);
    secureCookie(res, accessToken);
    return res.redirect(`${process.env.FRONTEND_URL}/v2/profile/google`);
  } catch (error) {
    console.error(error);
  }
});

app.listen(PORT, () => {
  console.log("server is listening to port 4000");
});
