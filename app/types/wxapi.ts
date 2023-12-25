export interface TicketRecord {
  id: number;
  access_token: string;
  ticket: string;
  expire_time: number;
  create_time: number;
}

export interface WxSdkTokenRes {
  access_token: string;
}

export interface WxSdkTicketRes {
  errcode: number;
  errmsg: string;
  ticket: string;
  expires_in: number; // 秒
}
