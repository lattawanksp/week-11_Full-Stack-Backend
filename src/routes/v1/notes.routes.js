import { Router } from "express";

export const router = Router();

const notes = [
  {
    id: "1",
    title: "Learn Express",
    content: "Practice routing and CRUD in Express.",
  },
  {
    id: "2",
    title: "Review REST API",
    content: "Test GET POST PUT DELETE with REST Client.",
  },
];

router.get("/", (req, res) => {
  res.json(notes);
});

router.post("/", (req, res) => {
  const { title, content } = req.body || {};

  if (!title || !content) {
    return res.status(400).json({ error: "title and content are required" });
  }

  const nextId = String(
    (notes.reduce((max, note) => Math.max(max, Number(note.id)), 0) || 0) + 1,
  );

  const newNote = { id: nextId, title, content };

  notes.push(newNote);
  return res.status(201).json(newNote);
});

router.put("/:id", (req, res) => {
  const note = notes.find((n) => n.id === req.params.id);

  if (!note) {
    return res.status(404).json({ error: "Note not found!" });
  }

  const { title, content } = req.body || {};

  if (!title || !content) {
    return res.status(400).json({ error: "title and content are required!" });
  }

  note.title = title;
  note.content = content;

  return res.status(200).json(note);
});

router.delete("/:id", (req, res) => {
  const noteIndex = notes.findIndex((n) => n.id === req.params.id);

  if (noteIndex === -1) {
    return res.status(404).json({ error: "Note not found!" });
  }

  const deletedNote = notes.splice(noteIndex, 1)[0];

  return res.status(200).json({
    message: "Delete note successfully!",
    note: deletedNote,
  });
});
