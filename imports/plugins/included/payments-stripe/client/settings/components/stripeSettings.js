import React, { Component, PropTypes } from "react";
import { Form } from "/imports/plugins/core/ui/client/components";
import { StripePackageConfig } from "../../../lib/collections/schemas/";

class StripeSettings extends Component {
  static propTypes = {
    onSettingChange: PropTypes.func,
    onSettingEnableChange: PropTypes.func,
    onSettingExpand: PropTypes.func,
    onSettingsSave: PropTypes.func,
    packageData: PropTypes.object,
    preferences: PropTypes.object,
    providers: PropTypes.arrayOf(PropTypes.string),
    socialSettings: PropTypes.object
  }

  handleSubmit = (event, data, formName) => {
    if (typeof this.props.onSettingsSave === "function") {
      this.props.onSettingsSave(formName, data.doc);
    }
  }

  render() {
    const doc = {
      settings: {
        ...this.props.packageData.settings
      }
    };
    console.log("doc", doc);
    return (
      <Form
        schema={StripePackageConfig}
        doc={doc}
        onSubmit={this.handleSubmit}
      />
    );
  }
}

export default StripeSettings;
