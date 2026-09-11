export function shouldGreet({
  items,
  comments,
  author,
  currentNumber,
  isPullRequest,
  greetingPrefix,
}) {
  const hasEarlierItem = items.some((item) => {
    const itemIsPullRequest = Boolean(item.pull_request);
    return (
      item.number < currentNumber &&
      item.user?.login === author &&
      itemIsPullRequest === isPullRequest
    );
  });
  if (hasEarlierItem) {
    return false;
  }

  return !comments.some(
    (comment) =>
      comment.user?.login === "github-actions[bot]" &&
      String(comment.body ?? "").startsWith(greetingPrefix),
  );
}

export async function greetFirstInteraction({
  github,
  context,
  issueMessage,
  pullRequestMessage,
}) {
  const current = context.payload.pull_request ?? context.payload.issue;
  if (!current) {
    throw new Error("Expected an issue or pull request payload");
  }

  const { owner, repo } = context.repo;
  const author = current.user?.login;
  if (!author) {
    throw new Error("Opened item has no author login");
  }

  const isPullRequest = Boolean(context.payload.pull_request);
  const message = isPullRequest ? pullRequestMessage : issueMessage;
  const greetingPrefix = message.split("\n", 1)[0];

  const [items, comments] = await Promise.all([
    github.paginate(github.rest.issues.listForRepo, {
      owner,
      repo,
      state: "all",
      per_page: 100,
    }),
    github.paginate(github.rest.issues.listComments, {
      owner,
      repo,
      issue_number: current.number,
      per_page: 100,
    }),
  ]);

  if (
    !shouldGreet({
      items,
      comments,
      author,
      currentNumber: current.number,
      isPullRequest,
      greetingPrefix,
    })
  ) {
    return;
  }

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: current.number,
    body: message,
  });
}
