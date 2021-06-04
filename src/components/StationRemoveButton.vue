<template>
  <b-icon v-if="isTopLineIntersectingPlotPane" icon="close" size="is-small" v-show="viewState.editMode" :style="style" @click.native="onClick"></b-icon>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import Diagram from "@/data/Diagram";
import Station from "@/data/Station";
import ViewState from "@/data/ViewState";

@Component
export default class StationRemoveButton extends Vue {
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;
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
    if (!this.viewState.isInputEnabled) {
      const refered = Object.values(this.diagram.trains).some(t => t.stops.some(s => s.stationId == this.station.id));
      if (refered) {
        this.$buefy.dialog.confirm({
          message: this.$t("message.confirmRemoveStationRefered").toString(),
          onConfirm: () => {
            Object.values(this.diagram.trains).forEach(t => {
              t.stops.map((s, i) => s.stationId == this.station.id ? i : -1).filter(i => i >= 0).reverse()
                .forEach(i => t.stops.splice(i, 1))
            });
            this.$delete(this.diagram.stations, this.station.id);
            this.$emit("updateY");
          },
        });
      } else {
        this.$delete(this.diagram.stations, this.station.id);
        this.$emit("updateY");
      }
    }
  }
}
</script>

<style scoped lang="scss">
</style>
