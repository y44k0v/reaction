/* eslint camelcase: 0 */
import { Template } from "meteor/templating";
import { Packages } from "/lib/collections";
import { i18next } from "/client/api";
import { PaypalProPackageConfig } from "../../../lib/collections/schemas";
import "./payflow.html";

Template.paypalPayFlowSettings.helpers({
  PaypalProPackageConfig: function () {
    return PaypalProPackageConfig;
  },
  packageData: function () {
    return Packages.findOne({
      name: "reaction-paypal"
    });
  }
});

AutoForm.hooks({
  "paypal-update-form-payflow": {
    onSuccess: function () {
      return Alerts.toast(i18next.t("admin.settings.saveSuccess"), "success");
    },
    onError: function () {
      return Alerts.toast(`${i18next.t("admin.settings.saveFailed")} ${error}`, "error");
    }
  }
});
