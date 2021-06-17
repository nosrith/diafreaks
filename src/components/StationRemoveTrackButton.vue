<template>
  <b-icon v-if="viewState.editMode && station.expanded && Object.values(station.tracks).length > 1 && isLineIntersectingPlotPane" icon="close" size="is-small" :style="style" @click.native="onClick"></b-icon>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import DiagramViewContext from "@/data/DiagramViewContext";
import Station from "@/data/Station";
import StopEvent from "@/data/StopEvent";
import Track from "@/data/Track";
import Train from "@/data/Train";

@Component
export default class StationRemoveTrackButton extends Vue {
  @InjectReactive() private context!: DiagramViewContext;
  private get diagram() { return this.context.diagram; }
  private get viewState() { return this.context.state; }

  @Prop() private station!: Station;
  @Prop() private track!: Track;

  private get style(): unknown {
    return {
      left: `${this.diagram.config.leftPaneWidth - this.diagram.config.stationLabelRightMargin}px`,
      top: `${this.context.getYByRelY(this.track.relY) - this.diagram.config.trackLineSpan}px`,
      height: `${this.diagram.config.trackLineSpan}px`,
    };
  }

  private get isLineIntersectingPlotPane(): boolean {
    return this.context.getYByRelY(this.track.relY) >= this.diagram.config.topPaneHeight && 
      this.context.getYByRelY(this.track.relY) < this.viewState.viewHeight;
  }

  private onClick(): void {
    if (!this.viewState.busy) {
      const removingTrains: Train[] = [];
      const removingStevs: { stev: StopEvent, index: number }[] = [];
      for (const train of Object.values(this.diagram.trains)) {
        for (let i = 0; i < train.stevs.length; ++i) {
          const stev = train.stevs[i];
          if (stev.track == this.track) {
            removingStevs.push({ stev, index: i });
            if (train.stevs.length <= 1) {
              removingTrains.push(train);
            }
          }
        }
      }
      const trackIndex = this.station.tracks.indexOf(this.track);

      removingStevs.forEach(e => e.stev.train.removeStopEvent(e.stev));
      removingTrains.forEach(train => this.diagram.removeTrain(train)); 
      this.station.removeTrack(this.track);
      this.diagram.updateY();

      this.context.history.push({
        this: this,
        undo: () => { 
          this.station.addNewTrack(this.track, trackIndex); 
          removingTrains.forEach(train => this.diagram.addNewTrain(train)); 
          removingStevs.forEach(e => e.stev.train.addNewStopEvent(e.stev, e.index));
          this.diagram.updateY();
        },
        redo: () => { 
          removingStevs.forEach(e => e.stev.train.removeStopEvent(e.stev));
          removingTrains.forEach(train => this.diagram.removeTrain(train)); 
          this.station.removeTrack(this.track);
          this.diagram.updateY();
        }
      });
    }
  }
}
</script>

<style scoped lang="scss">
</style>
