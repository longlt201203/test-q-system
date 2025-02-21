const queue = {
  hello: {
    arr: [],
    currentId: 0,
  },
  target: {
    currentId: 0,
    arr: [],
  },
};

setInterval(() => {
  queue.hello.arr.shift();
}, 2000);

module.exports = queue;
