<template>
  <input v-model="targetStation.name" v-show="viewState.stationNameInputTarget" :style="style" @keypress.enter="onComplete" @blur="onComplete">
</template>

<script lang="ts">
import { Component, InjectReactive, Vue } from "vue-property-decorator";
import Diagram from "@/data/Diagram";
import Station from "@/data/Station";
import ViewState from "@/data/ViewState";

@Component
export default class StationNameInput extends Vue {
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;

  get targetStation(): Station | Record<string, never> {
    return this.viewState.stationNameInputTarget ? this.diagram.stations[this.viewState.stationNameInputTarget.stationId] : {};
  }

  get style(): unknown {
    return {
      left: `${this.diagram.config.stationLabelLeftMargin}px`,
      top: `${this.diagram.getYByRelY(this.targetStation.topRelY) - this.diagram.config.stationLabelFontSize - 4}px`,
      width: `${this.diagram.config.leftPaneWidth - this.diagram.config.stationLabelLeftMargin - this.diagram.config.stationLabelRightMargin}px`,
      height: `${this.diagram.config.stationLabelFontSize + 4}px`,
      paddingTop: "2px",
      lineHeight: `${this.diagram.config.stationLabelFontSize}px`,
      border: "none",
      fontSize: `${this.diagram.config.stationLabelFontSize}px`,
    };
  }

  onComplete(): void {
    this.viewState.stationNameInputTarget = null;
  }
}
</script>

<style scoped lang="scss">
</style>
