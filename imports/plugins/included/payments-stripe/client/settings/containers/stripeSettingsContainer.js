import React, { Component, PropTypes } from "react";
import { isEqual } from "lodash";
import { composeWithTracker } from "/lib/api/compose";
import { Reaction } from "/client/api";
import { Packages } from "/lib/collections";
import StripeSettings from "../components/stripeSettings";

class StripeSettingsContainer extends Component {
  static propTypes = {
    settings: PropTypes.object
  }

  constructor(props) {
    super(props);

    this.state = {
      settings: props.settings
    };
  }

  componentWillReceiveProps(nextProps) {
    if (isEqual(nextProps.settings, this.props.settings) === false) {
      this.setState({
        settings: nextProps.settings
      });
    }
  }

  handleSettingsSave = (settingsName, values) => {
    console.log("saving settings (not really)", settingsName, values);
  }

  render() {
    return (
      <StripeSettings
        onSettingsSave={this.handleSettingsSave}
        {...this.props}
        settings={this.state.settings}
      />
    );
  }
}

function composer(props, onData) {
  const subscription = Reaction.Subscriptions.Packages;
  const stripeSettings = Packages.findOne({
    name: "reaction-stripe", shopId: Reaction.getShopId()
  });

  if (subscription.ready()) {
    onData(null, {
      packageData: stripeSettings
    })
  } else {
    onData(null, {});
  }
}

const decoratedComponent = composeWithTracker(composer)(StripeSettingsContainer);

export default decoratedComponent;
