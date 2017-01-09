import React, { Component, PropTypes } from "react";
import { TranslationProvider } from "/imports/plugins/core/ui/client/providers";
import {
  Card,
  CardHeader,
  CardGroup,
  CardBody,
  Button
} from "/imports/plugins/core/ui/client/components";
import StyleDeclaration from "./styleDeclaration";

class ThemeEditor extends Component {
  static propTypes = {
    processedStyles: PropTypes.arrayOf(PropTypes.object),
    publishTheme: PropTypes.func,
    selectedComponent: PropTypes.object,
    theme: PropTypes.object
  }

  constructor(props) {
    super(props);

    this.state = {
      styles: props.processedStyles
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      styles: nextProps.processedStyles
    });
  }

  get theme() {
    return this.props.theme || {};
  }

  get component() {
    return this.props.selectedComponent || {};
  }

  get styles() {
    return this.state.styles || [];
  }

  handlePropertyChange = (selector, property, value) => {
    // if (typeof this.props.onPropertyChange === "function") {
      console.log("OLD STYLES");
      console.log(this.styles.toJS());

      // const newStyles = this.styles.setIn([selector, "declarations", property], {
      //   property: property,
      //   value: value
      // });


      // const style = this.styles.get(selector)

      const newStyle = this.styles.merge({
        [selector]: {
          declarations: {
            [property]: {
              property: property,
              value: value
            }
          }
        }
      })

      // const declarations = style.get("declarations")
      // const newDeclarations = declarations.set({
      //   property: property,
      //   value: value
      // })
      //
      // const newStyle = style.set("declarations", newDeclarations)
      // const newStyles = this.styles.set(selector, newSelector)


      // const newStyles = this.styles.setIn([selector, "declarations"], {
      //   property: property,
      //   value: value
      // });

      console.log("NEW STYLE");

      console.log(newStyle.toJS());
      // this.setState({
      //   styles: newStyles
      // })
      // this.props.onPropertyChange(name, value);
    // }
  }

  renderStyleDeclarations() {
    if (this.styles) {
      // console.log("styles??", this.styles);
      return this.styles.map((style, styleIndex) => {
        // const style = this.state.styles[styleReference.selector]

        console.log(style);
        return (
          <Card key={`style-${styleIndex}`}>
            <CardHeader title={style.annotation.label} />
            <CardBody>
              <StyleDeclaration
                selector={style.selector}
                declarations={style.declarations}
                onPropertyChange={this.handlePropertyChange}
              />
            </CardBody>
          </Card>
        );
      });
    }
    //
    // return (
    //   <div class="rui list">
    //     {{#each declaration in declarations}}
    //       <div class="rui list-item form-group" data-selector={{selector}}>
    //         <label>
    //           {{declaration.property}}:
    //         </label>
    //         {{#if declaration.declarations}}
    //           {{> uiStyleDeclarations declarations=declaration.declarations}}
    //         {{else}}
    //           {{> textfield name=declaration.property value=declaration.value}}
    //         {{/if}}
    //       </div>
    //     {{/each}}
    //   </div>
    // )

    return null
  }

  render() {
    console.log("The real props", this.props);
    return (
      <TranslationProvider>
        <div className="rui theme-editor">
          <Card>
            <CardHeader title={this.component.label} />
          </Card>

          <CardGroup>
            {this.renderStyleDeclarations()}
          </CardGroup>

        </div>
      </TranslationProvider>
    );
  }
}

export default ThemeEditor;
