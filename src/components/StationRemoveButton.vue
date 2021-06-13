<template>
  <b-icon v-if="viewConfig.editMode && isTopLineIntersectingPlotPane" icon="close" size="is-small" :style="style" @click.native="onClick"></b-icon>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import Diagram from "@/data/Diagram";
import Station from "@/data/Station";
import ViewConfig from "@/data/ViewConfig";
import ViewState from "@/data/ViewState";

@Component
export default class StationRemoveButton extends Vue {
  @InjectReactive() viewConfig!: ViewConfig;
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
      const refered = Object.values(this.diagram.trains).some(t => t.stevs.some(stev => stev.station == this.station));
      if (refered) {
        this.$buefy.dialog.confirm({
          message: this.$t("message.confirmRemoveStationRefered").toString(),
          onConfirm: () => {
            Object.values(this.diagram.trains).forEach(t => {
              t.stevs.filter(stev => stev.station == this.station)
                .forEach(stev => stev.train.removeStopEvent(stev))
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
