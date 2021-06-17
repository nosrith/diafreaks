<template>
  <div id="app">
    <diagram-view id="diagram-view" :context="context"></diagram-view>
    <help-view id="help-pane" v-if="subView == 'help'"></help-view>
    <div id="nav-pane">
      <span id="nav-pane-logo" class="nav-pane-item">
        <img src="@/assets/diafreaks_logo.png" style="height: 32px">
      </span>
      <span id="nav-pane-buttons">
        <span id="nav-pane-buttons-left">
          <span class="nav-pane-item" v-if="enableSwitchEditMode">
            <b-tooltip :label="$t('message.editButtonTooltip')" type="is-light">
              <b-button icon-left="pencil-outline" size="medium" :class="context.state.editMode ? 'is-selected': ''" @click="onEditButtonClick"></b-button>
            </b-tooltip>
          </span>
          <span class="nav-pane-item" v-if="context.state.editMode">
            <b-tooltip :label="$t('message.undoButtonTooltip')" type="is-light">
              <b-button icon-left="undo" size="medium" :disabled="!context.history.undoable" @click="onUndoButtonClick"></b-button>
            </b-tooltip>
          </span>
          <span class="nav-pane-item" v-if="context.state.editMode">
            <b-tooltip :label="$t('message.redoButtonTooltip')" type="is-light">
              <b-button icon-left="redo" size="medium" :disabled="!context.history.redoable" @click="onRedoButtonClick"></b-button>
            </b-tooltip>
          </span>
          <span class="nav-pane-item" v-if="context.state.editMode">
            <b-tooltip :label="Object.keys(context.diagram.trains).length > 0 ? $t('message.vanishTrainsButtonTooltip') : $t('message.vanishStationsButtonTooltip')" type="is-light">
              <b-button icon-left="vanish" size="medium" @click="onVanishButtonClick"></b-button>
            </b-tooltip>
          </span>
          <span class="nav-pane-item">
            <b-tooltip :label="$t('message.uploadButtonTooltip')" type="is-light">
              <b-button icon-left="upload" size="medium" @click="onUploadButtonClick"></b-button>
            </b-tooltip>
          </span>
          <span class="nav-pane-item">
            <b-tooltip :label="$t('message.downloadButtonTooltip')" type="is-light">
              <b-button icon-left="download" size="medium" @click="onDownloadButtonClick"></b-button>
            </b-tooltip>
          </span>
        </span>
        <span id="nav-pane-buttons-spacer"></span>
        <span id="nav-pane-buttons-right">
          <span class="nav-pane-item" v-if="enableSwitchEditMode">
            <b-tooltip :label="$t('message.helpButtonTooltip')" type="is-light">
              <b-button icon-left="help" size="medium" :class="subView == 'help' ? 'is-selected': ''" @click="onHelpButtonClick"></b-button>
            </b-tooltip>
          </span>
        </span>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import DiagramViewContext from "./data/DiagramViewContext";
import Diagram from "./data/Diagram";
import DiagramView from "./components/DiagramView.vue";
import HelpView from "./components/HelpView.vue";

@Component({
  components: {
    DiagramView, HelpView
  },
})
export default class App extends Vue {
  private context = new DiagramViewContext();

  private diagramFileName = "diagram.json";
  private enableSwitchEditMode = window.screen.width >= 640;
  private subView: "none" | "help" = "none";

  private mounted(): void {
    this.context.state.editMode = this.enableSwitchEditMode;
    fetch("sample-diagram.json").then(async result => {
      const json = await result.json();
      this.context.diagram = Diagram.fromJSON(json);
      this.diagramFileName = "sample-diagram.json";
    });
  }

  private onEditButtonClick(): void {
    this.context.state.editMode = !this.context.state.editMode;
  }

  private onUndoButtonClick(): void {
    this.context.history.undo();
  }

  private onRedoButtonClick(): void {
    this.context.history.redo();
  }

  private onVanishButtonClick(): void {
    if (Object.keys(this.context.diagram.trains).length > 0) {
      const trains = this.context.diagram.trains;
      this.context.history.push({
        this: this,
        undo: () => { this.context.diagram.trains = trains; },
        redo: () => { this.context.diagram.trains = {}; }
      });
      this.context.diagram.trains = {}; 
    } else {
      const diagram = this.context.diagram;
      this.context.history.push({
        this: this,
        undo: () => { this.context.diagram = diagram; },
        redo: () => { this.context.diagram = Diagram.fromJSON({ stations: {}, trains: {} }); }
      });
      this.context.diagram = Diagram.fromJSON({ stations: {}, trains: {} }); 
    }
  }

  private onUploadButtonClick(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json, application/json";
    input.onchange = () => {
      const reader = new FileReader();
      if (input.files && input.files.length > 0) {
        const file = input.files[0];
        reader.readAsText(file);
        reader.onload = () => {
          if (typeof(reader.result) == "string") {
            try {
              const data = JSON.parse(reader.result);
              this.context.diagram = Diagram.fromJSON(data);
              this.diagramFileName = file.name;
              this.context.history.clear();
            } catch (e) {
              this.$buefy.notification.open({
                type: "is-danger",
                message: `${this.$t("message.failedToLoadJSON").toString()}<br>${file.name}`,
              });
            }
          }
        };
      }
    };
    input.click();
  }

  private onDownloadButtonClick(): void {
    const json = JSON.stringify(this.context.diagram);
    const blob = new Blob([ json ], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = this.diagramFileName;
    a.click();
  }

  private onHelpButtonClick(): void {
    this.subView = this.subView == "help" ? "none" : "help";
  }
}
</script>

<style lang="scss">
@import "~bulma/sass/utilities/_all";
$selected: #8c67ef;
$selected-invert: findColorInvert($selected);

html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}
#app {
  display: flex;
  flex-direction: column;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
#diagram-view {
  flex: 1 1 0;
}
#nav-pane {
  flex: 0 0 auto;
  display: flex;
  flex-flow: row wrap;
}
#nav-pane-logo {
  flex: 0 0 auto;
}
#nav-pane-buttons {
  flex: 1 0 0;
  display: flex;
  flex-flow: row nowrap;
}
#nav-pane-buttons-left {
  flex: 0 0 auto;
}
#nav-pane-buttons-spacer {
  flex: 1 0 0;
}
#nav-pane-buttons-right {
  flex: 0 0 auto;
}
#nav-pane .nav-pane-item {
  display: inline-block;
  padding: 0.5rem;
}
#nav-pane a.navbar-item:not(:focus), #nav-pane a.navbar-item:not(:hover) {
  background-color: initial !important;
}
#nav-pane .button {
  border: none;
} 
#nav-pane .button:focus, #nav-pane .button.is-focused {
  border: none;
  box-shadow: none;
}
#nav-pane .button.is-selected {
  background-color: $selected;
  color: $selected-invert;
}
#nav-pane .button:not(.is-selected):hover {
  color: $selected;
}
</style>
