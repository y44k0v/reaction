import React, { Component, PropTypes } from "react";
import Blaze from "meteor/gadicc:blaze-react-component";

class Toolbar extends Component {
  static propTypes = {
    layoutToolbar: PropTypes.object
  }

  render() {
    if (this.props.template) {
      return (
        <Blaze template={this.props.template} />
      )
    }

    return null;
  }
}

export default Toolbar;
