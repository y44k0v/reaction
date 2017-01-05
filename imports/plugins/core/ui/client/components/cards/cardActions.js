import React, { Children, Component, PropTypes } from "react";
import { Item, Items } from "/imports/plugins/core/ui/client/components";
import { VelocityTransitionGroup } from "velocity-react";

class CardActions extends Component {

  renderCard() {
    if (this.props.expanded) {

      const elements = Children.map(this.props.children, (child) => {
        return (
          <Item>
            {child}
          </Item>
        )
      });

      return (
        <div className="panel-footer card-block">
          <Items flex={true}>
            {elements}
          </Items>
        </div>
      );
    }

    return null;
  }

  render() {
    return (
      <VelocityTransitionGroup
        enter={{ animation: "slideDown" }}
        leave={{ animation: "slideUp" }}
      >
        {this.renderCard()}
      </VelocityTransitionGroup>
    );
  }
}

CardActions.defaultProps = {
  expandable: false,
  expanded: true
};

CardActions.propTypes = {
  children: PropTypes.node,
  expanded: PropTypes.bool
};

export default CardActions;
