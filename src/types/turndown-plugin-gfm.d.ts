// turndown-plugin-gfm ships no type declarations. Each export is a Turndown
// plugin: a function that receives the TurndownService and registers rules.
declare module "turndown-plugin-gfm" {
  import type TurndownService from "turndown";

  type TurndownPlugin = (service: TurndownService) => void;

  export const gfm: TurndownPlugin;
  export const tables: TurndownPlugin;
  export const strikethrough: TurndownPlugin;
  export const taskListItems: TurndownPlugin;
}
