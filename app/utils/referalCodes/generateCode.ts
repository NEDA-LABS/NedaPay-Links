import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const BASE     = ALPHABET.length; // 32
const LENGTH   = 8;               // shard(1) + counter(5) + checksum(1) + spare(1)

function toBase32(num: number, len: number): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out = ALPHABET[num % BASE] + out;
    num  = Math.floor(num / BASE);
  }
  return out;
}

function checksum(str: string): string {
  const sum = str.split('').reduce((a, c) => a + ALPHABET.indexOf(c), 0);
  return ALPHABET[sum % BASE];
}

export async function generateReferralCode(): Promise<string> {
  // 1. pick a random shard (0-31)
  const shardIndex = Math.floor(Math.random() * BASE);
  const shardChar  = ALPHABET[shardIndex];

  // 2. atomically bump counter for that shard
  const counterRow = await prisma.counter.update({
    where: { shard: shardChar },
    data : { nextVal: { increment: 1 } },
    select: { nextVal: true },
  });

  const counter = counterRow.nextVal;

  // 3. build code
  const middle = toBase32(counter, 5);        // 5-char counter
  const partial = shardChar + middle;
  const chk     = checksum(partial);
  const code    = (partial + chk).slice(0, LENGTH); // 8 chars

  // 4. uniqueness guaranteed by DB unique index (influencerProfile.customCode)
  return code;
}