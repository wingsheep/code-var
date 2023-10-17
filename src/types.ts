import type { CASES } from "./constants";

export interface Result {
  value: string;
  type: string;
  query?: string;
  queryType?: string
}

export interface YaoDaoResponse {
  returnPhrase: string[]
  query: string
  errorCode: string
  l: string
  tSpeakUrl: string
  web: Web[]
  requestId: string
  translation: string[]
  mTerminalDict: MTerminalDict
  dict: Dict
  webdict: Webdict
  basic: Basic
  isWord: boolean
  speakUrl: string
}

export interface Web {
  value: string[]
  key: string
}

export interface MTerminalDict {
  url: string
}

export interface Dict {
  url: string
}

export interface Webdict {
  url: string
}

export interface Basic {
  phonetic: string
  explains: string[]
}
