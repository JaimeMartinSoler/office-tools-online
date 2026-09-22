import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro:
    "Generates random passwords from 4 to 128 characters, drawing from lowercase letters, uppercase letters, digits and 24 symbols (`!@#$%^&*()-_=+[]{};:,.?/`). You can require a minimum count from each character set and leave out look-alike characters (`I l 1 O 0 o`). A strength line estimates the entropy in bits and the number of possible passwords for the current settings. Randomness comes from `crypto.getRandomValues` with rejection sampling, so no character is more likely than another.",
  steps: [
    "Set the **Length** (16 by default).",
    "Toggle the character sets you want. Optionally raise the **Min** count for any set your password policy requires.",
    "Choose **No look-alikes** if the password will be read aloud or typed by hand.",
    "Check the strength line, click **Regenerate** until you like the result, then copy it.",
  ],
  examples: [
    {
      title: "The default settings",
      note: "Length 16, all four sets on, one of each required. The pool is 26 + 26 + 10 + 24 = 86 characters. The password is one possible result; every run is different.",
      input: "Length 16 · lowercase, uppercase, digits, special",
      output:
        "@8?U+ga6_73_6dkU\n\nExcellent — about 103 bits of entropy, roughly 8.95 × 10^30 possible character combinations.",
    },
    {
      title: "Easy to type: lowercase and digits, no look-alikes",
      note: "Removing `l`, `o`, `1` and `0` leaves a 32-character pool, so each character adds exactly 5 bits: 12 × 5 = 60.",
      input: "Length 12 · lowercase, digits (min 2) · No look-alikes",
      output: "244c6urmz52g\n\nStrong — about 60 bits of entropy, roughly 1.15 × 10^18 possible character combinations.",
    },
    {
      title: "Why a 6-digit PIN is weak",
      note: "10^6 combinations is about 20 bits, which is the range the meter labels Weak (under 40 bits).",
      input: "Length 6 · digits only",
      output: "Weak — about 20 bits of entropy, roughly 1.00 × 10^6 possible character combinations.",
    },
  ],
  faq: [
    {
      question: "How is the strength estimated?",
      answer:
        "Entropy is length × log2(pool size), where the pool is every character the current settings allow. It is labelled Weak under 40 bits, Fair under 60, Strong under 80, and Excellent at 80 or more. This estimate is only valid for passwords generated randomly, as they are here. It overstates the strength of a password a human made up.",
    },
    {
      question: "How long should my password be?",
      answer:
        "For a password stored in a password manager, 16 characters from all four sets (about 103 bits) is far beyond any brute-force attack. If you have to type it or remember it, a longer password from fewer sets can be just as strong: 20 lowercase letters is about 94 bits. Length adds strength faster than extra character sets do.",
    },
    {
      question: "Why does a minimum count sometimes cause an error?",
      answer:
        "The minimums are placed first and the remaining characters are drawn from the combined pool. If the minimums add up to more than the length — say four of each set in an 8-character password — no valid password exists, so the tool explains the conflict instead of quietly ignoring a rule. The guaranteed characters are then shuffled, so they don't always appear at the start.",
    },
    {
      question: "Why exclude look-alike characters?",
      answer:
        "`I`, `l` and `1`, and `O`, `0` and `o`, are easy to confuse in many fonts. Removing them helps when a password is printed, dictated, or typed from a phone screen. It shrinks the pool slightly, so add a character or two of length to make up for it.",
    },
    {
      question: "Is the generated password sent or stored anywhere?",
      answer:
        "No. It is created by your browser's cryptographic random number generator and exists only on this page until you copy it or leave. Nothing is saved, and the site has no server that could receive it.",
    },
  ],
  related:
    "To store a password rather than just create one, hash it with bcrypt or Argon2id in the [Hash Generator](/tools/hash-generator/). For random identifiers instead of secrets, the [UUID & ULID Generator](/tools/uuid-ulid-generator/) uses the same Web Crypto source.",
};
