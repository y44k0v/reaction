import { Template } from "meteor/templating";
import { AutoForm } from "meteor/aldeed:autoform";
import { Reaction, i18next } from "/client/api";
import { Packages } from "/lib/collections";
import { BraintreePackageConfig } from "../../lib/collections/schemas";


Template.braintreeSettings.helpers({
  packageConfigSchema: function () {
    return BraintreePackageConfig;
  },
  packageData: function () {
    return Packages.findOne({
      name: "reaction-braintree",
      shopId: Reaction.getShopId()
    });
  },
  packagesCollection: function () {
    return Packages;
  }
});


AutoForm.hooks({
  "braintree-update-form": {
    onSuccess: function () {
      return Alerts.toast(i18next.t("admin.settings.saveSuccess"), "success");
    },
    onError: function (operation, error) {
      return Alerts.toast(`${i18next.t("admin.settings.saveFailed")} ${error}`, "error");
    }
  }
});
