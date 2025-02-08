import { Router, Request, Response } from "express";
import prisma from "../config/prismaClient";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const router = Router();
const SECRET_KEY = process.env.JWT_SECRET || "s3cret";

// Signup Route
router.post("/signup", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ msg: "All fields are required" });
        }
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            return res.status(400).json({ msg: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: { email, password: hashedPassword },
        });

        res.json({ msg: "User has been created successfully" });
    } catch (error) {
        res.status(500).json({ msg: "Internal Server Error", error: error instanceof Error ? error.message : String(error) });
    }
});

// Signin Route
router.post("/signin", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ msg: "All fields are required" });
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ msg: "Invalid email or password" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid email or password" });
        }
        const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, { expiresIn: "1h" });
        res.json({ msg: "Signin successful", token });
    } catch (error) {
        res.status(500).json({ msg: "Internal Server Error", error: error instanceof Error ? error.message : String(error) });
    }
});

export default router;
