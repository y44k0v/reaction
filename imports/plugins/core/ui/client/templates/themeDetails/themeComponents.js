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

class ThemeComponents extends Component {
  static propTypes = {
    handleDuplicateTheme: PropTypes.func,
    handleOpenTheme: PropTypes.func,
    themes: PropTypes.arrayOf(PropTypes.object)
  }

  renderComponentCards() {
    console.log(this.props);
    if (this.props.theme && Array.isArray(this.props.theme.components)) {
      return this.props.theme.components.map((component, index)=> {
        return (
          <Item>
            <Card
              key={index}
              on
            >
              <CardHeader title={component.label} />
              <CardBody>
              </CardBody>
              <CardActions>
                <Button
                  label={"Edit"}
                  onClick={this.props.handleEditComponent}
                  value={component.name}
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
        {this.renderComponentCards()}
      </Items>
    );
  }
}

export default ThemeComponents;
