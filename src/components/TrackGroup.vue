<template>
  <v-group v-if="isLineIntersectingPlotPane">
    <v-line :config="lineConfig"></v-line>
    <v-text :config="labelConfig" @click="onLabelClick" @mousedown="onLabelMouseDown"></v-text>
  </v-group>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import Diagram from "@/data/Diagram";
import ViewConfig from "@/data/ViewConfig";
import ViewState from "@/data/ViewState";
import Station from "@/data/Station";
import Track from "@/data/Track";
import { KonvaEventObject } from "konva/types/Node";

@Component
export default class TrackGroup extends Vue {
  @InjectReactive() viewConfig!: ViewConfig;
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;
  @Prop() station!: Station;
  @Prop() track!: Track;

  dragState: { sy0: number, dragging: boolean } | null = null;

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

  get isLineIntersectingPlotPane(): boolean {
    return this.diagram.getYByRelY(this.track.relY) >= this.diagram.config.topPaneHeight && 
      this.diagram.getYByRelY(this.track.relY) < this.viewState.viewHeight;
  }

  onLabelClick(): void {
    if (this.viewState.editMode && !this.viewState.isInputEnabled) {
      this.viewState.trackNameInputTarget = { stationId: this.station.id, trackId: this.track.id };
      this.$emit("trackNameInputStart");
    }
  }

  onLabelMouseDown(konvaEvent: KonvaEventObject<MouseEvent>): void {
    if (this.viewState.editMode) {
      this.dragState = { sy0: konvaEvent.evt.screenY, dragging: false };
      window.addEventListener("mousemove", this.onWindowMouseMove);
      window.addEventListener("mouseup", this.onWindowMouseUp);
    }
  }

  onWindowMouseMove(event: MouseEvent): void {
    if (this.dragState) {
      if (Math.abs(event.screenY - this.dragState.sy0) > 1) {
        this.dragState.dragging = true;
      }
      if (this.dragState.dragging) {
        const currentIndex = this.station.tracks.findIndex(t => t.id == this.track.id);
        this.station.tracks.splice(currentIndex, 1);

        const mouseRelY = this.diagram.getRelYByY(event.clientY);
        const newIndex = this.station.tracks.findIndex(t => mouseRelY < t.relY);
        if (newIndex < 0) {
          this.station.tracks.push(this.track);
        } else {
          this.station.tracks.splice(newIndex, 0, this.track);
        }
        this.$emit("updateY");
      }
    }
  }

  onWindowMouseUp(event: MouseEvent): void {
    if (this.dragState && this.dragState.dragging) {
      window.removeEventListener("mousemove", this.onWindowMouseMove);
      window.removeEventListener("mouseup", this.onWindowMouseUp);
      this.onWindowMouseMove(event);
      this.dragState = null;
    }
  }
}
</script>

<style scoped lang="scss">
</style>
