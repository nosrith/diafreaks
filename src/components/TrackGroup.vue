<template>
  <v-group v-if="isLineIntersectingPlotPane">
    <v-line :config="lineConfig"></v-line>
    <v-text :config="labelConfig" @click="onLabelClick" @mousedown="onLabelMouseDown"></v-text>
  </v-group>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import DiagramViewContext from "@/data/DiagramViewContext";
import Station from "@/data/Station";
import Track from "@/data/Track";
import { KonvaEventObject } from "konva/types/Node";

@Component
export default class TrackGroup extends Vue {
  @InjectReactive() private context!: DiagramViewContext;
  private get diagram() { return this.context.diagram; }
  private get viewState() { return this.context.state; }
  @Prop() private station!: Station;
  @Prop() private track!: Track;

  private dragState: { sy0: number, index0: number, dragging: boolean } | null = null;

  private get lineConfig(): unknown {
    return {
      points: [
        this.diagram.config.stationLabelLeftMargin + this.diagram.config.trackLabelLeftMargin, 
        this.context.getYByRelY(this.track.relY), 
        this.viewState.viewWidth, 
        this.context.getYByRelY(this.track.relY)
      ],
      stroke: this.diagram.config.trackLineColor,
      strokeWidth: this.diagram.config.trackLineWidth,
      listening: false,
    }
  }

  private get labelConfig(): unknown {
    return {
      id: `track-label-${this.station.id}-${this.track.id}`,
      x: this.diagram.config.stationLabelLeftMargin + this.diagram.config.trackLabelLeftMargin,
      y: this.context.getYByRelY(this.track.relY) - this.diagram.config.trackLabelFontSize,
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

  private get isLineIntersectingPlotPane(): boolean {
    return this.context.getYByRelY(this.track.relY) >= this.diagram.config.topPaneHeight && 
      this.context.getYByRelY(this.track.relY) < this.viewState.viewHeight;
  }

  private onLabelClick(): void {
    if (this.viewState.editMode && !this.viewState.busy && !this.dragState?.dragging) {
      this.viewState.trackNameInputTarget = this.track;
      this.$emit("trackNameInputStart");
    }
  }

  private onLabelMouseDown(konvaEvent: KonvaEventObject<MouseEvent>): void {
    if (this.viewState.editMode) {
      this.dragState = { 
        sy0: konvaEvent.evt.screenY, 
        index0: this.station.tracks.indexOf(this.track), 
        dragging: false 
      };
      window.addEventListener("mousemove", this.onWindowMouseMove);
      window.addEventListener("mouseup", this.onWindowMouseUp);
    }
  }

  private onWindowMouseMove(event: MouseEvent): void {
    if (this.dragState) {
      if (Math.abs(event.screenY - this.dragState.sy0) > 1) {
        this.dragState.dragging = true;
      }
      if (this.dragState.dragging) {
        this.station.removeTrack(this.track);

        const mouseRelY = this.context.getRelYByY(event.clientY);
        const newIndex = this.station.tracks.findIndex(t => mouseRelY < t.relY);
        if (newIndex < 0) {
          this.station.tracks.push(this.track);
        } else {
          this.station.tracks.splice(newIndex, 0, this.track);
        }
        this.diagram.updateY();
      }
    }
  }

  private onWindowMouseUp(event: MouseEvent): void {
    if (this.dragState) {
      window.removeEventListener("mousemove", this.onWindowMouseMove);
      window.removeEventListener("mouseup", this.onWindowMouseUp);
      this.onWindowMouseMove(event);

      const index0 = this.dragState.index0;
      const index1 = this.station.tracks.indexOf(this.track);
      if (index0 != index1) {
        this.context.history.push({
          this: this,
          undo: () => { 
            this.station.removeTrack(this.track); 
            this.station.addNewTrack(this.track, index0); 
          },
          redo: () => {
            this.station.removeTrack(this.track); 
            this.station.addNewTrack(this.track, index1); 
          }
        });
      }

      this.dragState = null;
    }
  }
}
</script>

<style scoped lang="scss">
</style>
