#!/usr/bin/env tsx
/**
 * สร้าง admin user คนแรกสำหรับระบบ
 * Usage: tsx scripts/create-admin.ts [username] [password] [name]
 * Example: tsx scripts/create-admin.ts admin admin1234 "ผู้ดูแลระบบ"
 */

import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as readline from "readline";

function generateSalt(): string {
  return randomBytes(16).toString("hex");
}

function hashPassword(password: string, salt: string): string {
  return createHash("sha256").update(salt + password).digest("hex");
}

function createPasswordHash(password: string): string {
  const salt = generateSalt();
  return `${salt}:${hashPassword(password, salt)}`;
}

async function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    if (hidden) {
      process.stdout.write(question);
      process.stdin.setRawMode?.(true);
      let input = "";
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", function handler(ch) {
        const c = ch.toString();
        if (c === "\n" || c === "\r" || c === "\u0003") {
          process.stdin.setRawMode?.(false);
          process.stdin.removeListener("data", handler);
          process.stdout.write("\n");
          rl.close();
          resolve(input);
        } else if (c === "\u007f") {
          input = input.slice(0, -1);
        } else {
          input += c;
        }
      });
    } else {
      rl.question(question, answer => { rl.close(); resolve(answer); });
    }
  });
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL is not set in environment");
    process.exit(1);
  }

  const db = drizzle(dbUrl);

  // รับค่าจาก args หรือ prompt
  let username = process.argv[2];
  let password = process.argv[3];
  let name = process.argv[4];

  if (!username) username = await prompt("Username: ");
  if (!password) password = await prompt("Password: ", true);
  if (!name) name = await prompt("Full name: ");

  if (!username || !password || !name) {
    console.error("❌ กรุณากรอกข้อมูลให้ครบ");
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
    process.exit(1);
  }

  // ตรวจสอบว่า username ซ้ำหรือไม่
  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing.length > 0) {
    console.error(`❌ Username "${username}" มีอยู่แล้วในระบบ`);
    process.exit(1);
  }

  const passwordHash = createPasswordHash(password);
  const openId = `local_${username}_${Date.now()}`;

  await db.insert(users).values({
    openId,
    username,
    passwordHash,
    name,
    role: "admin",
    daRole: "admin",
    isActive: true,
    lastSignedIn: new Date(),
  });

  console.log(`✅ สร้าง admin user สำเร็จ`);
  console.log(`   Username : ${username}`);
  console.log(`   Name     : ${name}`);
  console.log(`   Role     : admin`);
  process.exit(0);
}

main().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
