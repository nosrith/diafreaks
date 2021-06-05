<template>
  <div id="app">
    <div id="view-pane">
      <stage id="stage-pane" @updateY="updateY" @stationNameInputStart="onStationNameInputStart" @trackNameInputStart="onTrackNameInputStart"></stage>
      <div id="ui-pane">
        <station-name-input ref="stationNameInput"></station-name-input>
        <track-name-input ref="trackNameInput"></track-name-input>
        <station-expand-button
          v-for="s in Object.values(diagram.stations)" :key="`station-expand-button-${s.id}`" 
          :station="s" 
          @updateY="updateY" @trackNameInputStart="onTrackNameInputStart"></station-expand-button>
        <station-remove-button
          v-for="s in Object.values(diagram.stations)" :key="`station-remove-button-${s.id}`"
          :station="s"
          @updateY="updateY"></station-remove-button>
        <station-add-track-button
          v-for="s in Object.values(diagram.stations)" :key="`station-add-track-button-${s.id}`" 
          :station="s" 
          @updateY="updateY" @trackNameInputStart="onTrackNameInputStart"></station-add-track-button>
        <template v-for="s in Object.values(diagram.stations)">
          <station-remove-track-button
            v-for="t in s.tracks" :key="`station-remove-track-button-${s.id}-${t.id}`"
            :station="s" :track="t"
            @updateY="updateY"></station-remove-track-button>
        </template>
      </div>
    </div>
    <b-navbar id="nav-pane" transparent>
      <template #brand>
        <b-navbar-item><img src="@/assets/logo.png"></b-navbar-item>
      </template>
      <template #start>
        <b-navbar-item>
          <b-tooltip :label="$t('message.editButtonTooltip')" type="is-light">
            <b-button icon-left="pencil-outline" size="medium" :class="viewState.editMode ? 'is-selected': ''" @click="onEditButtonClick"></b-button>
          </b-tooltip>
        </b-navbar-item>
      </template>
      <template #end>
        <b-navbar-item>
          <b-tooltip :label="$t('message.uploadButtonTooltip')" type="is-light">
            <b-button icon-left="upload" size="medium" @click="onUploadButtonClick"></b-button>
          </b-tooltip>
        </b-navbar-item>
        <b-navbar-item>
          <b-tooltip :label="$t('message.downloadButtonTooltip')" type="is-light">
            <b-button icon-left="download" size="medium" @click="onDownloadButtonClick"></b-button>
          </b-tooltip>
        </b-navbar-item>
      </template>
    </b-navbar>
  </div>
</template>

<script lang="ts">
import { Component, ProvideReactive, Vue } from "vue-property-decorator";
import Diagram from "./data/Diagram";
import Station from "./data/Station";
import ViewConfig from "./data/ViewConfig";
import ViewState from "./data/ViewState";
import Stage from "./components/Stage.vue";
import StationAddTrackButton from "./components/StationAddTrackButton.vue";
import StationExpandButton from "./components/StationExpandButton.vue";
import StationNameInput from "./components/StationNameInput.vue";
import StationRemoveButton from "./components/StationRemoveButton.vue";
import StationRemoveTrackButton from "./components/StationRemoveTrackButton.vue";
import TrackNameInput from "./components/TrackNameInput.vue";

import defaultDiagramJson from "./default-diagram";

@Component({
  components: {
    Stage, StationAddTrackButton, StationExpandButton, StationNameInput, StationRemoveButton, StationRemoveTrackButton, TrackNameInput
  },
})
export default class App extends Vue {
  @ProvideReactive() viewConfig = new ViewConfig();
  @ProvideReactive() viewState = new ViewState();
  @ProvideReactive() diagram: Diagram = Diagram.fromJSON({ stations: [], trains: [] });

  file: File | null = null;

  get stationsInMileageOrder(): Station[] {
    return this.diagram.getStationsInMileageOrder();
  }

  mounted(): void {
    window.addEventListener("resize", this.updateAppSize);
    this.updateAppSize();

    this.diagram = Diagram.fromJSON(defaultDiagramJson);
    this.updateY();
}

  unmounted(): void {
    window.removeEventListener("resize", this.updateAppSize);
  }

  onStationNameInputStart(): void {
    this.$nextTick(() => ((this.$refs.stationNameInput as Vue).$el as HTMLInputElement).focus());
  }

  onTrackNameInputStart(): void {
    this.$nextTick(() => ((this.$refs.trackNameInput as Vue).$el as HTMLInputElement).focus());
  }

  onEditButtonClick(): void {
    this.viewState.editMode = !this.viewState.editMode;    
  }

  onUploadButtonClick(): void {
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
            const data = JSON.parse(reader.result);
            try {
              this.diagram = Diagram.fromJSON(data);
            } catch (e) {
              this.$buefy.notification.open({
                type: "is-danger",
                message: `${this.$t("message.failedToLoadJSON").toString()}<br>${file.name}`,
              });
            }
            this.viewState = new ViewState();
            this.updateAppSize();
            this.viewState.diagramFileName = file.name;
            this.updateY();
          }
        };
      }
    };
    input.click();
  }

  onDownloadButtonClick(): void {
    const json = JSON.stringify(this.diagram);
    const blob = new Blob([ json ], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = this.viewState.diagramFileName;
    a.click();
  }

  updateAppSize(): void {
    const viewElem = document.getElementById("view-pane");
    if (viewElem) {
      this.viewState.viewWidth = viewElem.clientWidth;
      this.viewState.viewHeight = viewElem.clientHeight;
      this.viewState.appHeight = document.getElementById("app")?.clientHeight || 0;
    }
  }

  updateY(): void {
    const stations = this.stationsInMileageOrder;
    if (stations.length == 0) {
      return;
    }

    const initialMileage = stations[0].mileage;
    for (const s of stations) {
      s.mileage = s.mileage - initialMileage;
    }

    let y = this.diagram.config.plotPaneVerticalPadding;
    let lastMileage = 0;
    for (const s of stations) {
      y += (s.mileage - lastMileage) * this.diagram.config.yScale;
      const sy = s.floating ? s.topRelY : y;
      s.topRelY = sy;
      if (s.expanded) {
        s.tracks.forEach((t, i) => {
          t.relY = sy + (i + 1) * this.diagram.config.trackLineSpan;
        });
        s.bottomRelY = sy + (s.tracks.length + 1) * this.diagram.config.trackLineSpan;
        y += (s.tracks.length + 1) * this.diagram.config.trackLineSpan;
      } else {
        Object.values(s.tracks).forEach(t => t.relY = sy);
        s.bottomRelY = sy;
      }
      lastMileage = s.mileage;
    }

    this.viewState.maxRelY = stations[stations.length - 1].bottomRelY + this.diagram.config.plotPaneVerticalPadding;
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
#view-pane {
  flex: 1 0 0;
}
#stage-pane {
  width: 100% !important;
  height: 100% !important;
}
#ui-pane {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}
#ui-pane > * {
  position: absolute;
  pointer-events: initial;
}
#ui-pane span.icon {
  cursor: pointer;
  overflow: hidden;
}
#nav-pane {
  flex: 0 0 auto;
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
