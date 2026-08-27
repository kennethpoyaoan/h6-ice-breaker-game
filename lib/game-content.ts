import { randomInt } from "node:crypto";

export type EmojiPrompt = {
  prompt: string;
  answer: string;
  accepted: string[];
  category: "Everyday" | "Work" | "Food" | "Movies & stories" | "Sayings";
};

export const EMOJI_ROUND_COUNT = 10;

export const emojiPrompts: EmojiPrompt[] = [
  { prompt: "☕ 🌅", answer: "Morning coffee", accepted: ["morning coffee", "coffee in the morning"], category: "Everyday" },
  { prompt: "🌧️ ☂️", answer: "Rainy day", accepted: ["rainy day", "raining", "rain"], category: "Everyday" },
  { prompt: "⏰ 🛌 😴", answer: "Overslept", accepted: ["overslept", "sleeping late", "late for work", "snooze"], category: "Everyday" },
  { prompt: "🔑 🤔 🏠", answer: "Lost keys", accepted: ["lost keys", "missing keys", "forgot my keys"], category: "Everyday" },
  { prompt: "📱 🔋 0️⃣", answer: "Dead battery", accepted: ["dead battery", "low battery", "phone died", "no battery"], category: "Everyday" },
  { prompt: "🚗 🚦 🛑", answer: "Traffic jam", accepted: ["traffic jam", "traffic", "stuck in traffic"], category: "Everyday" },
  { prompt: "✈️ 🏝️ 📵", answer: "Vacation mode", accepted: ["vacation", "vacation mode", "holiday", "on vacation"], category: "Everyday" },
  { prompt: "🏠 👔 🩳", answer: "Work from home", accepted: ["work from home", "working from home", "remote work", "wfh"], category: "Work" },
  { prompt: "📅 📞 👥", answer: "Team meeting", accepted: ["team meeting", "meeting", "conference call", "group meeting"], category: "Work" },
  { prompt: "📧 🔥 🧯", answer: "Urgent email", accepted: ["urgent email", "email emergency", "email crisis", "important email"], category: "Work" },
  { prompt: "🧠 ⛈️ 💡", answer: "Brainstorm", accepted: ["brainstorm", "brainstorming", "brain storm", "idea storm"], category: "Work" },
  { prompt: "⏰ 📋 ✅", answer: "Meet the deadline", accepted: ["meet the deadline", "deadline", "finish on time", "on time"], category: "Work" },
  { prompt: "💻 ❄️ 😱", answer: "Computer froze", accepted: ["computer froze", "frozen computer", "computer crashed", "laptop froze"], category: "Work" },
  { prompt: "🎤 🚫 🔊", answer: "You are on mute", accepted: ["you are on mute", "on mute", "muted", "microphone muted"], category: "Work" },
  { prompt: "🍕 🚚 🏠", answer: "Pizza delivery", accepted: ["pizza delivery", "delivering pizza", "order pizza"], category: "Food" },
  { prompt: "🍳 🥓 🍞", answer: "Breakfast", accepted: ["breakfast", "morning meal", "full breakfast"], category: "Food" },
  { prompt: "🍔 🍟 🥤", answer: "Fast food", accepted: ["fast food", "burger meal", "combo meal", "burger and fries"], category: "Food" },
  { prompt: "🍿 🎬", answer: "Movie night", accepted: ["movie night", "watching a movie", "cinema", "movies"], category: "Everyday" },
  { prompt: "🎂 🕯️ 🎉", answer: "Birthday party", accepted: ["birthday party", "birthday", "happy birthday"], category: "Everyday" },
  { prompt: "🎁 🎄 🎅", answer: "Christmas", accepted: ["christmas", "christmas day", "holiday season"], category: "Everyday" },
  { prompt: "❤️ 👁️", answer: "Love at first sight", accepted: ["love at first sight", "first sight love"], category: "Sayings" },
  { prompt: "🐘 🏠", answer: "Elephant in the room", accepted: ["elephant in the room", "the elephant in the room"], category: "Sayings" },
  { prompt: "💡 👆 🧠", answer: "Bright idea", accepted: ["bright idea", "good idea", "great idea", "idea"], category: "Sayings" },
  { prompt: "📖 🪱", answer: "Bookworm", accepted: ["bookworm", "book worm", "reader", "love reading"], category: "Sayings" },
  { prompt: "🧊 💔", answer: "Break the ice", accepted: ["break the ice", "breaking the ice", "ice breaker", "icebreaker"], category: "Sayings" },
  { prompt: "🌙 🦉", answer: "Night owl", accepted: ["night owl", "late night person", "staying up late"], category: "Sayings" },
  { prompt: "🐦 🐦 🪨", answer: "Two birds one stone", accepted: ["two birds one stone", "two birds with one stone"], category: "Sayings" },
  { prompt: "👠 👸 🎃", answer: "Cinderella", accepted: ["cinderella"], category: "Movies & stories" },
  { prompt: "🦁 👑", answer: "The Lion King", accepted: ["the lion king", "lion king"], category: "Movies & stories" },
  { prompt: "🧙‍♂️ 💍 🌋", answer: "The Lord of the Rings", accepted: ["the lord of the rings", "lord of the rings", "lotr"], category: "Movies & stories" },
  { prompt: "🧊 👸 ⛄", answer: "Frozen", accepted: ["frozen", "disney frozen"], category: "Movies & stories" },
  { prompt: "👻 🔫", answer: "Ghostbusters", accepted: ["ghostbusters", "ghost busters"], category: "Movies & stories" },
  { prompt: "🕷️ 👨", answer: "Spider-Man", accepted: ["spider-man", "spiderman", "spider man"], category: "Movies & stories" },
  { prompt: "🐼 🥋", answer: "Kung Fu Panda", accepted: ["kung fu panda", "kungfu panda"], category: "Movies & stories" },
  { prompt: "🚢 🧊 💔", answer: "Titanic", accepted: ["titanic", "the titanic"], category: "Movies & stories" },
  { prompt: "⏰ 😤 🛏️", answer: "Morning alarm", accepted: ["morning alarm", "alarm clock", "wake up alarm"], category: "Everyday" },
  { prompt: "🛒 🥦 💳", answer: "Grocery shopping", accepted: ["grocery shopping", "groceries", "food shopping"], category: "Everyday" },
  { prompt: "🐕 🦮 🌳", answer: "Walking the dog", accepted: ["walking the dog", "dog walk", "walk the dog"], category: "Everyday" },
  { prompt: "🌅 🚶 🧡", answer: "Sunset walk", accepted: ["sunset walk", "evening walk", "walk at sunset"], category: "Everyday" },
  { prompt: "📅 😰 ⏳", answer: "Deadline crunch", accepted: ["deadline crunch", "deadline", "crunch time"], category: "Work" },
  { prompt: "🤝 🏗️ 🎯", answer: "Team building", accepted: ["team building", "teamwork", "team build"], category: "Work" },
  { prompt: "☕ 🕐 😌", answer: "Coffee break", accepted: ["coffee break", "tea break", "break time"], category: "Work" },
  { prompt: "🍦 🍨 🍧", answer: "Ice cream", accepted: ["ice cream", "icecream"], category: "Food" },
  { prompt: "🍣 🥢 🍱", answer: "Sushi dinner", accepted: ["sushi dinner", "sushi", "japanese food"], category: "Food" },
  { prompt: "🎂 🕯️ 🎈", answer: "Birthday cake", accepted: ["birthday cake", "birthday"], category: "Food" },
  { prompt: "🍰 ✌️ 😋", answer: "Piece of cake", accepted: ["piece of cake", "easy piece"], category: "Sayings" },
  { prompt: "🔨 💥 🎯", answer: "Hit the nail", accepted: ["hit the nail", "hit the nail on the head"], category: "Sayings" },
  { prompt: "⏰ 🪽 💨", answer: "Time flies", accepted: ["time flies", "time flys"], category: "Sayings" },
];

export function normalizeAnswer(value: string) {
  return value.toLowerCase().trim().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ");
}

export function answerPattern(answer: string) {
  return answer.split(" ").map((word) => `${word[0]}${"_".repeat(Math.max(0, word.length - 1))}`).join(" ");
}

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const saved = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = saved;
    }
  }
  return row[b.length];
}

export function isAcceptedAnswer(guess: string, accepted: string[]) {
  const normalized = normalizeAnswer(guess);
  return accepted.some((candidate) => {
    const target = normalizeAnswer(candidate);
    return normalized === target || (target.length >= 6 && editDistance(normalized, target) <= 1);
  });
}

export function pickRandomPrompt(excludedPrompts: string[] = []) {
  const available = emojiPrompts.filter((item) => !excludedPrompts.includes(item.prompt));
  return available[randomInt(available.length)];
}

export function getPromptClue(prompt: string) {
  const item = emojiPrompts.find((candidate) => candidate.prompt === prompt);
  return item ? { category: item.category, pattern: answerPattern(item.answer) } : { category: "Everyday", pattern: "Mystery phrase" };
}
