const express = require("express");
const app = express();

async function wait() {
  return new Promise((resolve) => setTimeout(resolve, 200));
}

// Middleware to parse JSON requests
app.use(express.json());

// In-memory product storage
let products = [
  { id: 1, name: "Laptop", price: 1200 },
  { id: 2, name: "Smartphone", price: 800 },
  { id: 3, name: "Headphones", price: 150 },
];

// Get all products
app.get("/api/products", async (req, res) => {
  await wait();
  console.log(req);
  res.json(products);
});

// Get a product by ID
app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).send("Product not found");
  res.json(product);
});

// Create a new product
app.post("/api/products", (req, res) => {
  const newProduct = {
    id: products.length + 1,
    name: req.body.name,
    price: req.body.price,
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Update a product by ID
app.put("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).send("Product not found");

  product.name = req.body.name;
  product.price = req.body.price;
  res.json(product);
});

// Delete a product by ID
app.delete("/api/products/:id", (req, res) => {
  const productIndex = products.findIndex(
    (p) => p.id === parseInt(req.params.id)
  );
  if (productIndex === -1) return res.status(404).send("Product not found");

  products.splice(productIndex, 1);
  res.status(204).send();
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Fake Product API Server is running on http://localhost:${PORT}`);
});
