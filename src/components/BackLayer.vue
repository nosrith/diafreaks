<template>
  <v-layer id="back-layer">
    <v-group v-for="t in timeGridLines" :key="t.key">
      <v-line :config="t.lineConfig"></v-line>
      <v-text v-if="t.labelConfig" :config="t.labelConfig"></v-text>
    </v-group>
    <station-group v-for="s in Object.values(diagram.stations)" :key="`station-${s.id}`" :station="s" v-on="$listeners"></station-group>
  </v-layer>
</template>

<script lang="ts">
import { Component, InjectReactive, Vue } from "vue-property-decorator";
import DiagramViewContext from "@/data/DiagramViewContext";
import StationGroup from "./StationGroup.vue";

@Component({
  components: {
    StationGroup
  },
})
export default class BackLayer extends Vue {
  @InjectReactive() private context!: DiagramViewContext;
  private get diagram() { return this.context.diagram; }
  private get viewState() { return this.context.state; }

  private get timeGridLines(): unknown {
    const lines = [];
    const scrollLeftTime = this.diagram.config.scrollX / this.diagram.config.xScale;
    let t = Math.ceil(scrollLeftTime / this.diagram.config.minorMinutelyGridLineSpan) * this.diagram.config.minorMinutelyGridLineSpan;
    let x = this.context.getXByTime(t);
    while (x < this.viewState.viewWidth) {
      lines.push({
        key: `time-grid-line-${lines.length}`,
        lineConfig: {
          points: [
            x,
            this.diagram.config.topPaneHeight,
            x,
            this.viewState.viewHeight
          ],
          stroke:
            t % 3600 == 0 ? this.diagram.config.hourlyGridLineColor :
            t % this.diagram.config.majorMinutelyGridLineSpan == 0 ? this.diagram.config.majorMinutelyGridLineColor :
            this.diagram.config.minorMinutelyGridLineColor,
          strokeWidth: 
            t % 3600 == 0 ? this.diagram.config.hourlyGridLineWidth :
            t % this.diagram.config.majorMinutelyGridLineSpan == 0 ? this.diagram.config.majorMinutelyGridLineWidth :
            this.diagram.config.minorMinutelyGridLineWidth,
          listening: false,
        },
        labelConfig: t % 3600 != 0 ? null : {
          x: x - this.diagram.config.hourlyLabelFontSize,
          y: this.diagram.config.topPaneHeight - this.diagram.config.hourlyLabelBottomMargin - this.diagram.config.hourlyLabelFontSize,
          width: this.diagram.config.hourlyLabelFontSize * 2,
          height: this.diagram.config.hourlyLabelFontSize,
          text: `${ t / 3600 % 24 }`,
          fontSize: this.diagram.config.hourlyLabelFontSize,
          fontFamily: this.diagram.config.fontFamily,
          fill: this.diagram.config.hourlyLabelColor,
          align: "center",
          verticalAlign: "bottom",
        }
      });
      t += this.diagram.config.minorMinutelyGridLineSpan;
      x = this.context.getXByTime(t);
    }
    return lines;
  }
}
</script>

<style scoped lang="scss">
</style>
