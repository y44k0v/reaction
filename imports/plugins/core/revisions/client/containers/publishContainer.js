import React, { Component, PropTypes } from "react";
import { composeWithTracker } from "react-komposer";
import PublishControls from "../components/publishControls";
import { Tags, Revisions } from "/lib/collections";
import { Meteor } from "meteor/meteor";
import { DragDropProvider, TranslationProvider } from "/imports/plugins/core/ui/client/providers";
import { isRevisionControlEnabled } from "../../lib/api";
import { i18next } from "/client/api";

/**
 * Publish container is a stateless container component connected to Meteor data source.
 * @param  {Object} props Component props
 * @return {PropTypes.node} react node
 */
class PublishContainer extends Component {
  handlePublishClick = (revisions) => {
    if (Array.isArray(revisions)) {
      const documentIds = revisions.map((revision) => {
        return revision.documentId;
      });

      Meteor.call("revisions/publish", documentIds, (error, result) => {
        if (result === true) {
          const message = i18next.t("revisions.changedPublished", {
            defaultValue: "Changes published successfully"
          });

          Alerts.toast(message, "success");
        } else {
          const message = i18next.t("revisions.noChangesPublished", {
            defaultValue: "There are no changes to publish"
          });

          Alerts.toast(message, "warning");
        }
      });
    }
  }

  render() {
    return (
      <DragDropProvider>
        <TranslationProvider>
          <PublishControls
            isEnabled={this.props.isEnabled}
            onPublishClick={this.handlePublishClick}
            revisions={this.props.revisions}
            tags={this.props.tags}
          />
        </TranslationProvider>
      </DragDropProvider>
    );
  }
}

PublishContainer.propTypes = {
  isEnabled: PropTypes.bool,
  revisions: PropTypes.arrayOf(PropTypes.object),
  tags: PropTypes.arrayOf(PropTypes.object)
};

function composer(props, onData) {
  if (props.documentIds) {
    let tags = [];
    const subscription = Meteor.subscribe("Revisions", props.documentIds);

    if (subscription.ready()) {
      const revisions = Revisions.find({
        "$or": [
          {
            documentId: {
              $in: props.documentIds
            }
          },
          {
            "documentData.ancestors": {
              $in: props.documentIds
            }
          }
        ],
        "workflow.status": {
          $nin: [
            "revision/published"
          ]
        }
      }).fetch();

      if (Array.isArray(revisions)) {
        let tagIds = [];

        for (const revision of revisions) {
          if (revision.documentData && Array.isArray(revision.documentData.hashtags)) {
            tagIds = tagIds.concat(revision.documentData.hashtags);
          }
        }

        tags = Tags.find({
          _id: {
            $in: tagIds
          }
        }).fetch();
      }

      onData(null, {
        isEnabled: isRevisionControlEnabled(),
        revisions,
        tags
      });

      return;
    }
  }

  onData(null, {
    isEnabled: isRevisionControlEnabled()
  });
}

export default composeWithTracker(composer)(PublishContainer);
