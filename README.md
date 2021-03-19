# CATOVIS Office CLI

## CATOVISとは

翻訳者向けに開発している業務効率化ツール群の総称です。
主にNode.jsとTypeScriptを使って開発をしています。
中国語⇔日本語の翻訳者である電氣羊（DianziYang）が、翻訳者視点から開発を進めています。
他の商用の翻訳支援ツール（CATツール）よりも安価に（現時点では無料）で提供しています。

![ポータルサイト](https://catovis.com)はこちら

## CATOVIS Officeとは

CATOVISツールのうち、MS Officeファイルの操作に焦点をあてたツールです。
複数のMS Officeファイルに対し、テキスト抽出・対訳表作成（アラインメント）・差分表示・類似度計算などの処理が可能です。
OOXMLファイルを直接読み込んでいるため、MS　Officeがインストールされていない環境でも使用可能です。
対応フォーマット： docx / docm / xlsx / xlsm / pptx / pptm

このリポジトリは、上記の機能のCLI版です。
- ![GUI付のWebアプリ版](https://office.catovis.com)はこちら
- ![Webアプリのリポジトリ](https://github.com/CPkobo/office)はこちら

## ライセンス

MITライセンスです。改変・再頒布等、自由に使ってください。

## 使い方 クイックスタート

リポジトリをクローンし、依存関係を解決します。

```bash
git clone https://github.com/CPkobo/catovis-office-cli
cd catovis-office-cli
yarn install
```

続いてtsファイルをビルドします。
```bash
yarn build
```

このコマンドにより、distディレクトリにJavaScriptファイルが作成されます。

最後にdistディレクトリに作成された index.js を実行します。
```bash
yarn start
```

これによりダイアログ形式で好きな処理を選択することができます。

## 使い方 ～テキスト抽出～

### モード選択

ダイアログが表示されたら、「EXTRACT」を選択してEnterを押します。

### ファイル／ディレクトリ選択

続いて、原文ファイルの場所を相対パスか絶対パスで指定します。
カンマで区切ることで、複数のファイルを指定することもできます。

また、ディレクトリを指定すると、そのディレクトリの直下にあるOfficeファイルがすべて選択されます。

何も入力しなかった場合、現在のディレクトリの直下にあるOfficeファイルがすべて選択されます。

### 出力ファイル名入力

出力ファイル名を入力します。

テキスト抽出モードでは .txt か .json が選択できます。
拡張子がどちらでもなかった場合、 .txt が自動で付与されます。

何も入力しなかった場合、コンソールに出力されます。

### 除外するテキストの入力（正規表現）

ファイルによっては英数字や記号の組み合わせなど、翻訳も抽出も不要な文字が多く含まれていることがあります。
そのようなケースでは、ここに正規表現を入力することで、結果に含まない文字列を指定することができます。

例）数字のみの文を除外する場合： ^\d+$

何も入力しなかった場合、すべての文字が抽出されます。

### 追加オプションの入力

読み込み内容の指定など、追加オプションを指定できます。
- Dont add separation marks
  - CATOVIS Officeで使用している区切り記号を追加しなくなります。単純にテキストだけが抽出したい場合などにONにしてください。
- Word-Before-Revision
  - ONにすると、Wordファイルで修正履歴をすべて無視し、修正前の状態で抽出するようになります。
- PPT-Note
  - ONにすると、PPTのノートを読み込まなくなります。
- Excel-Hidden-Sheet
  - ONにすると、Excelの隠しシートを読み込まなくなります。
- Excel-Filled-Cell
  - ONにすると、Excelの色付きセルを読み込まなくなります。
- DEBUG
  - デバッグモードです。エラーが出たときのみ、コンソールに詳細が表示されます。

追加オプションの画面でEnterを押すと、処理が実行されます。

## 使い方 ～対訳表作成（アラインメント）～

### モード選択

ダイアログが表示されたら、「ALIGN」を選択してEnterを押します。

### 原文ファイル／ディレクトリ選択

続いて、原文ファイルの場所を相対パスか絶対パスで指定します。
この操作は「抽出」の場合と同様です。

### 訳文ファイル／ディレクトリ選択

今度は、原文ファイルの場所を相対パスか絶対パスで指定します。
指定の方法は原文ファイルと同様です。

### 出力ファイル名入力

出力ファイル名を入力します。

対訳表作成モードでは .tsv か .json が選択できます。
拡張子がどちらでもなかった場合、 .tsv が自動で付与されます。

何も入力しなかった場合、コンソールに出力されます。

### 除外するテキストの入力（正規表現）

「抽出」の場合と同様、除外するテキストを正規表現で指定することができます。
除外ルールは原文・訳文いずれにも適用されます。

### 追加オプションの入力

読み込み内容の指定など、追加オプションを指定できます。
内容は「抽出」の項目と同様です。

追加オプションの画面でEnterを押すと、処理が実行されます。

ただし、原文ファイルの数と訳文ファイルの数が異なっていた場合や、拡張子が対応関係にない場合は処理が中断されますので、注意してください。


## 使い方 ～文字数カウント～

### モード選択

ダイアログが表示されたら、「COUNT」を選択してEnterを押します。

### ファイル／ディレクトリ選択

続いて、原文ファイルの場所を相対パスか絶対パスで指定します。
この操作は「抽出」の場合と同様です。

### 出力ファイル名入力

出力ファイル名を入力します。

文字数カウントモードでは .tsvファイルが選択できます。
拡張子が.tsv でない場合、 .tsv が自動で付与されます。

何も入力しなかった場合、コンソールに出力されます。

### 除外するテキストの入力（正規表現）

この操作は「抽出」の場合と同様です。

### 追加オプションの入力

この操作は「抽出」の場合と同様です。

追加オプションの画面でEnterを押すと、処理が実行されます。

カウント結果には文字カウントのほか、ファイル内・ファイル間で似た文があった場合、
それぞれどれくらい一致している文が何文字あるかも計算します（WWC:Weighted Word Count）

Ver0.2時点ではWWCを調整するには、直接JavaScriptを書き換える必要があります。
dist/diff-brs にある以下の数値を適宜調整してください。

```JavaScript
const rate = wordWeight !== undefined ?
  wordWeight :
    {
      dupli: 1,
      over95: 1,
      over85: 1,
      over75: 1,
      over50: 1,
      under49: 1,
  };
```

## 使い方 ～類似度測定～

### モード選択

ダイアログが表示されたら、「DIFF」を選択してEnterを押します。

### ファイル／ディレクトリ選択

続いて、原文ファイルの場所を相対パスか絶対パスで指定します。
この操作は「抽出」の場合と同様です。

### 出力ファイル名入力

出力ファイル名を入力します。

文字数カウントモードでは .jsonファイルが選択できます。
拡張子が.json でない場合、 .json が自動で付与されます。

何も入力しなかった場合、コンソールに出力されます。

### 除外するテキストの入力（正規表現）

この操作は「抽出」の場合と同様です。

### 追加オプションの入力

この操作は「抽出」の場合と同様です。

追加オプションの画面でEnterを押すと、処理が実行されます。

結果ファイルは文（セグメント）情報の配列になっています。

各セグメントは
- どのセグメントと似ているか
- 何文字目を調整するか
などの情報を持っています。

## 使い方 ～TOVISファイル作成～

### 概要
TOVISファイルは、類似している文を見つけたり、機械翻訳～ポストエディット（MTPE）をより便利にするために模索中のフォーマットです。
詳細は[こちら](https://github.com/CPkobo/catovis-office-cli/tree/master/tovis)をご覧ください。

### モード選択

ダイアログが表示されたら、「TOVIS」を選択してEnterを押します。

### ファイル／ディレクトリ選択

続いて、原文ファイルの場所を相対パスか絶対パスで指定します。
この操作は「抽出」の場合と同様です。

### 出力ファイル名入力

出力ファイル名を入力します。

文字数カウントモードでは .tovisファイルが選択できます。
拡張子が.tovis でない場合、 .tovis が自動で付与されます。

何も入力しなかった場合、コンソールに出力されます。

### 除外するテキストの入力（正規表現）

この操作は「抽出」の場合と同様です。

### 追加オプションの入力

この操作は「抽出」の場合と同様です。

追加オプションの画面でEnterを押すと、処理が実行されます。

## 使い方 ～オプション指定～

（執筆中）

## 使い方 ～プリセットによる読み込み～

ダイアログによる指定は分かりやすい反面、ファイルの指定などが面倒に思うこともあるでしょう。
また、同じオプションを何度も入力するのは大変かもしれません。

そんなときは preset.yaml に処理の内容を記述することで、ダイアログでの入力を省略することができます。

preset.yaml に必要項目を入力して保存したら、下記のコマンドを実行します。

```bash
yarn preset
```
これで preset.yaml の内容に沿って処理が開始されます。
