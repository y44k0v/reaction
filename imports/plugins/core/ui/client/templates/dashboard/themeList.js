import React, { Component, PropTypes } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardActions,
  Items,
  Item
} from "/imports/plugins/core/ui/client/components";

class ThemeList extends Component {
  static propTypes = {
    handleDuplicateTheme: PropTypes.func,
    handleOpenTheme: PropTypes.func,
    themes: PropTypes.arrayOf(PropTypes.object)
  }

  renderThemeCards() {
    if (Array.isArray(this.props.themes)) {
      return this.props.themes.map((theme, index) => {
        let componentElements;

        // Get a short list of theme components to display in the description
        if (Array.isArray(theme.components)) {
          const someComponents = theme.components.slice(0, Math.min(5, theme.components.length));

          componentElements = someComponents.map((component, componentIndex)=> {
            return (
              <div key={componentIndex}>
                {component.label}
              </div>
            );
          });
        }

        return (
          <Item>
            <Card
              key={index}
              on
            >
              <CardHeader title={theme.name.toUpperCase()} />
              <CardBody>
                <strong>Components</strong>
                {componentElements}
              </CardBody>
              <CardActions>
                <Button
                  label={"Edit"}
                  onClick={this.props.handleOpenTheme}
                  value={theme}
                />
                <Button
                  label={"Duplicate"}
                  onClick={this.props.handleDuplicateTheme}
                  value={theme}
                />
              </CardActions>
            </Card>
          </Item>
        );
      });
    }

    return (
      <div className="empty-view-message">
        <i className="fa fa-exclamation-triangle" />
        <p>{"No Available UI Themes"}</p>
      </div>
    );
  }

  render() {
    return (
      <Items flexAmount="quarter">
        {this.renderThemeCards()}
      </Items>
    );
  }
}

export default ThemeList;
