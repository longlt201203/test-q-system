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
    sumDt: 0,
  },
  hi: {
    nReq: 0,
    nRes: 0,
    sumDt: 0,
  },
};
let t = 1;
// let timestamp = performance.now();

function analyze(key) {
  // const now = performance.now();
  // t = (now - timestamp) / 1000;
  // timestamp = now;
  console.log("name", "fReq", "fRes", "delay");
  data[key].fReq = targetTmpData[key].nReq / t;
  data[key].fRes = targetTmpData[key].nRes / t;
  data[key].delay = targetTmpData[key].sumDt / targetTmpData[key].nRes;

  targetTmpData[key].nReq = 0;
  targetTmpData[key].nRes = 0;
  targetTmpData[key].sumDt = 0;

  console.log(key, data[key].fReq, data[key].fRes, data[key].delay);
}

setInterval(() => {
  Object.keys(targetMap).forEach(analyze);
}, 1000);

const dynamicProxy = (req, res, next) => {
  const { targetName } = req.params;
  if (!targetMap[targetName])
    return res.status(404).send("No matching route found");

  if (data[targetName].fReq > data[targetName].fReqMax) {
    console.log("Max capacity reached!");
    const pos = queue[targetName].arr.length + 1;
    const est = data[targetName].delay * pos;
    const id = ++queue[targetName].currentId;
    queue[targetName].arr.push({ id, req });
    return res.send({ id, pos, est });
  }

  let prev = performance.now();

  const proxy = createProxyMiddleware({
    target: targetMap[targetName],
    changeOrigin: true,
    pathRewrite: (path) => path.replace(`/q/${targetName}`, ""),
    on: {
      proxyReq: (proxyReq, req, res) => {
        const { targetName } = req.params;
        targetTmpData[targetName].nReq++;
      },
      proxyRes: (proxyRes, req, res) => {
        const { targetName } = req.params;
        targetTmpData[targetName].nRes++;
        let dt = performance.now() - prev;
        targetTmpData[targetName].sumDt += dt / 1000;
      },
    },
  });

  proxy(req, res, next);
};

// Use the dynamic proxy middleware
app.use("/q/:targetName", dynamicProxy);

const PASS = false;
const resumeProxy = (req, res, next) => {
  const { targetName, id } = req.params;
  if (!targetMap[targetName])
    return res.status(404).send("No matching route found");

  const index = queue[targetName].arr.findIndex((x) => x.id == id);
  if (index < 0) {
    return res.status(404).send("Request not found");
  }

  const item = queue[targetName].arr[index];

  if (!PASS || data[targetName].fReq > data[targetName].fReqMax) {
    const pos = index + 1;
    const est = data[targetName].delay * pos;
    const id = item.id;
    return res.send({ id, pos, est });
  }

  let prev = performance.now();
  const proxy = createProxyMiddleware({
    target: targetMap[targetName],
    changeOrigin: true,
    pathRewrite: (path) => path.replace(`/resume/${targetName}/${id}`, ""),
    on: {
      proxyReq: (proxyReq, req, res) => {
        const { targetName } = req.params;
        targetTmpData[targetName].nReq++;
      },
      proxyRes: (proxyRes, req, res) => {
        const { targetName } = req.params;
        targetTmpData[targetName].nRes++;
        let dt = performance.now() - prev;
        targetTmpData[targetName].sumDt += dt / 1000;
        queue[targetName].arr.splice(index, 1);
      },
    },
  });

  proxy(item.req, res, next);
};

app.use("/resume/:targetName/:id", resumeProxy);

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Queue API Server is running on http://localhost:${PORT}`);
});
