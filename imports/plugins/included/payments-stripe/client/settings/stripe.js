import { Template } from "meteor/templating";
import StripeSettingsContainer from "./containers/stripeSettingsContainer";

Template.stripeSettings.helpers({
  StripeSettingsContainer() {
    return {
      component: StripeSettingsContainer
    };
  }
});
