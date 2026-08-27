import { z } from "zod";

export const nicknameSchema = z
  .string()
  .trim()
  .min(2, "Use at least 2 characters.")
  .max(24, "Keep your name under 25 characters.")
  .regex(/^[\p{L}\p{N} ._'’-]+$/u, "Use letters, numbers, spaces, or basic punctuation.");

export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z2-9]{6}$/, "Enter the 6-character room code.");

export const createRoomSchema = z.object({ hostName: nicknameSchema });
export const joinRoomSchema = z.object({
  code: roomCodeSchema,
  nickname: nicknameSchema,
});
