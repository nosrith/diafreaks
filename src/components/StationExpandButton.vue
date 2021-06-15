<template>
  <b-icon v-if="isBottomLineIntersectingPlotPane" :icon="icon" size="is-small" :style="style" @click.native="onClick"></b-icon>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import Diagram from "@/data/Diagram";
import Station from "@/data/Station";
import ViewState from "@/data/ViewState";

@Component
export default class StationExpandButton extends Vue {
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;
  @Prop() station!: Station;

  get icon(): string {
    return this.station.expanded ? "chevron-up" : "chevron-down";
  }

  get style(): unknown {
    return {
      left: `${this.diagram.config.stationLabelLeftMargin}px`,
      top: `${this.diagram.getYByRelY(this.station.bottomRelY)}px`,
      height: `${this.diagram.config.trackLineSpan}px`,
    };
  }

  get isBottomLineIntersectingPlotPane(): boolean {
    return this.diagram.getYByRelY(this.station.bottomRelY) >= this.diagram.config.topPaneHeight && 
      this.diagram.getYByRelY(this.station.bottomRelY) < this.viewState.viewHeight;
  }

  onClick(): void {
    if (!this.viewState.inputEnabled) {
      this.station.expanded = !this.station.expanded;
      this.diagram.updateY();
    }
  }
}
</script>

<style scoped lang="scss">
</style>
