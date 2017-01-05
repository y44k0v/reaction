import { Meteor } from "meteor/meteor";
import { Router } from "/client/modules/router";
import { composeWithTracker } from "/lib/api/compose";
// import { Alerts } from "../components";
import { i18next } from "/client/api";
import { default as ReactionAlerts } from "/imports/plugins/core/layout/client/templates/layout/alerts/inlineAlerts";
import { Themes } from "/lib/collections";


export function handleOpenTheme(event, theme) {
  Router.go("dashboard/uiThemeDetails", {
    id: theme.name
  });
}

export function handleDuplicateTheme(event, theme) {
  Alerts.alert({
    title: i18next.t("reactionUI.duplicateTheme", "Duplicate Theme"),
    showCancelButton: true,
    confirmButtonText: "Duplicate"
  }, () => {
    Meteor.call("ui/duplicateTheme", theme.name, (error) => {
      if (error) {
        const alertDescription = i18next.t("reactionUI.duplicateThemeError", {
          defaultValue: "Couldn't duplicate theme"
        });
        Alerts.toast(alertDescription, "error");
      }
    });
  });
}


function composer(props, onData) {
  Meteor.subscribe("Themes");

  const themes = Themes.find({}).fetch();

  onData(null, {
    // Data
    themes,

    // Callbacks
    handleOpenTheme,
    handleDuplicateTheme
  });
}

export default function ThemeListContainer(Component) {
  return composeWithTracker(composer)(Component);
}
