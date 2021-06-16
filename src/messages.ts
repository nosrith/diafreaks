export default {
    ja: {
        message: {
            confirmRemoveStationRefered: "この駅を使用している列車があります。駅を削除すると、列車の時刻情報も削除されます。よろしいですか？",
            confirmRemoveTrackRefered: "この番線を使用している列車があります。番線を削除すると、列車の時刻情報も削除されます。よろしいですか？",
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
                    "<ul><li>Shiftキーを押しながら別の列車線クリックすると、複数列車を選択できます。" +
                    "<li>列車を選択した状態でさらにクリックすると、特定の駅または駅間を選択できます。<br>Shiftキーを押しながらクリックすると、複数駅間を選択できます。</ul>",
                editTrainTitle: "列車を編集する",
                editTrainBody:
                    "<p>列車を選択した状態では、さまざまな方法で列車を編集できます。</p>" +
                    "<ul><li>列車線と駅線の交点をダブルクリックすると、停車駅を追加できます。" +
                    "<li>列車線の始端・終端をダブルクリックすると、列車を延長できます。" +
                    "<li>Deleteキーを押すと、選択した区間を削除できます。</ul>",
                editTimeTitle: "着発時刻を編集する",
                editTimeBody: 
                    "<p>列車を選択した状態では、さまざまな方法で時刻を編集できます。</p>" +
                    "<ul><li>列車線をドラッグすると、選択した区間の時刻を変更できます。" +
                    "<li>Altキーを押しながらカーソルを動かすと、秒単位で時刻を指定できます。" +
                    "<li>番線を開いた状態でドラッグすることで、着発番線を変更できます。",
                tipsTitle: "便利な機能",
                tipsBody: 
                    "<p>その他にも、さまざまな便利な機能があります。</p>" +
                    "<ul><li>列車線を選択した状態でCtrlキーを押しながらドラッグすると、列車線をコピーできます。" +
                    "<li><i class='mdi mdi-upload'></i>ボタンを押すと、ローカルファイルのダイヤデータをロードできます。" +
                    "<li><i class='mdi mdi-download'></i>ボタンを押すと、ダイヤデータをローカルファイルに保存できます。"
            },
        },
    },
};
