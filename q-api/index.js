const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const data = require("./data");
const queue = require("./queue");

const app = express();

const targetMap = {
  hello: "http://localhost:3000/api",
  hi: "http://localhost:3001/api",
};

const targetTmpData = {
  hello: {
    nReq: 0,
    nRes: 0,
  },
  hi: {
    nReq: 0,
    nRes: 0,
  },
};
let t = 0;
let timestamp = performance.now();

function analyze(key) {
  const now = performance.now();
  t = (now - timestamp) / 1000;
  timestamp = now;
  console.log("name", "fReq", "fRes", "delay");
  data[key].fReq = targetTmpData[key].nReq / t;
  data[key].fRes = targetTmpData[key].nRes / t;
  if (data[key].fReq > data[key].fRes) {
    data[key].delay =
      (targetTmpData[key].nReq - targetTmpData[key].nRes) / data[key].fReq;
  }

  targetTmpData[key].nReq = 0;
  targetTmpData[key].nRes = 0;

  console.log(key, data[key].fReq, data[key].fRes, data[key].delay);
}

const dynamicProxy = (req, res, next) => {
  // Define routing logic
  const { targetName } = req.params;
  targetTmpData[targetName].nReq++;
  analyze(targetName);

  if (data[targetName].fReq > data[targetName].fReqMax) {
    console.log("Max capacity reached!");
    const pos = queue[targetName].length + 1;
    const est = data[targetName].delay * pos;
    queue[targetName].push(req);
    return res.send({ pos, est });
  }

  if (!targetMap[targetName])
    return res.status(404).send("No matching route found");

  // Create and use proxy middleware dynamically
  const proxy = createProxyMiddleware({
    target: targetMap[targetName],
    changeOrigin: true,
    pathRewrite: (path) => path.replace(`/q/${targetName}`, ""),
    on: {
      proxyRes: (proxyRes, req, res) => {
        const { targetName } = req.params;
        targetTmpData[targetName].nRes++;
      },
    },
  });

  proxy(req, res, next);
};

// Use the dynamic proxy middleware
app.use("/q/:targetName", dynamicProxy);

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Queue API Server is running on http://localhost:${PORT}`);
});
