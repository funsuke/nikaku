// ERROR v007
"use strict";

////////////////////////////////
// 定数の定義
////////////////////////////////
const TILES_W = 17;                 // 牌の横の数
const TILES_H = 8;                  // 牌の縦の数
const TILES_N = 136;                // 牌の総数
const TILES_N_HALF = TILES_N / 2;   // 牌の総数 / 2
const ARRAY_W = TILES_W + 4;        // 牌用配列の横数
const ARRAY_H = TILES_H + 4;        // 牌用配列の縦数
const ARRAY_N = ARRAY_W * ARRAY_H;  // 牌用配列の総数
const TILE_W = 59;                  // 描画する牌の縦サイズ
const TILE_H = 80;                  // 描画する牌の横サイズ
const DRAW_DX = 80;                 // 右上の牌の横表示位置
const DRAW_DY = 40;                 // 右上の牌の縦表示位置
const TIME_TEMP = 134;              // 仮時間(タイトル+α分)

// add 2023.10.26
// 時間
const TIME_TITLE  = 12;             // タイトルの時間 title
const TIME_GAME = 150;

// 方向
const DIR_UP = 0    // 上
const DIR_DW = 1    // 下
const DIR_RI = 2    // 右
const DIR_LE = 3    // 左

////////////////////////////////
// グローバル変数
////////////////////////////////
// ２角ライン用オブジェクト
let lines = null;               // 二角線用のオブジェクト
let line = new Array(3);        // 二角線用のオブジェクト
let timeHide = 0;               // 次に完全に消える二角線の時間
let idxHint = 0;                // ヒントのインデックス番号
let canEraseNum = 0;            // 取れるタイルのペア数
let remainTileNum = TILES_N;    // 残りのタイル数
let chainCnt = 0;               // 連鎖回数

////////////////////////////////
// クラス定義
////////////////////////////////
// 数字クラス
class clsNum {
  constructor(x,y,n,e) {
    this._x = x;       // 表示横位置
    this._y = y;       // 表示縦位置
    this._num = n;     // 表示する数値
    this._img = e;     // 表示エンティティ
  }
  pos(x,y) {
    this._x = x;
    this._y = y;
  }
  set num(n) {
    this._num = n;
  }
  set img(e) {
    this._img = e;
  }
  set align(a) {
    this._align = a;
  }
  get num() {
    return this._num;
  }
  show(scene) {
    // 桁数の取得
    let digits_m = this._img.length;     // 最大桁数
    let digits   = this._num.toString().length;
    // 横幅の設定
    let numw = this._img[0].width;
    let width_m = numw * digits_m;      // 最大横幅
    let width   = numw * digits;
    // 表示横位置オフセット
    let dx = 0;
    if (this._align == "center") {
      dx = (width_m - width) / 2;
    } else if (this._align == "right") {
      dx = width_m - width;
    }
    // 表示
    for (let i=0; i<digits; i++) {
      this._img[i].x = this._x + dx + numw * (digits-1-i) * this._img[0].scaleX;
      this._img[i].y = this._y;
      this._img[i].srcX = numw * parseInt(this._num.toString().charAt(digits-1-i));
      this._img[i].srcY = 0;
      scene.modified(this._img[i]);
      this._img[i].show();
    }
    // 他は表示しない
    for (let i=digits; i<digits_m; i++) {
      this._img[i].hide();
    }
  }
}

////////////////////////////////
// 関数定義
////////////////////////////////
// 整数乱数の取得
let commonRandom;
function random(i) {
//  return Math.floor(g.game.random.generate() * i);
  return commonRandom.get(0,i-1)
}

// 経過時間の取得
function getCurrentTime() {
  return g.game.getCurrentTime();
}

// 指定範囲内の数値を返す
function limit(i1, i2, i3) {
  if (i1 < Math.min(i2, i3)) return Math.min(i2, i3);
  if (i1 > Math.max(i2, i3)) return Math.max(i2, i3);
  return i1;
}

// 指定範囲内であればTrueを返す
function limitIf(i1,i2,i3) {
  if (i1 >= i2 && i1 <= i3) return true;
  return false;
}

// ポジションから牌配列のインデックスを返す
function getIdx2Pos(p) {
  let x = Math.floor((p.x-DRAW_DX) / TILE_W) + 2;
  let y = Math.floor((p.y-DRAW_DY) / TILE_H) + 2;
  // console.log("getIdx2Pos********");
  // console.log(`x=${x},y=${y}`);
  if ((x>0 && x<TILES_W+3) && (y>0 && y<TILES_H+3)) {
    return x + ARRAY_W * y;
  }
  return -1;
}

// Arrayにshuffle(フィッシャーエーツ)関数を設定
Array.prototype.shuffle = function () {
  let i = this.length;
  while (i) {
    let j = random(i);
    let t = this[--i];
    this[i] = this[j];
    this[j] = t;
  }
  return this;
};

// 二乗の合計値の平方根
function hypot2(x,y) {
  return Math.sqrt(x**2+y**2)
}

function hideTile(tiles,idx) {
  tiles[idx].value = 0;
//  tiles[idx].img.touchable = false;
  tiles[idx].img.hide();
}

// 洗牌ボタンを推した時のシャッフル
function shuffle(scene,tiles) {
  // console.log("IN::shuffle()");
  let num = 0;
  let i = 0;
  for (i=0; i<ARRAY_N; i++) {
    if (tiles[i].value > 0) {
      num++;
    }
  }
  while (num) {
    let idx0 = 0;
    let idx1 = 0;
    let cnt = 0;
    let j = random(num);
    for (idx0=0; idx0<ARRAY_N; idx0++) {
      if (tiles[idx0].value > 0) {
        if (cnt++ == j) break;
      }
    }
    for (idx1=ARRAY_N-1; idx1>0; idx1--) {
      if (tiles[idx1].value > 0) break;
    }
    let t = {
      v:  tiles[idx1].value,
      x:  tiles[idx1].img.srcX,
      y:  tiles[idx1].img.srcY,
    };
    tiles[idx1].value     = tiles[idx0].value;
    tiles[idx1].img.srcX  = tiles[idx0].img.srcX;
    tiles[idx1].img.srcY  = tiles[idx0].img.srcY;
    tiles[idx0].value     = t.v;
    tiles[idx0].img.srcX  = t.x;
    tiles[idx0].img.srcY  = t.y;
    scene.modified(tiles[idx0]);
    scene.modified(tiles[idx1]);
    num--;
  }
}
// シャッフル用配列
function getShuffleArray() {
  let a = new Array(TILES_N_HALF);
  for (let i=0; i<TILES_N_HALF; i++) {
    a[i] = i;
  }
  return a.shuffle();
}
// 牌配列の初期化
function initTiles() {
  let tiles = [];
  for (let i = 0; i < ARRAY_N; i++) {
    tiles[i] = {
      value: 0,
      x: i % ARRAY_W,
      y: Math.floor(i / ARRAY_W),
      img: null,
    };
    // 壁の設定
    if (tiles[i].y == 0) tiles[i].value = -1;
    if (tiles[i].y == ARRAY_H - 1) tiles[i].value = -1;
    if (tiles[i].x == 0) tiles[i].value = -1;
    if (tiles[i].x == ARRAY_W - 1) tiles[i].value = -1;
  }
  return tiles;
}

// 牌配列の空いている場所(ランダム)を返す
function getRVec(tiles, v) {
  let ret = {
    x: limit(v.x, 0, TILES_W - 1),
    y: limit(v.y, 0, TILES_H - 1)
  };
  let idx = (ret.x + 2) + ARRAY_W * (ret.y + 2);
  // tilesが0ではない場合
  if (tiles[idx].value > 0) {
    let sx1 = 0, sy1 = Math.floor(TILES_H / 2)
    let sx0 = TILES_W - 1, sy0 = sy1 - 1
    for (let i = 0; i < TILES_N_HALF; i++) {
      idx = (sx0 + 2) + ARRAY_W * (sy0 + 2);
      if (tiles[idx].value == 0) {
        ret.x = sx0, ret.y = sy0;
        break;
      }
      idx = (sx1 + 2) + ARRAY_W * (sy1 + 2);
      if (tiles[idx].value == 0) {
        ret.x = sx1, ret.y = sy1;
        break;
      }
      sx0 = (sx0 - 1 + TILES_W) % TILES_W;
      sy0 = (sy0 - (sx0 == TILES_W - 1) + TILES_H) % TILES_H;
      sx1 = (sx1 + 1) % TILES_W;
      sy1 = (sy1 + (sx1 == 0)) % TILES_H;
    }
  }
  return ret;
}

function setTilesValue(tiles, a) {
  for (let i = 0; i < TILES_N_HALF; i++) {
    let val = Math.floor(a[i] / 2) + 1;
    // ペアの最初の牌はランダム
    let v = getRVec(tiles, { x: random(TILES_H), y: random(TILES_W) });
    let idx = (v.x + 2) + ARRAY_W * (v.y + 2);
    tiles[idx].value = val;
    // ペアの次の牌は最初の牌の4x4の範囲内
    v = getRVec(tiles, { x: v.x + random(9) - 4, y: v.y + random(9) - 4 });
    idx = (v.x + 2) + ARRAY_W * (v.y + 2);
    tiles[idx].value = val;
  }
  return tiles;
}

//==============================
// 指定方向の空き座標の限界値を取得する
//==============================
function getLimit(tiles, idx, dir) {
  if (dir < DIR_UP || dir > DIR_LE) return -1;
  let u = 1 * (dir==DIR_LE || dir==DIR_RI);
  let v = 1 * (dir==DIR_UP || dir==DIR_DW);
  let d = (dir==DIR_RI) - (dir==DIR_LE) + ARRAY_W * ((dir==DIR_DW) - (dir==DIR_UP));
  let ret = tiles[idx].y * v + tiles[idx].x * u;
  for (let i=idx+d; tiles[i].value==0; i+=d) {
      ret = tiles[i].y * v + tiles[i].x * u;
  }
  return ret;
}

//==============================
// 紫の線の設定
//==============================
function setLines(points) {
  for (let i=0; i<3; i++) {
    line[i].width   = TILE_W * Math.abs(points[i].x - points[i+1].x) + 10;
    line[i].height  = TILE_H * Math.abs(points[i].y - points[i+1].y) + 10;
    line[i].x = DRAW_DX + TILE_W * Math.min(points[i].x, points[i+1].x) + 25;
    line[i].y = DRAW_DY + TILE_H * Math.min(points[i].y, points[i+1].y) + 35;
  }
  timeHide = getCurrentTime() + 3000;
}

//==============================
// ２角取り判定
//==============================
function canErase(tiles, idx0, idx1, flg) {
  // 2つの牌のU方向の範囲、V方向の範囲をセットする
  let u0 = Math.max(getLimit(tiles,idx0,DIR_LE), getLimit(tiles,idx1,DIR_LE));
  let u1 = Math.min(getLimit(tiles,idx0,DIR_RI), getLimit(tiles,idx1,DIR_RI));
  let v0 = Math.max(getLimit(tiles,idx0,DIR_UP), getLimit(tiles,idx1,DIR_UP));
  let v1 = Math.min(getLimit(tiles,idx0,DIR_DW), getLimit(tiles,idx1,DIR_DW));
  // if (flg) console.log(`u0:${u0}, u1:${u1}, v0:${v0}, v1:${v1}`);
  let ymin = Math.min(tiles[idx0].y, tiles[idx1].y);
  let ymax = Math.max(tiles[idx0].y, tiles[idx1].y);
  let xmin = Math.min(tiles[idx0].x, tiles[idx1].x);
  let xmax = Math.max(tiles[idx0].x, tiles[idx1].x);
  //------------------------------
  // X範囲が有効なら横縦走査
  //------------------------------
  if (u0 <= u1) {
    // 横の真ん中から縦に走査
    let uhalf = Math.floor((tiles[idx0].x + tiles[idx1].x) / 2);
    // if (flg) console.log("ｘ範囲：真ん中 "+uhalf);
    let v = 0;
    if (uhalf >= u0 && uhalf <= u1) {
      for (v=ymin+1; v<ymax; v++) {
        if (tiles[uhalf+ARRAY_W*v].value) break;
      }
      // if (flg) console.log(`v=${v},max=${ymax}`);
      if (v == ymax) {
        if (flg) {
          let points = new Array(4);
          points[0] = {x: tiles[idx0].x-2,  y: tiles[idx0].y-2};
          points[1] = {x: uhalf-2,          y: tiles[idx0].y-2};
          points[2] = {x: uhalf-2,          y: tiles[idx1].y-2};
          points[3] = {x: tiles[idx1].x-2,  y: tiles[idx1].y-2};
          setLines(points);
        }
        return true;
      }
    }
    // 横の真ん中周りから縦に走査
    for (let i=1; ; i++) {
      // if (flg) console.log("ｘ範囲：左");
      if (uhalf-i<u0 && uhalf+i>u1) break;
      // 左隣の走査
      if (uhalf-i>=u0 && uhalf-i<=u1) {
        // 縦走査
        for (v=ymin+1; v<ymax; v++) {
          if (tiles[uhalf-i+ARRAY_W*v].value) break;
        }
        // if (flg) console.log(`v=${v},ymax=${ymax}`);
        if (v == ymax) {
          if (flg) {
            let points = new Array(4);
            points[0] = {x: tiles[idx0].x-2,  y: tiles[idx0].y-2};
            points[1] = {x: uhalf-i-2,        y: tiles[idx0].y-2};
            points[2] = {x: uhalf-i-2,        y: tiles[idx1].y-2};
            points[3] = {x: tiles[idx1].x-2,  y: tiles[idx1].y-2};
            setLines(points);
          }
          return true;
        }
      }
      // 右隣の走査
      // if (flg) console.log("ｘ範囲：右");
      if (uhalf+i>=u0 && uhalf+i<=u1) {
        // 縦走査
        for (v=ymin+1; v<ymax; v++) {
          if (tiles[uhalf+i+ARRAY_W*v].value) break;
        }
        // if (flg) console.log(`v=${v},ymax=${ymax}`);
        if (v == ymax) {
          if (flg) {
            let points = new Array(4);
            points[0] = {x: tiles[idx0].x-2,  y: tiles[idx0].y-2};
            points[1] = {x: uhalf+i-2,        y: tiles[idx0].y-2};
            points[2] = {x: uhalf+i-2,        y: tiles[idx1].y-2};
            points[3] = {x: tiles[idx1].x-2,  y: tiles[idx1].y-2};
            setLines(points);
          }
          return true;
        }
      }
    }
  }
  //------------------------------
  // y範囲が有効なら縦横走査
  //------------------------------
  if (v0 <= v1) {
    // 縦の真ん中から横に走査
    let vhalf = Math.floor((tiles[idx0].y + tiles[idx1].y) / 2);
    let u = 0;
    if (vhalf >= v0 && vhalf <= v1) {
      // if (flg) console.log("ｙ範囲：真ん中 " +vhalf);
      for (u=xmin+1; u<xmax; u++) {
        if (tiles[u+ARRAY_W*vhalf].value) break;
      }
      // if (flg) console.log(`u=${u},xmax=${xmax}`);
      if (u == xmax) {
        if (flg) {
          let points = new Array(4);
          points[0] = {x: tiles[idx0].x-2,  y: tiles[idx0].y-2};
          points[1] = {x: tiles[idx0].x-2,  y: vhalf-2};
          points[2] = {x: tiles[idx1].x-2,  y: vhalf-2};
          points[3] = {x: tiles[idx1].x-2,  y: tiles[idx1].y-2};
          setLines(points);
        }
        return true;
      }
    }
    // 縦の真ん中周りから横に走査
    for (let i=1; ; i++) {
      // if (flg) console.log("ｙ範囲：上");
      if (vhalf-i<v0 && vhalf+i>v1) break;
      // 上隣の走査
      if (vhalf-i>=v0 && vhalf-i<=v1) {
        // 横操作
        for (u=xmin+1; u<xmax; u++) {
          if (tiles[u+ARRAY_W*(vhalf-i)].value) break;
        }
        // if (flg) console.log(`u=${u},xmax=${xmax}`);
        if (u == xmax) {
          if (flg) {
            let points = new Array(4);
            points[0] = {x: tiles[idx0].x-2,  y: tiles[idx0].y-2};
            points[1] = {x: tiles[idx0].x-2,  y: vhalf-i-2};
            points[2] = {x: tiles[idx1].x-2,  y: vhalf-i-2};
            points[3] = {x: tiles[idx1].x-2,  y: tiles[idx1].y-2};
            setLines(points);
          }
          return true;
        }
      }
      // 下隣の走査
      if (vhalf+i>=v0 && vhalf+i<=v1) {
        // 横走査
        // if (flg) console.log("ｙ範囲：下");
        for (u=xmin+1; u<xmax; u++) {
          if (tiles[u+ARRAY_W*(vhalf+i)].value) break;
        }
        // if (flg) console.log(`u=${u},xmax=${xmax}`);
        if (u == xmax) {
          if (flg) {
            let points = new Array(4);
            points[0] = {x: tiles[idx0].x-2,  y: tiles[idx0].y-2};
            points[1] = {x: tiles[idx0].x-2,  y: vhalf+i-2};
            points[2] = {x: tiles[idx1].x-2,  y: vhalf+i-2};
            points[3] = {x: tiles[idx1].x-2,  y: tiles[idx1].y-2};
            setLines(points);
          }
          return true;
        }
      }
    }
  }
  return false;
}

//==============================
// 消せるペアをカウントする
//==============================
function countCanEraseNum(tiles, flg) {
  if (flg) {
    if (canEraseNum != 0) {
      idxHint %= canEraseNum;
    } else {
      return 0;
    }
  }
  let ret = 0;
exit_loop:
  for (let i=0; i<ARRAY_N; i++) {
    if (tiles[i].value > 0) {
      for (let j=i+1; j<ARRAY_N; j++) {
        if (tiles[j].value > 0 && tiles[i].value == tiles[j].value) {
          if (canErase(tiles,i,j,false)) {
            if (flg && ret==idxHint) {
              let tmp = canErase(tiles,i,j,true);
              ++idxHint;
              break exit_loop;
            }
            ret ++;
          }
        }
      }
    }
  }
  return ret;
}

function clearTiles(tiles) {
  for (let j = 2; j < TILES_H + 2; j++) {
    for (let i = 2; i < TILES_W + 2; i++) {
      let idx = i + ARRAY_W * j;
      tiles[idx].value = 0;
    }
  }
}

function init(tiles) {
  // 牌の再配置
  clearTiles(tiles);
  let a = getShuffleArray();
  for (let i = 0; i < TILES_N_HALF; i++) {
    let val = Math.floor(a[i] / 2) + 1;
    // ペアの最初の牌はランダム
    let v = getRVec(tiles, { x: random(TILES_H), y: random(TILES_W) });
    let idx = (v.x + 2) + ARRAY_W * (v.y + 2);
    tiles[idx].value = val;
    // ペアの次の牌は最初の牌の4x4の範囲内
    v = getRVec(tiles, { x: v.x + random(9) - 4, y: v.y + random(9) - 4 });
    idx = (v.x + 2) + ARRAY_W * (v.y + 2);
    tiles[idx].value = val;
  }
  // 牌の再表示
  for (let j = 2; j < TILES_H + 2; j++) {
    for (let i = 2; i < TILES_W + 2; i++) {
      let idx = i + ARRAY_W * j;
      let val = tiles[idx].value - 1;
      tiles[idx].img.srcX = TILE_W * (val % 9);
      tiles[idx].img.srcY = TILE_H * Math.floor(val / 9);
      tiles[idx].img.modified();
      tiles[idx].img.show();
//      tiles[idx]
    }
  }
}

function resetTime(param) {
  let timeLimit = param.sessionParameter.totalTimeLimit;
  if (timeLimit) {
    return timeLimit; // セッションパラメータで制限時間が指定されたらその値を使用します
  }
  return TIME_TEMP;
}

////////////////////////////////
// main
////////////////////////////////
let aNum     = null;
let aBack    = null;
let aTile    = null;
let aPairs   = null;
let aShuffle = null;
let aHelp    = null;
let aNumMini = null;
let aScore   = null;
let aSec     = null;
let aMusic   = null;
let aMistake = null;
let aSuccess = null;
let aSelect  = null;
let aRetry   = null;

let debugMode = false;

// exports.main = void 0;
function main(param) {
  g.game.pushScene(createTitle(param));
}

function createTitle(param) {
  let scene = new g.Scene({
    game: g.game,
    assetIds: [
      // タイトルで使用
      "slide0",
      "slide1",
      "slide2",
      "number",
      "next",
      "start",
      "record",
      // メインループで使用
      "back", 
      "tile", 
      "pairs", 
      "scroll0", 
      "scroll1", 
      "number_mini",
      "score",
      "seconds",
      "nc217711",
      "nc182053",
      "nc238228",
      "nc217393",
      "retry"
    ]
  });
  let cCountNum = null;
  let countNum = 10;
  scene.onLoad.add(function() {
    // アセットオブジェクトの取得
    let aSlide0 = scene.asset.getImageById("slide0");
    let aSlide1 = scene.asset.getImageById("slide1");
    let aSlide2 = scene.asset.getImageById("slide2");
    let aNext   = scene.asset.getImageById("next");
    let aStart  = scene.asset.getImageById("start");
    let aRecord = scene.asset.getImageById("record");
    aNum    = scene.asset.getImageById("number");
    aBack  = scene.asset.getImageById("back");
    aTile  = scene.asset.getImageById("tile");
    aPairs = scene.asset.getImageById("pairs");
    aShuffle = scene.asset.getImageById("scroll0");
    aHelp    = scene.asset.getImageById("scroll1");
    aNumMini = scene.asset.getImageById("number_mini");
    aScore = scene.asset.getImageById("score");
    aSec   = scene.asset.getImageById("seconds");
    aMusic = scene.asset.getAudioById("nc217711");
    aMistake = scene.asset.getAudioById("nc238228");
    aSuccess = scene.asset.getAudioById("nc182053");
    aSelect  = scene.asset.getAudioById("nc217393");
    aRetry = scene.asset.getImageById("retry");
    // スライド０
    let eSlide0 = new g.Sprite({
      scene:  scene,
      src:    aSlide0,
      width:  aSlide0.width,
      height: aSlide0.height,
    });
    scene.append(eSlide0);
    // スライド１
    let eSlide1 = new g.Sprite({
      scene:  scene,
      src:    aSlide1,
      width:  aSlide1.width,
      height: aSlide1.height,
    });
    eSlide1.hide();
    scene.append(eSlide1);
    // スライド２
    let eSlide2 = new g.Sprite({
      scene:  scene,
      src:    aSlide2,
      width:  aSlide2.width,
      height: aSlide2.height,
    });
    eSlide2.hide();
    scene.append(eSlide2);
    //==============================
    // ニコ生ゲーの処理
    //==============================
    if (!param.isAtsumaru) {
      // 数字
      let eCountNum = new Array(2);
      for (let i=0; i<eCountNum.length; i++) {
        eCountNum[i] = new g.Sprite({
          scene:  scene,
          src:    aNum,
          width:  30,
          height: 53,
          scaleX: 2,
          scaleY: 2,
        });
        scene.append(eCountNum[i]);
      }
      cCountNum = new clsNum(g.game.width-170,g.game.height-156,countNum,eCountNum);
      cCountNum.align = "right";
      cCountNum.show(scene);
      // シーン更新処理
			let tStart = getCurrentTime();
      scene.onUpdate.add(function() {
				// fix 2023.10.26
        // countNum -= 1 / g.game.fps;
        // cCountNum.num = Math.ceil(countNum);
        cCountNum.num = Math.ceil(TIME_TITLE - (getCurrentTime() - tStart) / 1000);
        cCountNum.show(scene);
				// fix 2023.10.26
        // if (countNum <= 0) {
        //   g.game.replaceScene(createGame(param));
        // } else if (countNum <= 5) {
        //   eSlide0.hide();
        //   eSlide1.show();
        // }
				if (cCountNum.num <= 0) {
					g.game.replaceScene(createGame(param));
				} else if (cCountNum.num <= 6) {
					eSlide0.hide();
					eSlide1.show();
				}
      });
      let clickNum = 0;
      scene.onPointDownCapture.add(function(ev) {
        // console.log("scene.onPointDownCapture");
        clickNum ++;
        if (clickNum >= 10) {
          // aSuccess.play();
          // debugMode = true;
        }
      });
    //==============================
    // アツマールの処理
    //==============================
    } else {
      // 次へ看板
      let eNext = new g.Sprite({
        scene:  scene,
        src:    aNext,
        width:  aNext.width,
        height: aNext.height,
        x:      g.game.width - 225,
        y:      g.game.height - 125,
        touchable: true,
      });
      scene.append(eNext);
      // はじめる看板
      let eStart = new g.Sprite({
        scene:  scene,
        src:    aStart,
        width:  aStart.width,
        height: aStart.height,
        x:      g.game.width - 225,
        y:      g.game.height - 125,
        touchable:  true,
      })
      eStart.hide();
      scene.append(eStart);
      // レコード
      let eRecord = new g.Sprite({
        scene:  scene,
        src:    aRecord,
        width:  aRecord.width,
        height: aRecord.height,
        x:      g.game.width - 225,
        y:      g.game.height - 225,
        touchable: true,
      });
      scene.append(eRecord);
      // 次へ看板押下時
      eNext.onPointDown.add(function() {
        eSlide0.hide();
        eSlide1.show();
        eNext.hide();
        eStart.show();
      });
      // はじめる看板押下時
      eStart.onPointDown.add(function() {
        console.log("eStart.onPointDown");
        g.game.replaceScene(createGame(param));
      });
      // レコード看板押下時
      eRecord.onPointDown.add(function() {
        window.RPGAtsumaru.experimental.scoreboards.display(1);
      });
      // シーン押下時
      let clickNum = 0;
      scene.onPointDownCapture.add(function(ev) {
        // console.log("scene.onPointDownCapture");
        clickNum ++;
        if (clickNum >= 10) {
          eRecord.hide();
          eSlide2.show();
          eNext.y = 0;
          eNext.modified();
          eStart.y = 0;
          eStart.modified();
        }
      });
      scene.append(eNext);
    }
  });
  return scene;
}

function createGame(param) {
  let scene = new g.Scene({
    game: g.game,
    // このシーンで利用するアセットのIDを列挙し、シーンに通知します
    assetIds: [
      // メインループで使用 ※こっちでも定義しておかないと駄目？
      "number",
      "back", 
      "tile", 
      "pairs", 
      "scroll0", 
      "scroll1", 
      "number_mini",
      "score",
      "seconds",
      "nc217711",
      "nc182053",
      "nc238228",
      "nc217393",
      "retry",
      "next",
      "start"
    ]
  });
  //------------------------------
  // 制限時間の設定
  //------------------------------
	// fix 2023.10.26
  // let time = resetTime(param); // 制限時間
	let time = TIME_GAME;
  let preTime = time;
  let timeMilli = getCurrentTime() + time * 1000;
  // 市場コンテンツのランキングモードでは、g.game.vars.gameState.score の値をスコアとして扱います
  g.game.vars.gameState = { score: 0 };
  // 共通乱数生成器の設定
  commonRandom = param.random;
  //==============================
  // シーン読込完了イベント
  //==============================
  scene.onLoad.add(function () {
    // アセットオブジェクトの取得
    aMusic.play().changeVolume(0.3);
    //------------------------------
    // 背景
    //------------------------------
    let eBack = new g.Sprite({
      scene:  scene,
      src:    aBack,
      width:  aBack.width,
      height: aBack.height,
    });
    scene.append(eBack);
    //------------------------------
    // 牌
    //------------------------------
    // 牌のオブジェクト配列
    let tiles = initTiles();
    let a = getShuffleArray();
    for (let i = 0; i < TILES_N_HALF; i++) {
      let val = 0;
      if (debugMode) {
        val = Math.floor(i / 2) + 1;
      } else {
        val = Math.floor(a[i] / 2) + 1;
      }
      // ペアの最初の牌はランダム
      let v = getRVec(tiles, { x: random(TILES_H), y: random(TILES_W) });
      if (debugMode) {
        console.log("debugMode");
        v.x = (i * 2) % TILES_W;
        v.y = Math.floor(i * 2 / TILES_W);
      }
      let idx = (v.x + 2) + ARRAY_W * (v.y + 2);
      tiles[idx].value = val;
      // ペアの次の牌は最初の牌の4x4の範囲内
      v = getRVec(tiles, { x: v.x + random(9) - 4, y: v.y + random(9) - 4 });
      if (debugMode) {
        console.log("debugMode");
        v.x = (i*2+1) % TILES_W;
        v.y = Math.floor((i*2+1) / TILES_W);
      }
      idx = (v.x + 2) + ARRAY_W * (v.y + 2);
      tiles[idx].value = val;
    }
    // エンティティの登録
    for (let j = 2; j < TILES_H + 2; j++) {
      for (let i = 2; i < TILES_W + 2; i++) {
        let idx = i + ARRAY_W * j;
        let val = tiles[idx].value - 1;
        //------------------------------
        // 牌のエンティティ
        //------------------------------
        tiles[idx].img = new g.Sprite({
          scene: scene,
          src: aTile,
          srcX: TILE_W * (val % 9),
          srcY: TILE_H * Math.floor(val / 9),
          x: DRAW_DX + TILE_W * (tiles[idx].x - 2),
          y: DRAW_DY + TILE_H * (tiles[idx].y - 2),
          width: TILE_W,
          height: TILE_H,
          touchable: true
        });
        //==============================
        // 牌にマウスダウンしたときのイベント
        //==============================
        tiles[idx].img.onPointDown.add(function(e) {
          // シャッフルしました
          labelBack.hide();
          label.hide();
          // console.log(`idx=${idx}, val=${tiles[idx].value}`);
          // console.log(e.point.x);
          // console.log(e.point.y);
          // console.log("onPointDown!!");
          let flgErased = false;
          // 牌を選択している場合
          if (oSel.idx != -1) {
            // 同じ種類の場合
            if (oSel.value == tiles[idx].value) {
              // 選択した牌以外の場合
              if (oSel.idx != idx) {
                // 消せるか判定
                if (canErase(tiles, oSel.idx, idx,true)) {
                  // 成功音再生
                  aSuccess.play();
                  flgErased = true;
                  // 選択した２つの牌を消す
                  hideTile(tiles,oSel.idx);
                  hideTile(tiles,idx);
                  // console.log("lines.show()****");
                  scene.insertBefore(lines,ePairs);
                  lines.show();
                  // 残りの牌数を計算する
                  remainTileNum -= 2;
                  // 数字をリカウントし表示
                  cPairNum.num = canEraseNum = countCanEraseNum(tiles,false);
                  cPairNum.show(scene);
                  if (canEraseNum <= 0 && remainTileNum > 0) {
                    eShuffle.onPointDown.fire();
                  }
                  // 連鎖カウント
                  chainCnt++;
                  // スコアを加算
									// fix 2023.10.26
                  // if (time-14 > 0) {
									if (time > 0) {
										// 連鎖なし
                    // cScoreNum.num = g.game.vars.gameState.score += 1000 + 1000 * Math.floor(chainCnt/4);
                    cScoreNum.num = g.game.vars.gameState.score += 1000;
                    cScoreNum.show(scene);
                  }
                  // 全消し時スキップ
									// fix 2023.10.26
                  // if (remainTileNum <= 0 && time-14 > 0) {
									if (remainTileNum <= 0 && time > 0) {
                    cScoreNum.num = g.game.vars.gameState.score += (time*1001)
                    cScoreNum.show(scene);
                    if (param.isAtsumaru) {
                      cTimeNum.num = time = 0;
                      cTimeNum.show(scene);
                    }
                  }
                } else {
                  // 消せない場合、ミス音再生
                  aMistake.play();
                }
              } else {
                flgErased = true;
              }
            } else {
              // 同じ種類の牌ではない場合、ミス音再生
              aMistake.play();
            }
          } else {
            // 選択音再生
            aSelect.play();
          }
          // 消せなかった場合、牌を選択状態にする
          if (!flgErased) {
            oSel.idx = idx;
            oSel.value = tiles[idx].value;
            eSelRect.x = tiles[idx].img.x;
            eSelRect.y = tiles[idx].img.y;
            eSelRect.show();
            eSelRect.modified();
          } else {
            oSel.idx = -1;
            oSel.value = 0;
            eSelRect.hide();
          }
        });
        scene.append(tiles[idx].img);
      }
    }
    //------------------------------
		// 制限時間の棒
    //------------------------------
    let eTimeLine = new g.FilledRect({
      scene:  scene,
      width:  960,
      height: 5,
      x:      DRAW_DX + (TILE_W * TILES_W - 960) / 2,
      y:      (DRAW_DY - 5) / 2,
      cssColor: '#ffff00',
    });
    scene.append(eTimeLine)
    //------------------------------
    // ２角取りの紫の線
    //------------------------------
    lines = new g.E({
      scene:  scene,
      width:  scene.width,
      height: scene.height,
      x:      0,
      y:      0,
    });
    lines.hide();
    for (let i=0; i<line.length; i++) {
      line[i] = new g.FilledRect({
        scene:    scene,
        cssColor: '#ff00ff',
      });
      lines.append(line[i]);
    }
    scene.append(lines);
    //------------------------------
    // 取れるペア数(簡体字) 158x42
    //------------------------------
    let ePairs = new g.Sprite({
      scene:  scene,
      src:    aPairs,
      x:      1120,
      y:      340,
    });
    scene.append(ePairs);
    //------------------------------
    // 取れるペア数(数値) 300x53
    //------------------------------
    let ePairNum = new Array(3);
    for (let i=0; i<ePairNum.length; i++) {
      ePairNum[i] = new g.Sprite({
        scene:  scene,
        src:    aNum,
        width:  30,
        height: 53,
      });
      scene.append(ePairNum[i]);
    }
    let cPairNum = new clsNum(1150,326,0,ePairNum);
    cPairNum.align = "center";
    cPairNum.num = canEraseNum = countCanEraseNum(tiles,false);
    cPairNum.show(scene);
    //------------------------------
    // スコア 230x41
    //------------------------------
    let eScore = new g.Sprite({
      scene:  scene,
      src:    aScore,
      x:      g.game.width-40,
      y:      4,
    });
    scene.append(eScore);
    let eScoreNum = new Array(8);
    for (let i=0; i<eScoreNum.length; i++) {
      eScoreNum[i] = new g.Sprite({
        scene:  scene,
        src:    aNumMini,
        width:  23,
        height: 41,
      });
      scene.append(eScoreNum[i]);
    }
    let cScoreNum = new clsNum(g.game.width-229,0,g.game.vars.gameState.score,eScoreNum);
    cScoreNum.align = "right";
    cScoreNum.show(scene);
    //------------------------------
    // リトライボタン
    //------------------------------
    let eRetry = null;
    if (param.isAtsumaru) {
      eRetry = new g.Sprite({
        scene:  scene,
        src:    aRetry,
        x:      g.game.width - 170,
        y:      g.game.height - 80,
        touchable: true,
      });
      // eRetry.hide();
      scene.append(eRetry);
      eRetry.onPointDown.add(function() {
        // 連鎖数リセット
        chainCnt = 0;
        // タイルリセット
        init(tiles);
        // タイムリセット
				// fix 2023.10.26
        // time = resetTime(param);
				time = TIME_GAME;
        timeMilli = getCurrentTime() + time * 1000;
				// fix 2023.10.26
        // cTimeNum.num = Math.ceil(time-14);
				cTimeNum.num = time;
        cTimeNum.show(scene);
        // スコアリセット
        cScoreNum.num = g.game.vars.gameState.score = 0;
        cScoreNum.show(scene);
        // 残りタイル数
        remainTileNum = TILES_N;
        // アップデートハンドラ追加
        scene.onUpdate.add(updateTimeHandler);
        // リトライボタンを隠す
        // eRetry.hide();
      });
    }
    //------------------------------
    // 制限時間
    //------------------------------
    let eSec = new g.Sprite({
      scene:  scene,
      src:    aSec,
      x:      74,
      y:      4,
    });
    scene.append(eSec);
    let eTime = new Array(3);
    for (let i=0; i<eTime.length; i++) {
      eTime[i] = new g.Sprite({
        scene:  scene,
        src:    aNumMini,
        width:  23,
        height: 41,
      });
      scene.append(eTime[i]);
    }
    let cTimeNum = new clsNum(0,0,time,eTime);
    cTimeNum.align = "right";
    cTimeNum.show(scene);
    // 制限時間イベントハンドラ
    let updateTimeHandler = function() {
			// fix 2023.10.26
      // if (time-14 <= 0) {
			if (time <= 0) {
        if (param.isAtsumaru) {
          eRetry.show();
          let boardId_1 = 1;
          window.RPGAtsumaru.experimental.scoreboards.setRecord(boardId_1, g.game.vars.gameState.score).then(function () {
            window.RPGAtsumaru.experimental.scoreboards.display(boardId_1);
          });
        }
        scene.update.remove(updateTimeHandler);
      // カウントダウン処理
      // time -= 1 / g.game.fps;
      } else {
        // 時間表示
        time = Math.ceil((timeMilli - getCurrentTime()) / 1000);
				// fix 2023.10.26
        // cTimeNum.num = time-14;
				cTimeNum.num = time;
        cTimeNum.show(scene);
        // スコアの加算
        if (g.game.age && time != preTime) {
					/*
          if (remainTileNum > 0) {
            cScoreNum.num = g.game.vars.gameState.score += 1;
          // } else {
            // cScoreNum.num = g.game.vars.gameState.score += 1000;
          }
					*/
          cScoreNum.show(scene);
          preTime = time;
        }
        // タイムラインの表示
				// fix 2026.10.26
        // let ratio = ((timeMilli - getCurrentTime()) / 120000)- 0.1
				var ratio = (timeMilli - getCurrentTime()) / (TIME_GAME * 1000);
        eTimeLine.width = 960 * ratio;
        eTimeLine.x = DRAW_DX + (TILE_W * TILES_W - eTimeLine.width) / 2;
        // if (cTimeNum.num <= 20) {
          // eTimeLine.cssColor = ((timeMilli - getCurrentTime())%400<200)? "rgb(255,0,255)": "rgb(255,255,0)";
        // }
        eTimeLine.modified();
      }
    };
    scene.onUpdate.add(updateTimeHandler);
    //------------------------------
    // 巻物ボタン ヘルプ 90x250
    //------------------------------
    let eHelp = new g.Sprite({
      scene:  scene,
      src:    aHelp,
      x:      g.game.width-146,
      y:      85,
      touchable: true,
    });
    scene.append(eHelp);
    //------------------------------
    // 巻物ボタン シャッフル 90x250
    //------------------------------
    let eShuffle = new g.Sprite({
      scene:  scene,
      src:    aShuffle,
      x:      g.game.width-146,
      y:      85+300,
      touchable: true,
    });
    scene.append(eShuffle);
    //------------------------------
    // 選択用紫枠
    //------------------------------
    let oSel = {
      value:  -1,
      idx:    -1,
    };
    let eSelRect = new g.E({
      scene:  scene,
      width:  TILE_W,
      height: TILE_H,
    });
    let tempE = new Array(4);
    for (let i=0; i<4; i++) {
      tempE[i] = new g.FilledRect({
        scene: scene,
        cssColor: "#ff00ff",
        width: 5 * (i < 2) + TILE_W * (i >= 2),
        height: TILE_H * (i < 2) + 5 * (i >= 2),
        x: (TILE_W - 5) * (i == 1),
        y: (TILE_H - 5) * (i == 3),
        parent: eSelRect,
      });
    }
    eSelRect.hide();
    scene.append(eSelRect);
    //------------------------------
    // 文字列(シャッフルしました)
    //------------------------------
    let labelBack = new g.FilledRect({
      scene:  scene,
      cssColor: "black",
      width:    32*9,
      height:   32+4,
      x:  DRAW_DX + (TILE_W*TILES_W-32*9) / 2,
      y:  DRAW_DY + (TILE_H*TILES_H-32) / 2,
      opacity:  0.5,
    });
    labelBack.hide();
    scene.append(labelBack);
    let font = new g.DynamicFont({
      game:       g.game,
      fontFamily: "serif",
      size:       32,
    });
    let label = new g.Label({
      scene:  scene,
      font:   font,
      text:   "シャッフルしました",
      fontSize:   32,
      textColor:  "white",
      x:  DRAW_DX + (TILE_W*TILES_W-32*9) / 2,
      y:  DRAW_DY + (TILE_H*TILES_H-32) / 2,
    });
    label.hide();
    scene.append(label);
    //==============================
    // ２角線の更新(フェードアウト処理)
    //==============================
    lines.onUpdate.add(function() {
      if (lines.visible()) {
        if (timeHide!=0 && timeHide-getCurrentTime()>0) {
          lines.opacity = (timeHide-getCurrentTime()) / 3000;
        } else {
          timeHide = 0;
          lines.hide();
        }
        lines.modified();
      }
    });
    //==============================
    // ヘルプボタンを推した時
    //==============================
    eHelp.onPointDown.add(function() {
      // 連鎖カウントを0にする
      chainCnt = 0
      // 
      lines.hide();
      let t = countCanEraseNum(tiles,true);
      if (canEraseNum) {
        scene.insertBefore(lines,ePairs);
        lines.show();
      }
    });
		// add 2023.10.26
		window.addEventListener("keydown", function(ev) {
			// if (ev.code === "Space") {
				eHelp.onPointDown.fire();
			// }
		});
    //==============================
    // シャッフルボタンを押したとき
    //==============================
    eShuffle.onPointDown.add(function() {
      // 連鎖カウントを0にする
      chainCnt = 0
      // 
      lines.hide();
      shuffle(scene,tiles);
      cPairNum.num = canEraseNum = countCanEraseNum(tiles,false);
      if (canEraseNum == 0) {
        eShuffle.onPointDown.fire();
      }
      cPairNum.show(scene);
      // 選択セル解除
      oSel.idx = -1;
      oSel.value = 0;
      eSelRect.hide();
      // シャッフルしました
      labelBack.show();
      label.show();
    });
    //==============================
    // シーン内でのpoint downイベント
    //==============================
    scene.onPointDownCapture.add(function(ev) {
      // console.log("onPointDownCapture********")
      // console.log("typeof=" + typeof(ev.target));
      // console.log(`scene.x=${ev.point.x},scene.y=${ev.point.y}`);
      // console.log(DRAW_DX+TILE_W*(TILES_W+1))
      // console.log(DRAW_DY+TILE_H*(TILES_H+1))
      //------------------------------
      // ファジー選択処理
      //------------------------------
      // クリックしたオブジェクトは無い場合
      if (typeof(ev.target) == "undefined") {
        // 領域内の場合
        if (limitIf(ev.point.x, DRAW_DX-TILE_W, DRAW_DX+TILE_W*(TILES_W+1))) {
          if (limitIf(ev.point.y, DRAW_DY-TILE_H, DRAW_DY+TILE_H*(TILES_H+1))) {
            let idx = getIdx2Pos(ev.point);
            let idxs = [
              idx-ARRAY_W-1,    // 左上
              idx-ARRAY_W,      // 上
              idx-ARRAY_W+1,    // 右上
              idx-1,            // 左
              idx+1,            // 右
              idx+ARRAY_W-1,    // 左下
              idx+ARRAY_W,      // 下
              idx+ARRAY_W+1,    // 右下
            ];
            let dist_close = 100;
            let idx_close = 0;
            // console.log("クリックした牌のインデックス："+ idx);
            for (let i=0; i<idxs.length; i++) {
              if (tiles[idxs[i]].img !== null && tiles[idxs[i]].value > 0) {
                let tx = tiles[idxs[i]].img.x + TILE_W / 2
                let ty = tiles[idxs[i]].img.y + TILE_H / 2
                // console.log("tiles[" + idxs[i] + "] : (x,y)=" + tiles[idxs[i]].img.x + "," + tiles[idxs[i]].img.y + ", v=" + tiles[idxs[i]].value);
                let dist = hypot2(tx-ev.point.x,ty-ev.point.y)
                // 最小値を取得する
                if (dist < dist_close) {
                  idx_close = idxs[i];
                  dist_close = hypot2(tx-ev.point.x,ty-ev.point.y);
                }
              }
            }
            // 最小値の判定をしイベントトリガーを実行する
            // console.log("最近idx =" + idx_close);
            // console.log("最近dist=" + dist_close);
            if (idx_close != 0 && dist_close <= 70.0) {
              // console.log("押下イベント実行");
              tiles[idx_close].img.onPointDown.fire();
            }
          }
        }
      }
    });
  });
  return scene;
}
exports.main = main;
