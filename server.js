const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;

// Use environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || "studenthustle_dev_secret_change_later";

// IMPORTANT: in production, we'll set MONGO_URI in Render
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://racosconstantin_db_user:g7ibGjLw0z3cjMSZ@studenthustle01.ozxm4ir.mongodb.net/?appName=Studenthustle01";
// -----------------------------------------

// 2. Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

// 3. Task Schema & Model
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  budget: Number,
  category: String,
  city: String,
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
});

const Task = mongoose.model("Task", taskSchema);

// Application schema & model
const applicationSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  applicantName: String,
  message: String,
  offerBudget: Number,
  createdAt: { type: Date, default: Date.now },
});

const Application = mongoose.model("Application", applicationSchema);

// NEW: User schema & model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

function createToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 3a. Register new user
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email and password are required." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
    });

    const savedUser = await user.save();
    const token = createToken(savedUser);

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
      },
    });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// 3b. Login user
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const token = createToken(user);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Error logging in user:", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

// 4. Get all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// 5. Create a task
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description, budget, category, city, createdBy } = req.body;

    if (!title || !budget) {
      return res.status(400).json({ error: "Title and budget are required." });
    }

    const task = new Task({
      title,
      description: description || "",
      budget: Number(budget),
      category: category || "general",
      city: city || "",
      createdBy: createdBy || "Anonymous",
    });

    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// 5b. Create an application for a task
app.post("/api/tasks/:taskId/applications", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { applicantName, message, offerBudget } = req.body;

    if (!applicantName || !message) {
      return res
        .status(400)
        .json({ error: "Name and message are required to apply." });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    const application = new Application({
      taskId,
      applicantName,
      message,
      offerBudget: offerBudget ? Number(offerBudget) : undefined,
    });

    const savedApp = await application.save();
    res.status(201).json(savedApp);
  } catch (err) {
    console.error("Error creating application:", err);
    res.status(500).json({ error: "Failed to create application" });
  }
});

// 5c. Get applications for a task
app.get("/api/tasks/:taskId/applications", async (req, res) => {
  try {
    const { taskId } = req.params;
    const apps = await Application.find({ taskId }).sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// 5d. Get all applications (optional filter by applicantName)
app.get("/api/applications", async (req, res) => {
  try {
    const { applicantName } = req.query;

    const filter = {};
    if (applicantName) {
      filter.applicantName = applicantName;
    }

    const apps = await Application.find(filter).sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// 6. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 7. Start the server
app.listen(PORT, () => {
  console.log(`Student Hustle running on http://localhost:${PORT}`);
});