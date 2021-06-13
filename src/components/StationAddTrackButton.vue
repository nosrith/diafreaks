<template>
  <b-icon v-if="viewConfig.editMode && station.expanded && isBottomLineIntersectingPlotPane" icon="plus" size="is-small" :style="style" @click.native="onClick"></b-icon>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import Diagram from "@/data/Diagram";
import Station from "@/data/Station";
import ViewConfig from "@/data/ViewConfig";
import ViewState from "@/data/ViewState";

@Component
export default class StationAddTrackButton extends Vue {
  @InjectReactive() viewConfig!: ViewConfig;
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;
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
    if (!this.viewState.isInputEnabled) {
      const newTrack = this.station.addNewTrack(this.diagram.genId(), "");
      this.$emit("updateY");

      this.viewState.trackNameInputTarget = { stationId: this.station.id, trackId: newTrack.id };
      this.$emit("trackNameInputStart");
    }
  }
}
</script>

<style scoped lang="scss">
</style>
