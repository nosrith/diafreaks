export default {
  ja: {
    message: {
      failedToLoadJSON: "ファイルの読み込みに失敗しました。",
      editButtonTooltip: "編集モード",
      undoButtonTooltip: "元に戻す",
      redoButtonTooltip: "やり直す",
      vanishTrainsButtonTooltip: "列車をクリア",
      vanishStationsButtonTooltip: "駅をクリア",
      uploadButtonTooltip: "ダイヤファイルを読み込む",
      downloadButtonTooltip: "ダイヤファイルを保存する",
      helpButtonTooltip: "操作方法",
      help: {
        addNewStationTitle: "駅を追加する",
        addNewStationBody:
          "<p>左側の駅名エリアをダブルクリックすると、新しい駅を追加できます。</p>" +
          "<ul><li>駅名をドラッグすると、駅線の位置を調整できます。" +
          "<li>駅名をクリックすると、駅名を編集できます。" +
          "<li>駅右側の<i class='mdi mdi-close'></i>アイコンをクリックすると、駅を削除できます。</ul>",
        addNewTrainTitle: "列車を追加する",
        addNewTrainBody:
          "<p>駅線の上でダブルクリックすると、新しい列車を追加できます。駅線を続けてクリックして、停車駅を順に追加できます。</p>" +
          "<ul><li>列車線の編集を終了するには、もう一度ダブルクリックします。" +
          "<li>Altキーを押しながらカーソルを動かすと、秒単位で時刻を指定できます。" +
          "<li>右クリックすると、追加した停車駅を順に削除します。</ul>",
        selectTrainTitle: "列車を選択する",
        selectTrainBody:
          "<p>列車線をクリックすると、列車を選択できます。</p>" +
          "<ul><li>Shiftキーを押しながら別の列車線をクリックすると、複数列車を選択できます。" +
          "<li>列車を選択した状態でさらにクリックすると、特定の駅または駅間を選択できます。<br>Shiftキーを押しながらクリックすると、複数駅間を選択できます。</ul>",
        editTrainTitle: "列車を編集する",
        editTrainBody:
          "<p>列車を選択した状態では、さまざまな方法で列車を編集できます。</p>" +
          "<ul><li>列車線と駅線の交点をダブルクリックすると、停車駅を追加できます。" +
          "<li>列車線の始端・終端をダブルクリックすると、列車線を延長できます。" +
          "<li>Deleteキーを押すと、選択した区間の列車線を削除できます。</ul>",
        editTimeTitle: "着発時刻を変更する",
        editTimeBody:
          "<p>列車を選択した状態で列車線をドラッグすると、着発時刻を変更できます。</p>" +
          "<ul><li>Altキーを押しながらカーソルを動かすと、秒単位で時刻を指定できます。" +
          "<li>番線線上の列車線をドラッグすると、着発番線を変更できます。" +
          "<li>Ctrlキーを押しながらドラッグすると、着発時刻を変更する代わりに、<br>列車線をコピーして新しい列車を作成できます。</ul>",
        tipsTitle: "アイコンメニュー",
        tipsBody:
          "<ul><li><i class='mdi mdi-undo'></i><i class='mdi mdi-redo'></i>ボタンで、操作の取り消し・やり直しができます。" +
          "<li><i class='mdi mdi-vanish'></i>ボタンで、列車・駅の一括削除ができます。" +
          "<li><i class='mdi mdi-upload'></i><i class='mdi mdi-download'></i>ボタンで、データの読み込み・保存ができます。</ul>",
        contactTitle: "不明点・不具合などを見つけたら",
        contactBody:
          "<p>不明点・不具合などがありましたら、<a href='https://twitter.com/nosrithe'>@nosrithe</a> までお知らせください。</p>" +
          "<ul><li>お問い合わせの際は、操作の目的や再現手順を具体的にお伝えください。" +
          "<li>不具合などの修正は <a href='https://github.com/nosrith/diafreaks/issues'>GitHub プロジェクト</a> で管理しています。<br>既知の不具合についてはこちらをご確認ください。</ul>",
      },
    },
  },
};
