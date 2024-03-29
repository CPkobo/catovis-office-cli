/* tslint:disable:max-line-length */
/* tslint:disable:max-classes-per-file */
/* tslint:disable:no-shadowed-variable */
/* tslint:disable:prefer-for-of */


// cliフォルダでtscするときはrequireを使う
// import JSZip from 'jszip'
const JSZip = require('jszip');

import { ReadingOption } from './option';
import { FileStats } from './stats';
import { cnm } from './util';

export class ExtractContext {
  private src: ExtractedContent[];
  private tgt: ExtractedContent[];

  constructor() {
    this.src = [];
    this.tgt = [];
  }

  public setContent(src: ExtractedContent[], tgt?: ExtractedContent[]): void {
    this.src.push(...src);
    if (tgt !== undefined) {
      this.tgt.push(...tgt);
    }
  }

  public resetContent(): void {
    this.src.length = 0
    this.tgt.length = 0
  }

  public readFromJSON(target: 'src' | 'tgt' | 'both', jsonStr: string): void {
    switch (target) {
      case 'src':
        this.src = JSON.parse(jsonStr);
        this.tgt = [];
        break;

      case 'tgt':
        this.src = [];
        this.tgt = JSON.parse(jsonStr);
        break;

      case 'both': {
        const data: any = JSON.parse(jsonStr);
        const hasSrc = data.src !== undefined
        const hasTgt = data.tgt !== undefined
        // メンバーにsrcもtgtもいなかった場合、srcのデータとして扱う
        if (!hasSrc && !hasTgt) {
          this.src.push(...data)
        } else {
          if (hasSrc) {
            this.src.push(...data.src)
          }
          if (hasTgt) {
            this.tgt.push(...data.tgt)
          }
        }
        break;
      }

      default:
        break;
    }
  }

  public changeActives(target: 'src' | 'tgt', index: number, actives: boolean[]): void {
    const toChange: ExtractedContent[] = target === 'src' ? this.src : this.tgt;
    if (toChange.length === 0) {
      return;
    } else if (actives.length !== toChange[index].exts.length) {
      return;
    }

    for (let i = 0; i < actives.length; i++) {
      toChange[index].exts[i].isActive = actives[i];
    }
  }

  public changeFilePriority(target: 'src' | 'tgt' | 'both', fx: number, move: -1 | 1): void {
    const toChange: ExtractedContent[] = target === 'src' ? this.src : this.tgt;
    if (toChange.length === 0) {
      return;
    }
    const tempCon: ExtractedContent = toChange.splice(fx, 1)[0];
    toChange.splice(fx + move, 0, tempCon);
  }

  public getContentsLength(target: 'src' | 'tgt' | 'longer' | 'shorter'): number {
    const srclen = this.src.length;
    const tgtlen = this.tgt.length
    switch (target) {
      case 'src':
        return srclen;

      case 'tgt':
        return tgtlen;

      case 'longer':
        return srclen >= tgtlen ? srclen : tgtlen;

      case 'shorter':
        return srclen <= tgtlen ? srclen : tgtlen;

      default:
        return 0;
    }
  }

  public getRawContent(target: 'src' | 'tgt'): ExtractedContent[] {
    if (target === 'src') {
      return this.src;
    } else {
      return this.tgt;
    }
  }

  public dumpToJson(target: 'src' | 'tgt' | 'both'): string {
    const data = {
      src: this.src,
      tgt: this.tgt,
    }
    if (target === 'both') {
      return JSON.stringify(data, null, 2)
    } else if (target === 'src') {
      return JSON.stringify(data.src, null, 2)
    } else {
      return JSON.stringify(data.tgt, null, 2)
    }
  }

  public getSingleText(from: 'src' | 'tgt', opt: ReadingOption = new ReadingOption()): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let target: ExtractedContent[] = [];
      if (from === 'src') {
        if (this.src === null) {
          reject('No Source 0s contained');
        } else {
          target = this.src;
        }
      }
      if (from === 'tgt') {
        if (this.tgt === null) {
          reject('No Target files contained');
        } else {
          target = this.tgt;
        }
      }
      const result: string[] = [];
      for (const file of target) {
        if (opt.common.withSeparator) {
          result.push(file.name);
        }
        for (const text of file.exts) {
          if (!text.isActive) {
            if (file.format === 'xlsx') {
              if (!opt.excel.readHiddenSheet) {
                continue
              }
            } else {
              continue;
            }
          }
          if (opt.common.withSeparator) {
            let mark = '';
            switch (text.type) {
              case 'Word-Paragraph':
                mark = '_@λ_ PARAGRAPH _λ@_';
                break;

              case 'Word-Table':
                mark = '_@λ_ TABLE _λ@_';
                break;

              case 'Excel-Sheet':
                mark = `_@λ_ SHEET${text.position} _λ@_`;
                break;

              case 'Excel-Shape':
                mark = `_@λ_ SHEET${text.position} shape _λ@_`;
                break;

              case 'PPT-Slide':
                mark = `_@λ_ SLIDE${text.position} _λ@_`;
                break;

              case 'PPT-Diagram':
                mark = `_@λ_ SLIDE${text.position} diagram _λ@_`;
                break;

              case 'PPT-Chart':
                mark = `_@λ_ SLIDE${text.position} chart _λ@_`;
                break;

              case 'PPT-Note':
                mark = `_@λ_ SLIDE${text.position} note _λ@_`;
                break;

              default:
                break;
            }
            result.push(mark);
          }
          result.push(...text.value);
        }
      }
      resolve(result);
    });
  }

  public simpleCalcOneFile(unit: 'chara' | 'word', fx: number, opt: ReadingOption = new ReadingOption(), part?: SeparateMark): { subs: number[], sum: number, partial: number } {
    const partMark: SeparateMark = part || 'PPT-Note';
    if (this.src === null) {
      return { subs: [], sum: 0, partial: 0 };
    } else {
      const subs: number[] = [];
      let sum: number = 0
      let partial: number = 0
      for (const ext of this.src[fx].exts) {
        if (!ext.isActive) {
          if (this.src[fx].format === 'xlsx') {
            if (!opt.excel.readHiddenSheet) {
              subs.push(0);
              continue;
            }
          } else {
            subs.push(0);
            continue;
          }
        }
        const insum = unit === 'chara' ? ext.sumCharas : ext.sumWords;
        subs.push(insum);
        sum += insum
        if (ext.type === partMark) {
          partial += insum
        }
      }
      return { subs, sum, partial };
    }
  }

  public simpleCalc(unit: 'chara' | 'word', opt: ReadingOption = new ReadingOption()): string[] {
    let totalSum = 0;
    const unitStr = unit === 'chara' ? '文字数' : '単語数';
    const result: string[] = [`ファイル名\t${unitStr}`, ''];
    // const spaces = new RegExp('\\s+', 'g');
    // const marks = new RegExp('(\\,|\\.|:|;|\\!|\\?|\\s)+', 'g');
    if (this.src === null) {
      return [];
    } else {
      for (const con of this.src) {
        let sum = 0;
        for (const ext of con.exts) {
          if (!ext.isActive) {
            if (con.format === 'xlsx') {
              if (!opt.excel.readHiddenSheet) {
                continue
              }
            } else {
              continue;
            }
          }
          if (unit === 'chara') {
            sum += ext.sumCharas;
          } else if (unit === 'word') {
            sum += ext.sumWords;
          }
        }
        totalSum += sum;
        result.push(`${con.name}\t${sum}`);
      }
      result[1] = `総計\t${totalSum}`;
      return result;
    }
  }

  public getAlignedText(opt: ReadingOption = new ReadingOption()): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (this.src === null) {
        reject('No Source files contained');
      } else if (this.tgt === null) {
        reject('No Target files contained');
      } else {
        const len = this.src.length;
        const aligned: string[] = [];
        let toSep = false;
        if (opt.common.withSeparator !== undefined) {
          toSep = opt.common.withSeparator
        }
        for (let i = 0; i < len; i++) {
          const sf = this.src[i];
          const tf = this.tgt[i];
          const inFile: string[] = [];
          if (toSep) {
            inFile.push(`_@@_ ${sf.name}\t_@@_ ${tf.name}`);
          }
          const type = sf.format;
          switch (type) {
            case 'docx': {
              const spfs: ExtractedText[] = [];
              const stfs: ExtractedText[] = [];
              for (const et of sf.exts) {
                if (et.type === 'Word-Paragraph') {
                  spfs.push(et);
                } else if (et.type === 'Word-Table') {
                  stfs.push(et);
                }
              }

              const tpfs: ExtractedText[] = [];
              const ttfs: ExtractedText[] = [];
              for (const et of tf.exts) {
                if (et.type === 'Word-Paragraph') {
                  tpfs.push(et);
                } else if (et.type === 'Word-Table') {
                  ttfs.push(et);
                }
              }

              const spfNum = spfs.length;
              const tpfNum = tpfs.length;
              const plarger = spfNum >= tpfNum ? spfNum : tpfNum;
              for (let j = 0; j < plarger; j++) {
                const sv = spfs[j] !== undefined ? spfs[j].value.slice() : [''];
                const tv = tpfs[j] !== undefined ? tpfs[j].value.slice() : [''];
                inFile.push(...this.segPairing(sv, tv, 'PARAGRAPH', toSep));
              }

              const stfNum = stfs.length;
              const ttfNum = ttfs.length;
              const tlarger = stfNum >= ttfNum ? stfNum : ttfNum;
              for (let k = 0; k < tlarger; k++) {
                const sv = stfs[k] !== undefined ? stfs[k].value.slice() : [''];
                const tv = ttfs[k] !== undefined ? ttfs[k].value.slice() : [''];
                inFile.push(...this.segPairing(sv, tv, 'TABLE', toSep));
              }
              inFile.push('_@@_ EOF\t_@@_ EOF');
              aligned.push(...inFile);
              break;
            }

            case 'xlsx': {
              const sfNum = sf.exts.length;
              const tfNum = tf.exts.length;
              const larger = sfNum >= tfNum ? sfNum : tfNum;
              let k = 0;
              for (let j = 0; j <= larger - 1; j++) {
                k++;
                const sv = sf.exts[j] !== undefined ? sf.exts[j].value.slice() : [''];
                const tv = tf.exts[j] !== undefined ? tf.exts[j].value.slice() : [''];
                inFile.push(...this.segPairing(sv, tv, `SHEET${k}`, toSep));
                if (sf.exts[j + 1] !== undefined && tf.exts[j + 1] !== undefined) {
                  if (sf.exts[j + 1].type === 'Excel-Shape' || tf.exts[j + 1].type === 'Excel-Shape') {
                    const sv = sf.exts[j + 1].type === 'Excel-Shape' ? sf.exts[j + 1].value.slice() : [''];
                    const tv = tf.exts[j + 1].type === 'Excel-Shape' ? tf.exts[j + 1].value.slice() : [''];
                    inFile.push(...this.segPairing(sv, tv, `SHEET${k}-shape`, toSep));
                    j++;
                  }
                }
              }
              inFile.push('_@@_ EOF\t_@@_ EOF');
              aligned.push(...inFile);
              break;
            }

            case 'pptx': {
              const sfNum = sf.exts.length;
              const tfNum = tf.exts.length;
              const larger = sfNum >= tfNum ? sfNum : tfNum;
              let k = 0;
              for (let j = 0; j <= larger - 1; j++) {
                k++;
                const sv = sf.exts[j] !== undefined ? sf.exts[j].value.slice() : [''];
                const tv = tf.exts[j] !== undefined ? tf.exts[j].value.slice() : [''];
                inFile.push(...this.segPairing(sv, tv, `SLIDE${k}`, toSep));
                if (sf.exts[j + 1] !== undefined && tf.exts[j + 1] !== undefined) {
                  if (sf.exts[j + 1].type === 'PPT-Note' || tf.exts[j + 1].type === 'PPT-Note') {
                    const sv = sf.exts[j + 1].type === 'PPT-Note' ? sf.exts[j + 1].value.slice() : [''];
                    const tv = tf.exts[j + 1].type === 'PPT-Note' ? tf.exts[j + 1].value.slice() : [''];
                    inFile.push(...this.segPairing(sv, tv, `SLIDE${k}-note`, toSep));
                    j++;
                  }
                }
              }
              inFile.push('_@@_ EOF\t_@@_ EOF');
              aligned.push(...inFile);
              break;
            }

            default: {
              break;
            }
          }
        }
        resolve(aligned);
      }
    });
  }

  public getAlignStats(): FileStats[][] {
    const statsList: FileStats[][] = [];
    if (this.src !== null && this.tgt !== null) {
      for (let i = 0; i < this.src.length; i++) {
        const srcStats = new FileStats(this.src[i].name, this.src[i].format);
        const tgtStats = new FileStats(this.tgt[i].name, this.tgt[i].format);
        for (const ext of this.src[i].exts) {
          srcStats.countElement(ext);
        }
        for (const ext of this.tgt[i].exts) {
          tgtStats.countElement(ext);
        }
        statsList.push([srcStats, tgtStats]);
      }
    }
    return statsList;
  }

  private segPairing(sVal: string[], tVal: string[], mark: string, separation: boolean): string[] {
    const inSection: string[] = [];
    if (separation) {
      inSection.push(`_@λ_ ${mark} _λ@_\t_@λ_ ${mark} _λ@_`);
    }
    const sLen = sVal.length;
    const tLen = tVal.length;
    const larger = sLen >= tLen ? sLen : tLen;
    if (sLen > tLen) {
      const diff = sLen - tLen;
      for (let i = 0; i < diff; i++) {
        tVal.push('');
      }
    } else if (sLen < tLen) {
      const diff = tLen - sLen;
      for (let i = 0; i < diff; i++) {
        sVal.push('');
      }
    }
    for (let i = 0; i < larger; i++) {
      if (!(sVal[i] === '' && tVal[i] === '')) {
        inSection.push(`${sVal[i].replace(/\n|\r/g, '')}\t${tVal[i].replace(/\n|\r/g, '')}`);
      }
    }
    return inSection;
  }
}
