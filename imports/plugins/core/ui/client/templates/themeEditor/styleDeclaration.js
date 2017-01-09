import React, { Component, PropTypes } from "react";
import classnames from "classnames";
import { TextField } from "/imports/plugins/core/ui/client/components";
import map from "lodash/map"

class StyleDeclaration extends Component {
  static propTypes = {
    declarations: PropTypes.arrayOf(PropTypes.object),
    onPropertyChange: PropTypes.func,
    processedStyles: PropTypes.arrayOf(PropTypes.object),
    selector: PropTypes.string,
    theme: PropTypes.object
  }

  handlePropertyChange = (event, value, name) => {
    if (typeof this.props.onPropertyChange === "function") {
      console.log("change", this.props.selector, name, value);
      this.props.onPropertyChange(this.props.selector, name, value);
    }
  }

  renderDeclarations() {
    if (this.props.declarations) {
      return map(this.props.declarations, (declaration, declarationIndex) => {
        let content;

        if (declaration.declarations) {
          content = (
            <StyleDeclaration
              declarations={declaration.declarations}
              selector={this.props.selector}
            />
          );
        } else {
          content = (
            <TextField
              name={declaration.property}
              onChange={this.handlePropertyChange}
              value={declaration.value}
            />
          );
        }

        return (
          <div
            key={`declaration-${declarationIndex}`}
            className="rui list-item form-group"
            data-selector={this.props.selector}
          >
            <label>
              {declaration.property}:
            </label>
            {content}
          </div>
        );
      });
    }

    return (
      <div>
        {"No Styles"}
      </div>
    );
  }

  render() {
    const baseClassName = classnames({
      rui: true,
      styleDeclarations: true
    });

    return (
      <div className={baseClassName}>
        {this.renderDeclarations()}
      </div>
    );
  }
}

export default StyleDeclaration;
