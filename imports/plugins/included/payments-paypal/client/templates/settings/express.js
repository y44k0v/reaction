/* eslint camelcase: 0 */
import { Template } from "meteor/templating";
import { Packages } from "/lib/collections";
import { i18next } from "/client/api";
import { PaypalExpressPackageConfig } from "../../../lib/collections/schemas";
import "./express.html";

Template.paypalExpressSettings.helpers({
  PaypalExpressPackageConfig: function () {
    return PaypalExpressPackageConfig;
  },
  packageData: function () {
    return Packages.findOne({
      name: "reaction-paypal"
    });
  }
});

AutoForm.hooks({
  "paypal-update-form-express": {
    onSuccess: function () {
      return Alerts.toast(i18next.t("admin.settings.saveSuccess"), "success");
    },
    onError: function () {
      return Alerts.toast(`${i18next.t("admin.settings.saveFailed")} ${error}`, "error");
    }
  }
});
