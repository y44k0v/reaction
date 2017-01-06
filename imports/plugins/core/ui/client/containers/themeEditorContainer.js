import { Meteor } from "meteor/meteor";
import { Router } from "/client/modules/router";
import { composeWithTracker } from "/lib/api/compose";
// import { Alerts } from "../components";
import { i18next } from "/client/api";
import { default as ReactionAlerts } from "/imports/plugins/core/layout/client/templates/layout/alerts/inlineAlerts";
import { Themes } from "/lib/collections";


export function publishTheme(event, theme) {
  Meteor.call("ui/publishTheme", theme, (error) => {
    if (error) {
      const alertDescription = i18next.t("reactionUI.publishThemeError", {
        defaultValue: `Couldn't publish theme ${theme.name}`,
        themeName: theme.name
      });
      Alerts.toast(alertDescription, "error");
    }
  });
}

export function handleEditComponent(event, componentName) {
  Router.setQueryParams({
    component: componentName
  });
}


function composer(props, onData) {
  Meteor.subscribe("Themes");

  const themes = Themes.find({}).fetch();
  const theme = Themes.findOne({ name: "base" });
  const selectedComponent = Router.getQueryParam("component");

  onData(null, {
    // Data
    themes,
    theme,
    selectedComponent,

    // Callbacks
    publishTheme,
    handleEditComponent
  });
}

export default function ThemeEditorContainer(Component) {
  return composeWithTracker(composer)(Component);
}
