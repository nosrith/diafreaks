<template>
  <div class="diagram-view">
    <stage class="diagram-view-stage" @stationNameInputStart="onStationNameInputStart" @trackNameInputStart="onTrackNameInputStart"></stage>
    <div class="diagram-view-ui">
      <station-name-input ref="stationNameInput"></station-name-input>
      <track-name-input ref="trackNameInput"></track-name-input>
      <station-expand-button
        v-for="s in Object.values(diagram.stations)" :key="`station-expand-button-${s.id}`" 
        :station="s" 
        @trackNameInputStart="onTrackNameInputStart"></station-expand-button>
      <station-remove-button
        v-for="s in Object.values(diagram.stations)" :key="`station-remove-button-${s.id}`"
        :station="s"></station-remove-button>
      <station-add-track-button
        v-for="s in Object.values(diagram.stations)" :key="`station-add-track-button-${s.id}`" 
        :station="s" 
        @trackNameInputStart="onTrackNameInputStart"></station-add-track-button>
      <template v-for="s in Object.values(diagram.stations)">
        <station-remove-track-button
          v-for="t in s.tracks" :key="`station-remove-track-button-${s.id}-${t.id}`"
          :station="s" :track="t"></station-remove-track-button>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, ProvideReactive, Vue } from "vue-property-decorator";
import DiagramViewContext from "@/data/DiagramViewContext";
import Stage from "./Stage.vue";
import StationAddTrackButton from "./StationAddTrackButton.vue";
import StationExpandButton from "./StationExpandButton.vue";
import StationNameInput from "./StationNameInput.vue";
import StationRemoveButton from "./StationRemoveButton.vue";
import StationRemoveTrackButton from "./StationRemoveTrackButton.vue";
import TrackNameInput from "./TrackNameInput.vue";

@Component({
  components: {
    Stage, 
    StationAddTrackButton, 
    StationExpandButton, 
    StationNameInput, 
    StationRemoveButton, 
    StationRemoveTrackButton, 
    TrackNameInput
  },
})
export default class DiagramView extends Vue {
  @Prop({ default: new DiagramViewContext() }) @ProvideReactive() private context!: DiagramViewContext;
  private get diagram() { return this.context.diagram; }
  private get viewConfig() { return this.context.config; }
  private get viewState() { return this.context.state; }

  private mounted(): void {
    const resizeObserver = new ResizeObserver(this.updateViewSize);
    resizeObserver.observe(this.$el);
  }

  private onStationNameInputStart(): void {
    this.$nextTick(() => ((this.$refs.stationNameInput as Vue).$el as HTMLInputElement).focus());
  }

  private onTrackNameInputStart(): void {
    this.$nextTick(() => ((this.$refs.trackNameInput as Vue).$el as HTMLInputElement).focus());
  }

  private updateViewSize(): void {
    if (this.$el) {
      this.viewState.viewWidth = this.$el.clientWidth;
      this.viewState.viewHeight = this.$el.clientHeight;
        this.diagram.config.scrollX = 
          Math.max(this.diagram.config.minPlotTime * this.diagram.config.xScale - this.viewConfig.plotPanePadding, 
            Math.min(this.diagram.config.maxPlotTime * this.diagram.config.xScale - (this.viewState.viewWidth - this.diagram.config.leftPaneWidth - this.viewConfig.plotPanePadding),
              this.diagram.config.scrollX));
        this.diagram.config.scrollY = 
          Math.max(0, Math.min(this.context.getYByRelY(this.diagram.maxRelY), 
            this.diagram.config.scrollY));
    }
  }
}
</script>

<style lang="scss" scoped>
.diagram-view {
  position: relative;
  overflow: hidden;
}
.diagram-view-stage {
  width: 100% !important;
  height: 100% !important;
}
.diagram-view-ui {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}
.diagram-view-ui > * {
  position: absolute;
  pointer-events: initial;
}
.diagram-view-ui span.icon {
  cursor: pointer;
  overflow: hidden;
}
</style>
