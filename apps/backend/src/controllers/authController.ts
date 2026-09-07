import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { User } from "../models/index.js";
import { badRequest, unauthorized } from "../utils/httpError.js";
import { signToken } from "../utils/jwt.js";
import { loginSchema, registerSchema } from "../validators/auth.js";

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);

  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw badRequest("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  const token = signToken(user._id.toString());
  res.status(201).json({ token, user });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);

  const user = await User.findOne({ email: input.email });
  if (!user) {
    throw unauthorized("Invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw unauthorized("Invalid email or password");
  }

  const token = signToken(user._id.toString());
  res.json({ token, user });
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) {
    throw unauthorized();
  }
  res.json(user);
}

// Look up registered users by name or email, so an owner can link an existing
// account to a tenant record. Returns a small capped list; empty query -> [].
export async function searchUsers(req: Request, res: Response) {
  const q = String(req.query.q ?? "").trim();
  if (q.length < 2) {
    res.json([]);
    return;
  }
  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const users = await User.find({ $or: [{ name: rx }, { email: rx }] })
    .select("name email")
    .limit(10);
  res.json(users);
}
