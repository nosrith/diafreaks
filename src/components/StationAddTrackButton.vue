<template>
  <b-icon v-if="viewState.editMode && station.expanded && isBottomLineIntersectingPlotPane" icon="plus" size="is-small" :style="style" @click.native="onClick"></b-icon>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import DiagramViewContext from "@/data/DiagramViewContext";
import Station from "@/data/Station";
import Track from "@/data/Track";

@Component
export default class StationAddTrackButton extends Vue {
  @InjectReactive() private context!: DiagramViewContext;
  private get diagram() { return this.context.diagram; }
  private get viewConfig() { return this.context.config; }
  private get viewState() { return this.context.state; }
  @Prop() private station!: Station;

  private get style(): unknown {
    return {
      left: `${this.diagram.config.leftPaneWidth - this.viewConfig.stationLabelRightMargin}px`,
      top: `${this.context.getYByRelY(this.station.bottomRelY) - this.diagram.config.trackLineSpan}px`,
      height: `${this.diagram.config.trackLineSpan}px`,
    };
  }

  private get isBottomLineIntersectingPlotPane(): boolean {
    return this.context.getYByRelY(this.station.bottomRelY) >= this.viewConfig.topPaneHeight && 
      this.context.getYByRelY(this.station.bottomRelY) < this.viewState.viewHeight;
  }

  private onClick(): void {
    if (!this.viewState.inputEnabled) {
      const newTrack = this.station.addNewTrack(new Track(this.station, this.diagram.genId(), ""));
      this.diagram.updateY();

      this.context.history.push({
        this: this,
        undo: () => { 
          this.station.removeTrack(newTrack); 
          this.diagram.updateY();
        },
        redo: () => { 
          this.station.addNewTrack(newTrack); 
          this.diagram.updateY();
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
