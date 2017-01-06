import React, { Component, PropTypes } from "react";
import { TranslationProvider } from "/imports/plugins/core/ui/client/providers";
import { Button } from "/imports/plugins/core/ui/client/components";

class ThemeToolbar extends Component {
  static propTypes = {
    publishTheme: PropTypes.func,
    theme: PropTypes.object
  }

  get theme() {
    return this.props.theme || {};
  }

  render() {
    return (
      <TranslationProvider>
        <div className="nav nav-dashboard">
          <div className="nav-dashboard-heading">
            <h3 className="nav-dashboard-title">
              {this.theme.name}
            </h3>
          </div>
          <div className="nav-dashboard-controls">

            <Button
              label={"Publish Theme"}
              onClick={this.props.publishTheme}
              value={this.props.theme}
            />
          </div>
        </div>
      </TranslationProvider>
    );
  }
}

export default ThemeToolbar;
