<template>
  <v-group :config="groupConfig">
    <v-line v-if="viewState.drawingState" :config="drawingLineConfig"></v-line>
    <v-rect :config="rectConfig"></v-rect>
    <v-text :config="labelConfig"></v-text>
  </v-group>
</template>

<script lang="ts">
import { Component, InjectReactive, Vue } from "vue-property-decorator";
import { getTimeText } from "@/utils";
import Diagram from "@/data/Diagram";
import ViewConfig from "@/data/ViewConfig";
import ViewState from "@/data/ViewState";

@Component
export default class TrainPathGroup extends Vue {
  @InjectReactive() viewConfig!: ViewConfig;
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;

  get groupConfig(): unknown {
    return {
      visible: this.viewState.pointerTargetLine != null && (Object.keys(this.viewState.trainSelections).length == 0 || this.viewState.drawingState != null),
    };
  }

  get rectConfig(): unknown {
    const width = this.viewState.drawingState ? this.viewConfig.selectedTrainPathMarkerWidth : this.viewConfig.pointerWidth;
    return {
      x: this.diagram.getXByTime(this.viewState.pointerTime) - width * 0.5,
      y: this.viewState.pointerY - width * 0.5,
      width: width,
      height: width,
      fill: this.viewState.pointerOnMarker || this.viewState.drawingState ? this.viewConfig.pointerOnMarkerColor : this.viewConfig.pointerColor,
      listening: false,
    };
  }

  get labelConfig(): unknown {
    const time = this.viewState.pointerTime >= 0 ? 
      this.viewState.pointerTime : 
      this.viewState.pointerTime + Math.ceil(-this.viewState.pointerTime / 3600) * 3600;
    return {
      x: this.diagram.getXByTime(this.viewState.pointerTime),
      y: this.viewState.pointerY - this.viewConfig.pointerLabelFontSize,
      height: this.viewConfig.pointerLabelFontSize,
      text: getTimeText(time, this.viewState.pointerPreciseState != null),
      fontSize: this.viewConfig.pointerLabelFontSize,
      fontFamily: this.diagram.config.fontFamily,
      fill: this.viewState.pointerOnMarker || this.viewState.drawingState ? this.viewConfig.pointerOnMarkerColor : this.viewConfig.pointerColor,
      align: "left",
      verticalAlign: "bottom",
      listening: false,
    }
  }

  get drawingLineConfig(): unknown {
    const drawingState = this.viewState.drawingState;
    if (drawingState) {  // always true
      const train = this.diagram.trains[drawingState.trainId];
      const stop = train.stops.find(s => s.id == drawingState.lastStopId);
      if (stop) {
        return {
          points: [  
            this.diagram.getXByTime(this.viewState.pointerTime),
            this.viewState.pointerY,
            this.diagram.getXByTime(drawingState.direction > 0 ? stop.depTime : stop.arrTime),
            this.diagram.getYByRelY(this.diagram.stations[stop.stationId].tracks.find(t => t.id == stop.trackId)?.relY ?? 0)
          ],
          stroke: this.viewConfig.selectedTrainPathColor,
          strokeWidth: this.diagram.config.trainPathWidth * this.viewConfig.selectedTrainPathWidthScale,
        };
      } else {
        return {};
      }
    } else {
      return {};
    }
  }
}
</script>

<style scoped lang="scss">
</style>
