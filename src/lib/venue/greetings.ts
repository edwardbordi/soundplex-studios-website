/**
 * Welcome-back lines for the demo login (Ed, 2026-10-11). One is picked at random each time,
 * never the same as last time. {name} is the visitor's first name.
 */
export const GREETINGS = [
  "Welcome back, {name}. The kettle's on.",
  "Hey {name}, good to see you again.",
  "{name}! The rooms missed you.",
  "Look who it is. Hi, {name}.",
  "Welcome back, {name}. Your usual corner is free.",
  "Evening, {name}. Something good is on tonight.",
  "{name}, you're back. Let's make something.",
  "Hi {name}. The amps are warm.",
  "Good to have you, {name}. Pull up a chair.",
  "Welcome home, {name}.",
  "{name}! Perfect timing.",
  "Back again, {name}? We like that about you.",
];

const KEY = "sp-greeting";

export function greet(name: string): string {
  let last = -1;
  try {
    last = Number(localStorage.getItem(KEY) ?? -1);
  } catch {}
  let i = Math.floor(Math.random() * GREETINGS.length);
  if (i === last) i = (i + 1) % GREETINGS.length;
  try {
    localStorage.setItem(KEY, String(i));
  } catch {}
  return GREETINGS[i].replaceAll("{name}", name);
}
