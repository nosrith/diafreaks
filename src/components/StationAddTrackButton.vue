<template>
  <b-icon v-if="viewConfig.editMode && station.expanded && isBottomLineIntersectingPlotPane" icon="plus" size="is-small" :style="style" @click.native="onClick"></b-icon>
</template>

<script lang="ts">
import { Component, Inject, InjectReactive, Prop, Vue } from "vue-property-decorator";
import HistoryManager from "@/HistoryManager";
import Diagram from "@/data/Diagram";
import Station from "@/data/Station";
import Track from "@/data/Track";
import ViewConfig from "@/data/ViewConfig";
import ViewState from "@/data/ViewState";

@Component
export default class StationAddTrackButton extends Vue {
  @InjectReactive() viewConfig!: ViewConfig;
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;
  @Inject() historyManager!: HistoryManager;
  @Prop() station!: Station;

  get style(): unknown {
    return {
      left: `${this.diagram.config.leftPaneWidth - this.diagram.config.stationLabelRightMargin}px`,
      top: `${this.diagram.getYByRelY(this.station.bottomRelY) - this.diagram.config.trackLineSpan}px`,
      height: `${this.diagram.config.trackLineSpan}px`,
    };
  }

  get isBottomLineIntersectingPlotPane(): boolean {
    return this.diagram.getYByRelY(this.station.bottomRelY) >= this.diagram.config.topPaneHeight && 
      this.diagram.getYByRelY(this.station.bottomRelY) < this.viewState.viewHeight;
  }

  onClick(): void {
    if (!this.viewState.inputEnabled) {
      const newTrack = this.station.addNewTrack(new Track(this.station, this.diagram.genId(), ""));
      this.$emit("updateY");

      this.historyManager.push({
        undo: () => { 
          this.station.removeTrack(newTrack); 
          this.$emit("updateY");
        },
        redo: () => { 
          this.station.addNewTrack(newTrack); 
          this.$emit("updateY");
        }
      });

      this.viewState.trackNameInputTarget = newTrack;
      this.$emit("trackNameInputStart");
    }
  }
}
</script>

<style scoped lang="scss">
</style>
