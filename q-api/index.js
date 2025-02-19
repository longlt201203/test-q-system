const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

const targetMap = {
  hello: "http://localhost:3000/api",
  hi: "http://localhost:3001/api",
};

const dynamicProxy = (req, res, next) => {
  // Define routing logic
  const { targetName } = req.params;

  if (!targetMap[targetName])
    return res.status(404).send("No matching route found");

  // Create and use proxy middleware dynamically
  const proxy = createProxyMiddleware({
    target: targetMap[targetName],
    changeOrigin: true,
    pathRewrite: (path) => path.replace(`/q/${targetName}`, ""),
  });

  proxy(req, res, next);
};

// Use the dynamic proxy middleware
app.use("/q/:targetName", dynamicProxy);

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Queue API Server is running on http://localhost:${PORT}`);
});
