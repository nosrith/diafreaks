<template>
  <b-icon
    v-if="isBottomLineIntersectingPlotPane"
    :icon="icon"
    size="is-small"
    :style="style"
    @click.native="onClick"
  ></b-icon>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import DiagramViewContext from "@/data/DiagramViewContext";
import Station from "@/data/Station";

@Component
export default class StationExpandButton extends Vue {
  @InjectReactive() private context!: DiagramViewContext;
  private get diagram() {
    return this.context.diagram;
  }
  private get viewConfig() {
    return this.context.config;
  }
  private get viewState() {
    return this.context.state;
  }
  @Prop() private station!: Station;

  private get icon(): string {
    return this.station.expanded ? "chevron-up" : "chevron-down";
  }

  private get style(): unknown {
    return {
      left: `${
        this.viewConfig.stationLabelLeftMargin * this.context.subScale
      }px`,
      top: `${this.context.getYByRelY(this.station.bottomRelY)}px`,
      height: `${this.viewConfig.trackLineSpan}px`,
    };
  }

  private get isBottomLineIntersectingPlotPane(): boolean {
    return (
      this.context.getYByRelY(this.station.bottomRelY) >=
        this.viewConfig.topPaneHeight * this.context.subScale &&
      this.context.getYByRelY(this.station.bottomRelY) <
        this.viewState.viewHeight
    );
  }

  private onClick(): void {
    if (!this.viewState.inputEnabled) {
      this.station.expanded = !this.station.expanded;
      this.context.updateY();
    }
  }
}
</script>

<style scoped lang="scss">
</style>
