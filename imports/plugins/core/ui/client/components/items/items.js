import React, { Component, PropTypes } from "react";
import classnames from "classnames";

class Items extends Component {
  static propTypes = {
    children: PropTypes.node,
    flex: PropTypes.bool,
    flexAmount: PropTypes.oneOf(["quarter", "thrid", "half", "three-quarters", "full"]),
    flexDirection: PropTypes.oneOf(["row", "row-reverse", "column", "column-reverse"])
  }

  get shouldFlex() {
    return this.props.flexDirection || this.props.flexAmount || this.props.flex;
  }

  render() {
    const { flexAmount, flexDirection } = this.props;

    const baseClassName = classnames({
      "rui": true,
      "items": true,
      "flex": this.shouldFlex,

      // Flex direction
      "horizontal": flexDirection === "row" || flexDirection === undefined,
      "horizontal.reverse": flexDirection === "row-reverse",
      "column": flexDirection === "column",
      "column.reverse": flexDirection === "column-reverse",


      "quarter": flexAmount === "quarter",
      "half": flexAmount === "half",
      "three-quarters": flexAmount === "three-quarters",
      "full": flexAmount === "full"
    });

    return (
      <div className={baseClassName}>
        {this.props.children}
      </div>
    );
  }
}

export default Items;
