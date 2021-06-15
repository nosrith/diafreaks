<template>
  <b-icon v-if="viewConfig.editMode && isTopLineIntersectingPlotPane" icon="close" size="is-small" :style="style" @click.native="onClick"></b-icon>
</template>

<script lang="ts">
import { Component, Inject, InjectReactive, Prop, Vue } from "vue-property-decorator";
import HistoryManager from "@/HistoryManager";
import Diagram from "@/data/Diagram";
import Station from "@/data/Station";
import StopEvent from "@/data/StopEvent";
import Train from "@/data/Train";
import ViewConfig from "@/data/ViewConfig";
import ViewState from "@/data/ViewState";

@Component
export default class StationRemoveButton extends Vue {
  @InjectReactive() viewConfig!: ViewConfig;
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;
  @Inject() historyManager!: HistoryManager;
  @Prop() station!: Station;

  get style(): unknown {
    return {
      left: `${this.diagram.config.leftPaneWidth - this.diagram.config.stationLabelRightMargin}px`,
      top: `${this.diagram.getYByRelY(this.station.topRelY) - this.diagram.config.trackLineSpan}px`,
      height: `${this.diagram.config.trackLineSpan}px`,
    };
  }

  get isTopLineIntersectingPlotPane(): boolean {
    return this.diagram.getYByRelY(this.station.topRelY) >= this.diagram.config.topPaneHeight && 
      this.diagram.getYByRelY(this.station.topRelY) < this.viewState.viewHeight;
  }

  onClick(): void {
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
      this.$emit("updateY");

      this.historyManager.push({
        undo: () => { 
          this.$set(this.diagram.stations, this.station.id, this.station);
          removingTrains.forEach(train => this.diagram.addNewTrain(train)); 
          removingStevs.forEach(e => e.stev.train.addNewStopEvent(e.stev, e.index));
          this.$emit("updateY");
        },
        redo: () => { 
          removingStevs.forEach(e => e.stev.train.removeStopEvent(e.stev));
          removingTrains.forEach(train => this.diagram.removeTrain(train)); 
          this.$delete(this.diagram.stations, this.station.id); 
          this.$emit("updateY");
        }
      });
    }
  }
}
</script>

<style scoped lang="scss">
</style>
