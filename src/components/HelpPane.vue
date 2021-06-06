<template>
  <b-carousel :autoplay="false" :indicator-inside="false">
    <b-carousel-item>
      <div class="container">
        <p v-html="$t('message.useDoubleClickToAddNewItem')"></p>
        <div class="level">
          <div class="level-item has-text-centered">
            <img src="@/assets/help_add_station.png">
            <p v-html="$t('message.addStationUsingDoubleClick')"></p>
          </div>
          <div class="level-item has-text-centered">
            <img src="@/assets/help_add_train.png">
            <p v-html="$t('message.addTrainUsingDoubleClick')"></p>
          </div>
        </div>
      </div>
    </b-carousel-item>
  </b-carousel>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class HelpPane extends Vue {
}
</script>

<style lang="scss" scoped>
.container {
  padding: 0.5rem;
}
.container > p {
  text-align: center;
}
.level {
  align-items: start;
}
.level-item {
  flex-direction: column;
}
.level-item img {
  display: block;
}
</style>
