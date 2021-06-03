<template>
  <div class="station-icon-menu" :style="style">
    <station-add-track-button :station="station" v-on="$listeners"></station-add-track-button>
    <station-expand-button :station="station" v-on="$listeners"></station-expand-button>
  </div>
</template>

<script lang="ts">
import { Component, InjectReactive, Prop, Vue } from "vue-property-decorator";
import Diagram from "@/data/Diagram";
import Station from "@/data/Station";
import ViewState from "@/data/ViewState";
import StationAddTrackButton from "./StationAddTrackButton.vue";
import StationExpandButton from "./StationExpandButton.vue";

@Component({
  components: {
    StationAddTrackButton, StationExpandButton
  }
})
export default class StationIconMenu extends Vue {
  @InjectReactive() viewState!: ViewState;
  @InjectReactive() diagram!: Diagram;
  @Prop() station!: Station;

  get style(): unknown {
    return {
      right: `${this.viewState.viewWidth - this.diagram.config.leftPaneWidth + this.diagram.config.stationLabelRightMargin}px`,
      top: `${this.diagram.getYByRelY(this.station.bottomRelY)}px`,
    };
  }
}
</script>

<style scoped lang="scss">
</style>
