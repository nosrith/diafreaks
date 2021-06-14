<template>
  <b-icon v-if="viewConfig.editMode && station.expanded && Object.values(station.tracks).length > 1 && isLineIntersectingPlotPane" icon="close" size="is-small" :style="style" @click.native="onClick"></b-icon>
</template>

<script lang="ts">
import { Component, Inject, InjectReactive, Prop, Vue } from "vue-property-decorator";
import HistoryManager from "@/HistoryManager";
import Diagram from "@/data/Diagram";
import Station from "@/data/Station";
import StopEvent from "@/data/StopEvent";
import Track from "@/data/Track";
import Train from "@/data/Train";
import ViewConfig from "@/data/ViewConfig";
import ViewState from "@/data/ViewState";

@Component
export default class StationRemoveTrackButton extends Vue {
  @InjectReactive() viewConfig!: ViewConfig;
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;
  @Inject() historyManager!: HistoryManager;
  @Prop() station!: Station;
  @Prop() track!: Track;

  get style(): unknown {
    return {
      left: `${this.diagram.config.leftPaneWidth - this.diagram.config.stationLabelRightMargin}px`,
      top: `${this.diagram.getYByRelY(this.track.relY) - this.diagram.config.trackLineSpan}px`,
      height: `${this.diagram.config.trackLineSpan}px`,
    };
  }

  get isLineIntersectingPlotPane(): boolean {
    return this.diagram.getYByRelY(this.track.relY) >= this.diagram.config.topPaneHeight && 
      this.diagram.getYByRelY(this.track.relY) < this.viewState.viewHeight;
  }

  onClick(): void {
    if (!this.viewState.busy) {
      const removingTrains: Train[] = [];
      const removingStevs: { stev: StopEvent, index: number }[] = [];
      for (const train of Object.values(this.diagram.trains)) {
        for (let i = train.stevs.length - 1; i >= 0; --i) {
          const stev = train.stevs[i];
          if (stev.track == this.track) {
            train.removeStopEvent(stev);
            removingStevs.push({ stev, index: i });
            if (train.stevs.length <= 1) {
              this.diagram.removeTrain(train);
              removingTrains.push(train);
            }
          }
        }
      }
      removingStevs.reverse();
      const trackIndex = this.station.tracks.indexOf(this.track);

      this.station.removeTrack(this.track);

      this.historyManager.push({
        undo: () => { 
          this.station.addNewTrack(this.track, trackIndex); 
          removingTrains.forEach(train => this.diagram.addNewTrain(train)); 
          removingStevs.forEach(e => e.stev.train.addNewStopEvent(e.stev, e.index));
        },
        redo: () => { 
          removingStevs.forEach(e => e.stev.train.removeStopEvent(e.stev));
          removingTrains.forEach(train => this.diagram.removeTrain(train)); 
          this.station.removeTrack(this.track);
        }
      });
      this.$emit("updateY");
    }
  }
}
</script>

<style scoped lang="scss">
</style>
