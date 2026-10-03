import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro:
    "Shows your text in nine naming conventions at once: lower case, UPPER CASE, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, Title Case and Sentence case, each with its own copy button. It first splits the input into words at spaces, punctuation, lowercase-to-uppercase changes and the end of an acronym, so `XMLHttpRequest`, `xml_http_request` and `XML http request` all produce the same words. **Per line** mode converts each line separately, for renaming a whole list of identifiers in one go.",
  steps: [
    "Type or paste an identifier, a phrase, or a list with one item per line.",
    "Choose **Whole text** to treat the input as one name, or **Per line** to convert each line separately.",
    "Copy the case you need from the list on the right.",
  ],
  examples: [
    {
      title: "One phrase in every case",
      note: "Whole text. Acronyms written in capitals, like `ID`, are treated as ordinary words.",
      input: "user account ID",
      output:
        "lower case     user account id\nUPPER CASE     USER ACCOUNT ID\ncamelCase      userAccountId\nPascalCase     UserAccountId\nsnake_case     user_account_id\nkebab-case     user-account-id\nCONSTANT_CASE  USER_ACCOUNT_ID\nTitle Case     User Account Id\nSentence case  User account id",
    },
    {
      title: "Splitting an acronym-heavy identifier",
      note: "Whole text. The `XML` → `Http` boundary is found because an uppercase run is followed by a capitalised word.",
      input: "XMLHttpRequest",
      output: "snake_case     xml_http_request\nkebab-case     xml-http-request\nCONSTANT_CASE  XML_HTTP_REQUEST\ncamelCase      xmlHttpRequest",
    },
    {
      title: "Renaming a list of column names",
      note: "Per line · camelCase. Each line becomes its own identifier.",
      input: "first name\nlast name\nemail address",
      output: "firstName\nlastName\nemailAddress",
    },
  ],
  faq: [
    {
      question: "What's the difference between camelCase and PascalCase?",
      answer:
        "Both remove the separators and capitalise each word. camelCase keeps the first word lowercase (`userAccountId`), and PascalCase capitalises it too (`UserAccountId`). JavaScript and Java use camelCase for variables and PascalCase for classes and types; C# uses PascalCase for most public members.",
    },
    {
      question: "When should I use snake_case, kebab-case or CONSTANT_CASE?",
      answer:
        "snake_case is the convention for Python variables, Ruby and SQL columns. kebab-case is used for URLs, CSS classes and CLI flags, where underscores are awkward or hyphens are expected. CONSTANT_CASE is for constants and environment variables such as `DATABASE_URL`.",
    },
    {
      question: "Why does \"ID\" become \"Id\" in camelCase?",
      answer:
        "Once text is split into words, each word is capitalised the same way, so an acronym loses its capitals in the mixed-case styles: `userAccountId`, not `userAccountID`. Style guides disagree on this; Google's Java and TypeScript guides also prefer `Id`. If your codebase keeps acronyms uppercase, fix those words by hand after copying.",
    },
    {
      question: "What happens to accented letters and other symbols?",
      answer:
        "Word splitting only recognises the ASCII letters A–Z and the digits 0–9. Any other character — including accented letters such as `é`, and emoji — is treated as a separator and removed, so `café au lait` becomes `caf_au_lait`. Only lower case and UPPER CASE work on the text as-is, so they keep every character.",
    },
    {
      question: "How are numbers handled?",
      answer:
        "A digit sequence separated by spaces or punctuation becomes its own word, so `version 2 beta` becomes `version2Beta` in camelCase and `version_2_beta` in snake_case. Digits attached to letters stay with them: `utf8String` splits into `utf8` and `String`.",
    },
  ],
  related:
    "Renaming a key across a whole JSON document? Convert it here, then use the [Text Diff](/tools/text-diff/) to review the edited document against the original. For turning table headers into Markdown, use the [Markdown converter](/tools/markdown/).",
};
