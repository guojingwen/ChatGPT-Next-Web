import { ReplaceKeyByType } from "@/app/types/utils";
import { TicketRecord, WxSdkTicketRes, WxSdkTokenRes } from "@/app/types/wxapi";
import { formatDate } from "@/app/utils/format";
import { exeScript } from "../dbUtils";
import { JsTicket } from "@/app/types/global";
const { APPID, APPSECRET } = process.env;

export async function setTicket(): Promise<null> {
  const jsticket = (global as any).jsticket as JsTicket;
  if (jsticket && jsticket.expire_time > Date.now()) {
    return null;
  }
  if (!jsticket) {
    type TicketRecord2 = ReplaceKeyByType<TicketRecord, "create_time", string>;
    const results = await exeScript<TicketRecord2>("select * from jsticket");
    const oldRecord = results[0];
    // 首次启动服务
    if (!oldRecord) {
      (global as any).jsticket = await createTicket();
      return null;
    }
    // 重启服务后
    (global as any).jsticket = {
      ticket: oldRecord.ticket,
      access_token: oldRecord.access_token,
      create_time: new Date(oldRecord.create_time).getTime(),
      expire_time: oldRecord.expire_time,
    };
  }
  // 到这里 global.jsticket 一定有值
  if ((global as any).jsticket.expire_time > Date.now()) {
    return null;
  }
  (global as any).jsticket = await createTicket();
  return null;
}

async function createTicket(): Promise<JsTicket> {
  const { access_token } = await getSdkToken();
  const { ticket, expires_in } = await getSdkTicket(access_token);
  // 这里信任微信服务不会出错， 不进行错误处理
  const create_time = Date.now();
  const expire_time = create_time + (expires_in - 100) * 1000;
  const createTimeStr = formatDate(create_time);

  const sql = `insert into jsticket  (ticket, assess_token, create_time, expire_time)
    values ("${ticket}", "${access_token}", "${createTimeStr}", "${expire_time}");`;
  void exeScript(sql);
  return {
    ticket,
    access_token,
    create_time,
    expire_time,
  };
}

export async function getSdkToken() {
  const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`;
  const res = await fetch(tokenUrl, {
    method: "GET",
  }).then(async (res) => await res.json());
  return res as WxSdkTokenRes;
}

export async function getSdkTicket(access_token: string) {
  const ticketUrl = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${access_token}&type=jsapi`;
  const res = await fetch(ticketUrl, {
    method: "GET",
  }).then(async (res) => await res.json());
  return res as WxSdkTicketRes;
}
