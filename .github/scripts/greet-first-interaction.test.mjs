import assert from "node:assert/strict";
import test from "node:test";

import { shouldGreet } from "./greet-first-interaction.mjs";

const prefix = "Thanks for your first pull request to Sotto, and welcome.";
const item = (number, login, isPullRequest) => ({
  number,
  user: { login },
  ...(isPullRequest ? { pull_request: {} } : {}),
});

test("greets the author's first pull request", () => {
  assert.equal(
    shouldGreet({
      items: [item(10, "alice", true), item(4, "bob", true)],
      comments: [],
      author: "alice",
      currentNumber: 10,
      isPullRequest: true,
      greetingPrefix: prefix,
    }),
    true,
  );
});

test("does not greet a returning pull request author", () => {
  assert.equal(
    shouldGreet({
      items: [item(3, "alice", true), item(10, "alice", true)],
      comments: [],
      author: "alice",
      currentNumber: 10,
      isPullRequest: true,
      greetingPrefix: prefix,
    }),
    false,
  );
});

test("issue history does not suppress the first pull request", () => {
  assert.equal(
    shouldGreet({
      items: [item(2, "alice", false), item(10, "alice", true)],
      comments: [],
      author: "alice",
      currentNumber: 10,
      isPullRequest: true,
      greetingPrefix: prefix,
    }),
    true,
  );
});

test("later items and other authors do not affect eligibility", () => {
  assert.equal(
    shouldGreet({
      items: [
        item(11, "alice", true),
        item(3, "bob", true),
        item(10, "alice", true),
      ],
      comments: [],
      author: "alice",
      currentNumber: 10,
      isPullRequest: true,
      greetingPrefix: prefix,
    }),
    true,
  );
});

test("an existing workflow greeting makes reruns idempotent", () => {
  assert.equal(
    shouldGreet({
      items: [item(10, "alice", true)],
      comments: [
        {
          user: { login: "github-actions[bot]" },
          body: `${prefix}\n\nTwo things that trip up newcomers:`,
        },
      ],
      author: "alice",
      currentNumber: 10,
      isPullRequest: true,
      greetingPrefix: prefix,
    }),
    false,
  );
});
