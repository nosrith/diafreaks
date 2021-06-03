<template>
  <b-icon :icon="icon" size="is-small" :style="style" @click.native="onClick"></b-icon>
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

  onClick(): void {
    if (!this.viewState.isInputEnabled) {
      this.$set(this.station, "expanded", !this.station.expanded);
      this.$emit("updateY");
    }
  }
}
</script>

<style scoped lang="scss">
</style>
