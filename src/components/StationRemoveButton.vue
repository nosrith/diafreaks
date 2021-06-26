<template>
  <b-icon v-if="viewState.editMode && isTopLineIntersectingPlotPane" icon="close" size="is-small" :style="style" @click.native="onClick"></b-icon>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import DiagramViewContext from "@/data/DiagramViewContext";
import Station from "@/data/Station";
import StopEvent from "@/data/StopEvent";
import Train from "@/data/Train";

@Component
export default class StationRemoveButton extends Vue {
  @InjectReactive() private context!: DiagramViewContext;
  private get diagram() { return this.context.diagram; }
  private get viewConfig() { return this.context.config; }
  private get viewState() { return this.context.state; }
  @Prop() private station!: Station;

  private get style(): unknown {
    return {
      left: `${this.diagram.config.leftPaneWidth - this.viewConfig.stationLabelRightMargin}px`,
      top: `${this.context.getYByRelY(this.station.topRelY) - this.viewConfig.trackLineSpan}px`,
      height: `${this.viewConfig.trackLineSpan}px`,
    };
  }

  private get isTopLineIntersectingPlotPane(): boolean {
    return this.context.getYByRelY(this.station.topRelY) >= this.viewConfig.topPaneHeight && 
      this.context.getYByRelY(this.station.topRelY) < this.viewState.viewHeight;
  }

  private onClick(): void {
    if (!this.viewState.busy) {
      const removingTrains: Train[] = [];
      const removingStevs: { stev: StopEvent, index: number }[] = [];
      for (const train of Object.values(this.diagram.trains)) {
        for (let i = 0; i < train.stevs.length; ++i) {
          const stev = train.stevs[i];
          if (stev.station == this.station) {
            removingStevs.push({ stev, index: i });
            if (train.stevs.length <= 1) {
              removingTrains.push(train);
            }
          }
        }
      }

      removingStevs.forEach(e => e.stev.train.removeStopEvent(e.stev));
      removingTrains.forEach(train => this.diagram.removeTrain(train)); 
      this.$delete(this.diagram.stations, this.station.id);
      this.context.updateY();

      this.context.history.push({
        this: this,
        undo: () => { 
          this.$set(this.diagram.stations, this.station.id, this.station);
          removingTrains.forEach(train => this.diagram.addNewTrain(train)); 
          removingStevs.forEach(e => e.stev.train.addNewStopEvent(e.stev, e.index));
          this.context.updateY();
        },
        redo: () => { 
          removingStevs.forEach(e => e.stev.train.removeStopEvent(e.stev));
          removingTrains.forEach(train => this.diagram.removeTrain(train)); 
          this.$delete(this.diagram.stations, this.station.id); 
          this.context.updateY();
        }
      });
    }
  }
}
</script>

<style scoped lang="scss">
</style>
