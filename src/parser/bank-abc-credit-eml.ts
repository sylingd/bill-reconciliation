import { BillType, type IRecordAppConfig, type IRecordItem } from '@/types';
import { loadFile, readFileText } from '@/utils/file';
import { Idle } from '@/utils/idle';
import dayjs from 'dayjs';
import { GBKUTF8, decode, parseEml, readEml } from 'eml-parse-js';
import { get } from 'lodash-es';
import { nanoid } from 'nanoid';

const BankABCCreditEML: IRecordAppConfig = {
  key: 'bang-abc-credit-eml',
  name: '农业银行信用卡（电子账单）',
  picker: () => loadFile('eml'),
  parser: async file => {
    const idle = new Idle();
    const content = await readFileText(file);
    await idle.sleep();

    const eml = readEml(content);
    if (idle.shouldIdle()) {
      await idle.sleep();
    }

    const html = get(eml, 'attachments[0].data64');

    if (!html) {
      throw new Error('未找到电子账单');
    }
    const charset = String(get(eml, 'attachments[0].contentType')).match(
      /charset="(.*?)"/,
    )?.[1];
    const binaryData = Uint8Array.from(atob(html), c => c.charCodeAt(0));
    let htmlStr = '';
    // 尝试解码
    try {
      const decoder = new TextDecoder(charset);
      htmlStr = decoder.decode(binaryData);
    } catch (e) {
      throw new Error(`浏览器不支持${charset}解码`);
    }
    if (idle.shouldIdle()) {
      await idle.sleep();
    }

    const dpmParser = new DOMParser();
    const doc = dpmParser.parseFromString(htmlStr, 'text/html');
    if (idle.shouldIdle()) {
      await idle.sleep();
    }
    const table = Array.from(doc.querySelectorAll('div')).findLast(
      x =>
        x.innerHTML.includes('交易日') &&
        x.innerHTML.includes('入账日期') &&
        x.innerHTML.includes('/CNY'),
    );

    if (!table) {
      throw new Error('未找到电子账单表格');
    }

    if (idle.shouldIdle()) {
      await idle.sleep();
    }

    const tr = Array.from(
      (table.children[0] as HTMLTableElement).tBodies[0].children,
    )
      .slice(1)
      .map(x =>
        Array.from(x.querySelectorAll('tbody'))
          .find(y => y.querySelectorAll('tr').length === 1)
          ?.querySelector('tr'),
      )
      .filter(Boolean);

    const result: IRecordItem[] = [];

    for (let i = 1; i < tr.length; i++) {
      if (idle.shouldIdle()) {
        await idle.sleep();
      }
      const line = Array.from(tr[i]!.querySelectorAll('td'))
        .map(x => x.innerText.trim())
        .filter(Boolean);
      if (!line) {
        continue;
      }
      const money = Number(line[6].replace(/\/(.*?)$/, ''));
      const day = line[0];

      result.push({
        id: `abc-${line.join(',')}-${nanoid()}`,
        type: money > 0 ? BillType.EXPENSE : BillType.INCOME,
        money: String(Math.abs(money)),
        time: dayjs()
          .year(Number(day.substring(0, 4)))
          .month(Number(day.substring(4, 6)))
          .date(Number(day.substring(6, 8)))
          .hour(0)
          .minute(0)
          .second(0)
          .unix(),
        remark: `${line[3]}-${line[4]}-${line[2]}`,
      });
    }

    // 基于日期从大到小进行排序
    return result.sort((a, b) => b.time - a.time);
  },
};

export default BankABCCreditEML;
