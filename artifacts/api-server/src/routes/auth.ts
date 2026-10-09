import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../middlewares/auth.js";
import { RegisterUserBody, LoginUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

// POST /auth/register
router.post("/auth/register", async (req, res) => {
  try {
    const parsed = RegisterUserBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const { name, email, password } = parsed.data;

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(usersTable)
      .values({ name, email, passwordHash, role: "user" })
      .returning();

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Error registering user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const parsed = LoginUserBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const { email, password } = parsed.data;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Error logging in");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting current user");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
