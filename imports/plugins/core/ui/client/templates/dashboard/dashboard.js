import { Themes } from "/lib/collections";
import { ThemeListContainer } from "../../containers";
import ThemeList from "./themeList";

Template.uiDashboard.onCreated(function () {
  this.state = new ReactiveDict();
  this.state.setDefault({
    themes: []
  });

  this.autorun(() => {
    this.subscribe("Themes");
    const themes = Themes.find({}).fetch();
    this.state.set("themes", themes);
  });
});

Template.uiDashboard.helpers({
  ThemeListComponent() {
    return {
      component: ThemeListContainer(ThemeList)
    };
  }
});
