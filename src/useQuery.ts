import * as changeCase from "change-case";
import { LocalStorage, getPreferenceValues, showToast, Toast } from "@raycast/api";
import fetch, { Response, AbortError } from "node-fetch";
import crypto from "crypto";
import qs from "querystring";
import { CASES, CODE_VAR_HISTORY, CASES_ALIAS } from './constants';
import type { Result, YaoDaoResponse } from "./types";

export async function getHistory(queryText: string, queryType: string): Promise<Result[]> {
  const historyString = (await LocalStorage.getItem(`${CODE_VAR_HISTORY}_${queryText}_${queryType}`)) as string;
  if (historyString === undefined) return [];
  const items: Result[] = JSON.parse(historyString);
  return items;
}

export async function deleteAllHistory() {
  await LocalStorage.clear();
  showToast({
    style: Toast.Style.Success,
    title: "Success",
    message: "Cleared search history",
  });
}

export async function deleteHistoryItem(result: Result) {
  await LocalStorage.removeItem(`${CODE_VAR_HISTORY}_${result.query}_${result.queryType}`);
  showToast({
    style: Toast.Style.Success,
    title: "Success",
    message: "Removed from history",
  });
  
}

function generateSign(content: string, salt: number, app_key: string, app_secret: string) {
  const md5 = crypto.createHash("md5");
  md5.update(app_key + content + salt + app_secret);
  const cipher = md5.digest("hex");
  return cipher.slice(0, 32).toUpperCase();
}


function translateAPI(content: string, signal?: AbortSignal): Promise<Response> {
  
  const { appKey, appSecret } = getPreferenceValues();
  const q = content || '苹果'
  const salt = Date.now();
  const sign = generateSign(q, salt, appKey, appSecret);
  const query = qs.stringify({ q, appKey: appKey, from: 'zh-CHS', to: 'en', salt, sign });
  console.log(`https://openapi.youdao.com/api?${query}`);
  return fetch(`https://openapi.youdao.com/api?${query}`, {
    signal: signal,
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
}

export async function queryVariableNames(queryText: string, queryAlias: string, signal?: AbortSignal): Promise<Result[]> {
  const queryType = queryAlias ? CASES_ALIAS[queryAlias as keyof typeof CASES_ALIAS] : ''
  const filterCases = CASES.filter((caseType) => caseType === queryType)
  const response = await translateAPI(queryText, signal)
  if (!response.ok) {
    return Promise.reject(response.statusText);
  } else {
    const content = (await response.json()) as YaoDaoResponse;
    let result: Result[] = [];
    try {
      if (filterCases && filterCases.length === 1) {
        const caseType = filterCases[0]
        content?.translation?.forEach(item => {
          const text = item.replace(/\n/g, "").replace(/\./g, "").trim();
          result.push({
            value: changeCase[caseType](text),
            type:  'Standard',
            queryType: caseType
          })
        })
        content?.web?.forEach(result_web => {
          result_web.value.forEach(item => {
            const text = item.replace(/\n/g, "").replace(/\./g, "").trim();
            result.push({
              value: changeCase[caseType](text),
              type:  'Web',
              queryType: caseType
            })
          })
        })
      } else {
        const text = (content?.translation?.[0] || "").replace(/\n/g, "").replace(/\./g, "").trim();
        result = CASES.map((caseType) => ({ value: changeCase[caseType](text), type: caseType, queryType: caseType}));
      }
    } catch (error) {
      result = [];
    }

    if (queryText && result.length > 0) {
      await LocalStorage.setItem(
        `${CODE_VAR_HISTORY}_${queryText}_${queryType}`,
        JSON.stringify(result.map((item) => ({ ...item, query: queryText })))
      );
    }
    return result;
  }
}
