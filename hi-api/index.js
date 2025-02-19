const express = require("express");
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// In-memory storage for categories
let categories = [
  { id: 1, name: "Electronics" },
  { id: 2, name: "Home Appliances" },
];

/* ===============================
          CATEGORY APIs
=============================== */

// Get all categories
app.get("/api/categories", (req, res) => {
  res.json(categories);
});

// Get a category by ID
app.get("/api/categories/:id", (req, res) => {
  const category = categories.find((c) => c.id === parseInt(req.params.id));
  if (!category) return res.status(404).send("Category not found");
  res.json(category);
});

// Create a new category
app.post("/api/categories", (req, res) => {
  const newCategory = {
    id: categories.length + 1,
    name: req.body.name,
  };
  categories.push(newCategory);
  res.status(201).json(newCategory);
});

// Update a category by ID
app.put("/api/categories/:id", (req, res) => {
  const category = categories.find((c) => c.id === parseInt(req.params.id));
  if (!category) return res.status(404).send("Category not found");

  category.name = req.body.name;
  res.json(category);
});

// Delete a category by ID
app.delete("/api/categories/:id", (req, res) => {
  const categoryIndex = categories.findIndex(
    (c) => c.id === parseInt(req.params.id)
  );
  if (categoryIndex === -1) return res.status(404).send("Category not found");

  categories.splice(categoryIndex, 1);
  res.status(204).send();
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Category API Server is running on http://localhost:${PORT}`);
});
