<template>
  <b-carousel :autoplay="false" :indicator-inside="false">
    <b-carousel-item>
      <div class="help-item">
        <img src="@/assets/help_add_new_item.png">
        <div class="help-desc content">
          <h5 class="title is-5" v-html="$t('message.help.toAddNewItem')"></h5>
          <p v-html="$t('message.help.doubleClickToAddNewItem')"></p>
          <ul>
            <li v-html="$t('message.help.doubleClickToAddStation')"></li>
            <li v-html="$t('message.help.doubleClickToAddTrain')"></li>
          </ul>
        </div>
      </div>
    </b-carousel-item>
    <b-carousel-item>
      <div class="help-item">
        <img src="@/assets/help_select_trains.png">
        <div class="help-desc content">
          <h5 class="title is-5" v-html="$t('message.help.toSelectTrains')"></h5>
          <p v-html="$t('message.help.clickToSelectTrains')"></p>
          <ul>
            <li v-html="$t('message.help.pressControlKeyToSelectMultiple')"></li>
            <li v-html="$t('message.help.clickTwiceToSelectRange')"></li>
          </ul>
        </div>
      </div>
    </b-carousel-item>
    <b-carousel-item>
      <div class="help-item">
        <img src="@/assets/help_edit_train.png">
        <div class="help-desc content">
          <h5 class="title is-5" v-html="$t('message.help.toEditTrain')"></h5>
          <p v-html="$t('message.help.variousWaysToEditTrain')"></p>
          <ul>
            <li v-html="$t('message.help.doubleClickToAddStop')"></li>
            <li v-html="$t('message.help.doubleClickToExtendTrain')"></li>            
            <li v-html="$t('message.help.pressDeleteKeyToDeleteTrain')"></li>
          </ul>
        </div>
      </div>
    </b-carousel-item>
    <b-carousel-item>
      <div class="help-item">
        <img src="@/assets/help_edit_time.png">
        <div class="help-desc content">
          <h5 class="title is-5" v-html="$t('message.help.toEditTime')"></h5>
          <p v-html="$t('message.help.variousWaysToEditTime')"></p>
          <ul>
            <li v-html="$t('message.help.dragToChangeTime')"></li>
            <li v-html="$t('message.help.pressShiftKeyToPrecise')"></li>
          </ul>
        </div>
      </div>
    </b-carousel-item>
    <!-- <b-carousel-item>
      <div class="help-page">
        <p v-html="$t('message.useClickToSelectTrains')"></p>
        <div class="help-items">
          <div class="help-item">
            <img src="@/assets/help_add_station.png">
            <p v-html="$t('message.pressControlKeyToSelectMultiple')"></p>
          </div>
          <div class="help-item">
            <img src="@/assets/help_add_train.png">
            <p v-html="$t('message.clickTwiceToSelectRange')"></p>
          </div>
        </div>
      </div>
    </b-carousel-item> -->
  </b-carousel>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class HelpPane extends Vue {
}
</script>

<style lang="scss" scoped>
.help-item {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
}
.help-item img {
  display: block;
}
.help-item .help-desc {
  flex: 1 1 0;
  margin: 0 1rem;
  min-width: 360px;
}
</style>
