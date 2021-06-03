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
    <b-navbar id="nav-pane">
      <template #brand>
        <b-navbar-item>Diafreaks</b-navbar-item>
      </template>
      <template #start>
        <b-navbar-item tag="div">
          <div class="buttons">
            <b-button size="is-medium" icon-left="pencil-outline" :class="{ 'is-primary': viewState.editMode }" @click="onEditButtonClick"></b-button>
          </div>
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

    let y = 0;
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

    this.viewState.maxRelY = stations[stations.length - 1].bottomRelY;
  }
}
</script>

<style lang="scss">
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
  overflow: hidden;
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
#nav-pane .button:focus, #nav-pane .button.is-focused {
  border-color: inherit;
  box-shadow: inherit;
}
</style>
