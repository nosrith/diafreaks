<template>
  <v-group v-if="isLineIntersectingTrainPathArea">
    <v-line :config="lineConfig"></v-line>
    <v-text :config="labelConfig" @click="onLabelClick"></v-text>
  </v-group>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import Diagram from "@/data/Diagram";
import ViewConfig from "@/data/ViewConfig";
import ViewState from "@/data/ViewState";
import Station from "@/data/Station";
import Track from "@/data/Track";

@Component
export default class TrackGroup extends Vue {
  @InjectReactive() viewConfig!: ViewConfig;
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;
  @Prop() station!: Station;
  @Prop() track!: Track;
  
  get lineConfig(): unknown {
    return {
      points: [
        this.diagram.config.stationLabelLeftMargin + this.diagram.config.trackLabelLeftMargin, 
        this.diagram.getYByRelY(this.track.relY), 
        this.viewState.viewWidth, 
        this.diagram.getYByRelY(this.track.relY)
      ],
      stroke: this.diagram.config.trackLineColor,
      strokeWidth: this.diagram.config.trackLineWidth,
      listening: false,
    }
  }

  get labelConfig(): unknown {
    return {
      id: `track-label-${this.station.id}-${this.track.id}`,
      x: this.diagram.config.stationLabelLeftMargin + this.diagram.config.trackLabelLeftMargin,
      y: this.diagram.getYByRelY(this.track.relY) - this.diagram.config.trackLabelFontSize,
      width: this.diagram.config.leftPaneWidth - this.diagram.config.stationLabelLeftMargin - this.diagram.config.trackLabelLeftMargin - this.diagram.config.stationLabelRightMargin,
      height: this.diagram.config.trackLabelFontSize,
      text: this.track.name,
      fontSize: this.diagram.config.trackLabelFontSize,
      fontFamily: this.diagram.config.fontFamily,
      fill: this.diagram.config.trackLabelColor,
      align: "left",
      verticalAlign: "bottom",
    }
  }

  get isLineIntersectingTrainPathArea(): boolean {
    return this.diagram.getYByRelY(this.track.relY) >= this.diagram.config.topPaneHeight && 
      this.diagram.getYByRelY(this.track.relY) < this.viewState.viewHeight;
  }

  onLabelClick(): void {
    if (this.viewState.editMode && !this.viewState.isInputEnabled) {
      this.viewState.trackNameInputTarget = { stationId: this.station.id, trackId: this.track.id };
      this.$emit("trackNameInputStart");
    }
  }
}
</script>

<style scoped lang="scss">
</style>
