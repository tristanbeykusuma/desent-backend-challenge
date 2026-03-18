const express = require("express");
const app = express();
app.use(express.json());

// store books in memory
let books = [];
let nextId = 1;

// just a static token
const SECRET_TOKEN = "desent-secret-token";

function authMiddleware(req, res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || token !== SECRET_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// health check
app.get("/ping", (req, res) => {
  res.json({ success: true });
});

// send back whatever we receive
app.post("/echo", (req, res) => {
  res.json(req.body);
});

// return a token for any valid username/password
app.post("/auth/token", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username and password required" });
  }
  res.json({ token: SECRET_TOKEN });
});

// create a book
app.post("/books", (req, res) => {
  const { title, author, year } = req.body || {};

  if (!title || !author) {
    return res.status(400).json({ error: "title and author are required" });
  }

  const book = { id: nextId++, title, author, year: year || null };
  books.push(book);
  res.status(201).json(book);
});

// get all books, supports ?author= and ?page=&limit=
app.get("/books", (req, res) => {
  let result = [...books];

  if (req.query.author) {
    const q = req.query.author.toLowerCase();
    result = result.filter((b) => b.author.toLowerCase().includes(q));
  }

  if (req.query.page || req.query.limit) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const start = (page - 1) * limit;
    result = result.slice(start, start + limit);
  }

  res.json(result);
});

// get a single book by id
app.get("/books/:id", (req, res) => {
  const book = books.find((b) => b.id === parseInt(req.params.id));
  if (!book) {
    return res.status(404).json({ error: "Book not found" });
  }
  res.json(book);
});

// update title and/or author
app.put("/books/:id", (req, res) => {
  const idx = books.findIndex((b) => b.id === parseInt(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: "Book not found" });
  }
  const { title, author, year } = req.body || {};
  if (title) books[idx].title = title;
  if (author) books[idx].author = author;
  if (year) books[idx].year = year;
  res.json(books[idx]);
});

// remove a book
app.delete("/books/:id", (req, res) => {
  const idx = books.findIndex((b) => b.id === parseInt(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: "Book not found" });
  }
  books.splice(idx, 1);
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
