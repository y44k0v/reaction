import React, { Component, PropTypes } from "react";
import { Translation } from "/imports/plugins/core/ui/client/components";
import { Metafield, TagItem, Currency } from "/imports/plugins/core/ui/client/components";
import JsDiff from "diff";
import isDate from "lodash/isdate";
import merge from "lodash/merge";

class SimpleDiff extends Component {
  renderPath(path) {
    const label = path.join(".");

    return (
      <h4>{label}</h4>
    );
  }

  renderEmptyBadge() {
    return (
      <span className="badge badge-default">
        <Translation defaultValue="Empty" />
      </span>
    );
  }

  renderArrayChange(change, side = "rhs") {
    if (side !== "rhs" && side !== "lhs") {
      throw new Error("Change must be `rhs` (right hand side) or `lhs` (left hande side)");
    }

    if (change.path[0] === "metafields") {
      if (Array.isArray(change.changes)) {
        const elements = change.changes.map((metaChange, index) => {
          if (metaChange) {
            const item = Object.assign(
              {
                key: this.renderEmptyBadge(),
                value: this.renderEmptyBadge()
              },
              metaChange.item[side] || {}
            );

            return (
              <Metafield
                editable={false}
                key={index}
                index={index}
                metafield={item}
              />
            );
          }

          return undefined;
        });

        return [
          <Metafield
            editable={false}
            key="header"
            metafield={{
              key: <strong><Translation defaultValue="Name" /></strong>,
              value: <strong><Translation defaultValue="Info" /></strong>
            }}
          />
        ].concat(elements);
      }
    } else if (change.path[0] === "hashtags") {
      if (Array.isArray(this.props.tags)) {
        const foundTag = this.props.tags.find((tag) => {
          if (tag._id === change.item[side]) {
            return true;
          }
          return false;
        });

        if (foundTag) {
          return (
            <TagItem tag={foundTag} />
          );
        }

        return this.renderEmptyBadge();
      }
    }

    return this.renderEmptyBadge();
  }

  renderTextDiff(change, side = "rhs") {
    const rightHandSide = change.rhs && change.rhs.toString() || "";
    const leftHandSide = change.lhs && change.lhs.toString() || "";

    if (isDate(change[side])) {
      return (
        <span>{change[side].toString()}</span>
      );
    }

    if (change.path[0] === "price" && typeof change[side] === "number") {
      return (
        <Currency amount={change[side]} />
      );
    }

    if (typeof change[side] === "number") {
      return (
        <span>{change[side]}</span>
      );
    }


    if (typeof change[side] === "string" && side === "rhs") {
      const diff = JsDiff.diffWords(leftHandSide, rightHandSide);

      return diff.map((part) => {
        let style = {};

        if (part.added) {
          style = {
            backgroundColor: "#5cb85c",
            color: "#fff"
          };
        } else if (part.removed) {
          style = {
            backgroundColor: "#d9534f",
            color: "#fff"
          };
        }

        return (
          <span style={style}>
            {part.value}
          </span>
        );
      });
    }

    return change[side];
  }

  renderDiff() {
    // Lets convert the diff to a better format for display
    const okDiff = [];

    const filteredMetaChanges = this.props.diff.filter((singleDiff) => {
      if (singleDiff.path[0] === "metafields") {
        return true;
      }
      return false;
    });

    const things = [];

    for (const c of filteredMetaChanges) {
      if (c.path.length > 2 && c.path[0] === "metafields") {
        const obj = {
          kind: "A",
          index: c.path[1],
          path: ["metafields"],
          item: {
            kind: "E",
            lhs: {},
            rhs: {}
          }
        };

        // merge()

        if (c.path[2] === "key") {
          obj.item.lhs.key = c.lhs;
          obj.item.rhs.key = c.rhs;
        } else {
          obj.item.lhs.value = c.lhs;
          obj.item.rhs.value = c.rhs;
        }

        things.push(obj);
      } else {
        things.push(c);
      }
    }

    const combinedMeta = {
      kind: "A",
      path: ["metafields"],
      changes: new Array(things.length)
    };

    things.forEach((metaChange) => {
      if (!combinedMeta.changes[metaChange.index]) {
        combinedMeta.changes[metaChange.index] = metaChange;
      } else {
        combinedMeta.changes[metaChange.index] = merge(
          combinedMeta.changes[metaChange.index],
          metaChange
        );
      }
    });

    for (const change of this.props.diff) {
      const firstPath = change.path[0];

      if (firstPath !== "metafields" && firstPath !== "hashtags") {
        okDiff.push(change);
      }
    }

    okDiff.push(combinedMeta);

    return okDiff.map((change, index) => {
      const rightHandSide = change.rhs && change.rhs.toString() || this.renderEmptyBadge();
      const leftHandSide = change.lhs && change.lhs.toString()  || this.renderEmptyBadge();
// console.log(change);
      switch (change.kind) {
        // Array change
        case "A":
          return (
            <div className="row" key={index}>
              <div className="col-sm-4" style={{whiteSpace: "normal"}}>
                {this.renderArrayChange(change, "lhs")}
              </div>
              <div className="col-sm-4" >
                {this.renderPath(change.path)}
                <div className="badge badge-warning">
                  <Translation defaultValue="Modified" />
                </div>
              </div>
              <div className="col-sm-4" style={{whiteSpace: "normal"}}>
                {this.renderArrayChange(change, "rhs")}
              </div>
            </div>
          );

        // Added property / element
        case "N":
          return (
            <div className="row success" key={index}>
              <div className="col-sm-4" style={{whiteSpace: "normal"}}>{leftHandSide}</div>
              <div className="col-sm-4">
                {this.renderPath(change.path)}
                <div className="badge badge-success">
                  <Translation defaultValue="New" />
                </div>
              </div>
              <div className="col-sm-4" style={{whiteSpace: "normal"}}>{rightHandSide}</div>
            </div>
          );

        // Edited property or element
        case "E":
          return (
            <div className="row warning" key={index}>
              <div className="col-sm-4" style={{whiteSpace: "normal"}}>
                {this.renderTextDiff(change, "lhs")}
              </div>
              <div className="col-sm-4">
                {this.renderPath(change.path)}
                <div className="badge badge-warning">
                  <Translation defaultValue="Modified" />
                </div>
              </div>
              <div className="col-sm-4" style={{whiteSpace: "normal"}}>
                {this.renderTextDiff(change, "rhs")}
              </div>
            </div>
          );

        // Removed property / element
        case "D":
          return (
            <div className="row danger" key={index}>
              <div className="col-sm-4" style={{whiteSpace: "normal"}}>{leftHandSide}</div>
              <div className="col-sm-4"><i className="fa fa-times" />
                {this.renderPath(change.path)}
                <div className="badge badge-danger">
                  <Translation defaultValue="Removed" />
                </div>
              </div>
              <div className="col-sm-4" style={{whiteSpace: "normal"}}>{rightHandSide}</div>
            </div>
          );
        default:
          return null;
      }
    });
  }

  render() {
    return (
      <div className="rui simplediff" key="header">
        <div className="row">
          <div className="col-sm-4" style={{whiteSpace: "normal"}}>
            <Translation defaultValue="Publically Visible" />
          </div>
          <div className="col-sm-4" >
            <Translation defaultValue="Change Type" />
          </div>
          <div className="col-sm-4" style={{whiteSpace: "normal"}}>
            <Translation defaultValue="Draft" />
          </div>
        </div>
        {this.renderDiff()}
      </div>
    );
  }
}

SimpleDiff.defaultProps = {
  diff: []
};

SimpleDiff.propTypes = {
  diff: PropTypes.arrayOf(PropTypes.object),
  tags: PropTypes.arrayOf(PropTypes.object)
};

export default SimpleDiff;
