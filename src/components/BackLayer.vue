<template>
  <v-layer id="back-layer">
    <v-group v-for="t in timeGridLines" :key="t.key">
      <v-line :config="t.lineConfig"></v-line>
      <v-text v-if="t.labelConfig" :config="t.labelConfig"></v-text>
    </v-group>
    <station-group
      v-for="s in Object.values(diagram.stations)"
      :key="`station-${s.id}`"
      :station="s"
      v-on="$listeners"
    ></station-group>
  </v-layer>
</template>

<script lang="ts">
import { Component, InjectReactive, Vue } from "vue-property-decorator";
import DiagramViewContext from "@/data/DiagramViewContext";
import StationGroup from "./StationGroup.vue";

@Component({
  components: {
    StationGroup,
  },
})
export default class BackLayer extends Vue {
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

  private get timeGridLines(): unknown {
    const lines = [];
    const scrollLeftTime = this.diagram.config.scrollTime;
    let t =
      Math.ceil(scrollLeftTime / this.viewConfig.minorMinutelyGridLineSpan) *
      this.viewConfig.minorMinutelyGridLineSpan;
    let x = this.context.getXByTime(t);
    while (x < this.viewState.viewWidth) {
      lines.push({
        key: `time-grid-line-${lines.length}`,
        lineConfig: {
          points: [
            x,
            this.viewConfig.topPaneHeight * this.context.subScale,
            x,
            this.viewState.viewHeight,
          ],
          stroke:
            t % 3600 == 0
              ? this.viewConfig.hourlyGridLineColor
              : t % this.viewConfig.majorMinutelyGridLineSpan == 0
              ? this.viewConfig.majorMinutelyGridLineColor
              : this.viewConfig.minorMinutelyGridLineColor,
          strokeWidth:
            t % 3600 == 0
              ? this.viewConfig.hourlyGridLineWidth
              : t % this.viewConfig.majorMinutelyGridLineSpan == 0
              ? this.viewConfig.majorMinutelyGridLineWidth
              : this.viewConfig.minorMinutelyGridLineWidth,
          listening: false,
        },
        labelConfig:
          t % 3600 != 0
            ? null
            : {
                x:
                  x -
                  this.viewConfig.hourlyLabelFontSize * this.context.subScale,
                y:
                  (this.viewConfig.topPaneHeight -
                    this.viewConfig.hourlyLabelBottomMargin -
                    this.viewConfig.hourlyLabelFontSize) *
                  this.context.subScale,
                width:
                  this.viewConfig.hourlyLabelFontSize *
                  this.context.subScale *
                  2,
                height:
                  this.viewConfig.hourlyLabelFontSize * this.context.subScale,
                text: `${(t / 3600) % 24}`,
                fontSize:
                  this.viewConfig.hourlyLabelFontSize * this.context.subScale,
                fontFamily: this.viewConfig.fontFamily,
                fill: this.viewConfig.hourlyLabelColor,
                align: "center",
                verticalAlign: "bottom",
              },
      });
      t += this.viewConfig.minorMinutelyGridLineSpan;
      x = this.context.getXByTime(t);
    }
    return lines;
  }
}
</script>

<style scoped lang="scss">
</style>
