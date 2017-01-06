import { Reaction } from "/server/api";

export function registerThemeComponents() {
  Reaction.registerTheme(Assets.getText("themes/core-ui/button.css"));
}
