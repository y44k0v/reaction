import React, { Component, PropTypes } from "react";
import classnames from "classnames";


// TODO: make part of ReactionLayout
import Header from "./header";
import CartDrawer from "./cartDrawer";
import QuickMenu from "./quickMenu";
import Toolbar from "./toolbar";
import { Actions, Content } from "./";

class AdminView extends Component {
  static propTypes = {
    actionViewIsOpen: PropTypes.bool,
    data: PropTypes.object
  }

  render() {
    const pageClassName = classnames({
      "page": true,
      "show-settings": this.props.actionViewIsOpen
    });

    return (
      <div style={{display: "flex", flex: "1 1 auto"}}>
        <QuickMenu buttons={this.props.buttons} />
        <div
          className={pageClassName}
          id="reactionAppContainer"
        >
          <Toolbar template={this.props.data.dashboardHeader && this.props.data.dashboardHeader()} />
          <Header template={this.props.data.layoutHeader()} />
          <CartDrawer />
          <Content template={this.props.data.template()} />
        </div>
        <Actions
          controlComponent={this.props.actionView.template}
          controlComponentProps={this.props.actionView.data}
          footerTemplate={this.props.data.adminControlsFooter()}
          isActionViewOpen={this.props.actionViewIsOpen}
        />
      </div>
    );
  }
}

export default AdminView;
