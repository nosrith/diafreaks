<template>
  <b-icon v-if="isLineIntersectingPlotPane" icon="close" size="is-small" v-show="viewState.editMode && station.expanded && Object.values(station.tracks).length > 1" :style="style" @click.native="onClick"></b-icon>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import Diagram from "@/data/Diagram";
import Station from "@/data/Station";
import Track from "@/data/Track";
import ViewState from "@/data/ViewState";

@Component
export default class StationRemoveTrackButton extends Vue {
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;
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
    if (!this.viewState.isInputEnabled) {
      const refered = Object.values(this.diagram.trains).some(t => t.stevs.some(s => s.stationId == this.station.id && s.trackId == this.track.id));
      if (refered) {
        this.$buefy.dialog.confirm({
          message: this.$t("message.confirmRemoveTrackRefered").toString(),
          onConfirm: () => {
            Object.values(this.diagram.trains).forEach(t => {
              t.stevs.map((s, i) => s.stationId == this.station.id && s.trackId == this.track.id ? i : -1).filter(i => i >= 0).reverse()
                .forEach(i => t.stevs.splice(i, 1))
            });
            this.$delete(this.station.tracks, this.track.id);
            this.$emit("updateY");
          },
        });
      } else {
        this.$delete(this.station.tracks, this.track.id);
        this.$emit("updateY");
      }
    }
  }
}
</script>

<style scoped lang="scss">
</style>
