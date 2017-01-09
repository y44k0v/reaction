import { Meteor } from "meteor/meteor";
import { ReactiveVar } from "meteor/reactive-var"
import { Router } from "/client/modules/router";
import { composeWithTracker } from "/lib/api/compose";
// import { Alerts } from "../components";
import { i18next } from "/client/api";
import { default as ReactionAlerts } from "/imports/plugins/core/layout/client/templates/layout/alerts/inlineAlerts";
import { Themes } from "/lib/collections";
import map from "lodash/map";
import each from "lodash/each";
import { Map, OrderedMap, List } from "immutable";

/**
 * publishTheme - Publish a theme to the shops collection to activate it
 * @param  {SyntheticEvent} event Original event that triggered the publish
 * @param  {object} theme Theme object
 * @return {Promise} A promise that resolves if the theme was updated successfully
 */
export function publishTheme(event, theme) {
  return new Promise((resolve, reject) => {
    Meteor.call("ui/publishTheme", theme, (error) => {
      console.log(error);
      if (error) {
        const alertDescription = i18next.t("reactionUI.publishThemeError", {
          defaultValue: `Couldn't publish theme ${theme.name}`,
          themeName: theme.name
        });
        Alerts.toast(alertDescription, "error");

        return reject();
      }

      return resolve();
    });
  });
}

/**
 * [handleEditComponent description]
 * @param  {[type]} event         [description]
 * @param  {[type]} componentName [description]
 * @return {[type]}               [description]
 */
export function handleEditComponent(event, componentName) {
  Router.setQueryParams({
    component: componentName
  });
}

/**
 * [findComponentByName description]
 * @param  {[type]} theme [description]
 * @param  {[type]} name  [description]
 * @return {[type]}       [description]
 */
export function findComponentByName (theme, name) {
  if (theme) {
    return _.find(theme.components, (component) => {
      return component.name === name;
    });
  }
};

/**
 * processAnnotations - Process CSS annotations for display in UI
 * @summary Takes an array of annotation objects and returns an object of annotations
 * whose keys are the `annotation.rule`
 * @param  {Array} annotations Array of annotation objects
 * @return {object} Object of annotations
 */
export function processAnnotations(annotations) {
  const processedAnnotations = {};

  for (const annotation of annotations) {
    if (annotation.rule) {
      annotations[annotation.rule] = annotation;
    }
  }

  return processedAnnotations;
}

/**
 * [processStylesForComponent description]
 * @param  {[type]} component [description]
 * @return {[type]}           [description]
 */
export function processStylesForComponent(component) {
  return new Promise((resolve, reject) => {
    // Get a freestyle-like object from raw css
    Meteor.call("ui/cssToObject", component.styles, (error, stylesObject) => {
      if (error) {
        return reject(error)
      }

      // Process Annotations for combining with style data
      const annotations = processAnnotations(component.annotations);

      // Create an Immutable.js Ordered Map object to store our styles
      let stylesMap = OrderedMap({
        "poop": {
          selector: "poop",
          annotation: { label: "POOOOOP" },
          declarations: {
            border: {
              property: "border",
              value: "OK!"
            }
          }
        }
      })

      // Loop through the style oject and process into nice object to use
      // with the theme editor
      each(stylesObject, (declarations, selector) => {
        // Decelaration map
        let declarationsMap = OrderedMap()

        // Loop through the style decelatations object change its format
        // and add any extra data if necessary
        each(declarations, (value, property) => {
          declarationsMap = declarationsMap.set(property, {
            property,
            value
          });
        });

        // Values for the styleMap
        const values = {
          selector,
          declarations: declarationsMap.toJS(),
          annotation: annotations[selector] || { label: selector },
        };

        // Update the immutable styleMap
        stylesMap = stylesMap.set(selector, values)
      });

      resolve({
        stylesObject: stylesObject,
        processedStyles: stylesMap
      })
    });
  })
}

function composer(props, onData) {
  Meteor.subscribe("Themes");

  const themes = Themes.find({}).fetch();
  const theme = Themes.findOne({ name: "base" });
  const selectedComponentName = Router.getQueryParam("component");

  const data = {
    // Data
    themes,
    theme,

    // Callbacks
    publishTheme,
    handleEditComponent
  }

  if (theme && selectedComponentName) {
    const selectedComponent = findComponentByName(theme, selectedComponentName)

    // Process component styles an annotations
    processStylesForComponent(selectedComponent)
      .then((styleData) => {

        const dataWithStyles = {
          ...data,
          ...styleData,
          selectedComponent
        }
        console.log("---- SUCCESS");
        onData(null, dataWithStyles);
      })
      .catch((error) => {
        console.log("!!!!! FAIL", error);
        // If there's an error, then just send the data we do have
        // onData(null, data);
      })

    return;
  }

  onData(null, data);
}

export default function ThemeEditorContainer(Component) {
  return composeWithTracker(composer)(Component);
}
