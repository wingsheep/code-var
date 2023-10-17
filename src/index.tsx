import React from "react";
import { Action, ActionPanel, List, Icon, Clipboard, showToast, Toast, LaunchProps } from "@raycast/api";
import { queryVariableNames, getHistory, deleteAllHistory, deleteHistoryItem } from "./useQuery";
import { CASES_ALIAS } from './constants';

import type { Result } from "./types";

export default function Command(props: LaunchProps<{ arguments: any }>) {
  const queryText = props.arguments.queryAlias
  const cancelRef = React.useRef<AbortController | null>(null);
  const [variableNames, setVariableNames] = React.useState<Result[]>([]);
  const [queryAlias] = React.useState<string>(() => queryText.trim());
  const queryType = queryAlias ? CASES_ALIAS[queryAlias as keyof typeof CASES_ALIAS] : ''
  const [loading, setLoading] = React.useState(false);
  const [navigationTitle] = React.useState<string>(() => {
    return queryType || 'CodeVar'
  });
  React.useEffect(() => {
    return () => {
      cancelRef.current?.abort();
    };
  }, []);

  const onSearchTextChange = async (text: string) => {
    cancelRef.current?.abort();
    const searchContent = text.trim();
    if (!searchContent) {
      setVariableNames([]);
      return;
    }
    const cache = await getHistory(searchContent, queryType);
    if (cache.length > 0) {
      setVariableNames(cache);
      setLoading(false);
      return;
    }
    cancelRef.current = new AbortController();
    try {
      setLoading(true);
      const result = await queryVariableNames(searchContent, queryAlias, cancelRef.current.signal);
      setLoading(false);
      setVariableNames(result);
    } catch (error: unknown) {
      if (!String(error).startsWith("AbortError")) {
        showToast({
          style: Toast.Style.Failure,
          title: "Error",
          message: String(error) || (error as Error)?.message,
        });
      }
      setVariableNames([]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <List
      isLoading={loading}
      onSearchTextChange={onSearchTextChange}
      searchBarPlaceholder="Please enter variable name"
      navigationTitle={navigationTitle}
      throttle
    >
      {variableNames.map((variableName, index) => (
        <List.Item
          key={variableName.type + index}
          title={variableName.value}
          subtitle={variableName.type}
          icon={variableName.query ? Icon.Clock : Icon.Stars}
          actions={
            <ActionPanel>
              <ActionPanel.Section>
                <Action.CopyToClipboard title="Copy to Clipboard" content={variableName.value} />
                <Action
                  title="Copy and Paste"
                  onAction={() => Clipboard.paste(variableName.value)}
                  icon={{ source: Icon.CopyClipboard }}
                />
              </ActionPanel.Section>

              <ActionPanel.Section title="History">
                {variableName.query && (
                  <Action
                    title="Remove From History"
                    onAction={async () => {
                      await deleteHistoryItem(variableName);
                    }}
                    icon={{ source: Icon.Trash }}
                    shortcut={{ modifiers: ["cmd"], key: "d" }}
                  />
                )}
                <Action
                  title="Clear All History"
                  onAction={async () => {
                    await deleteAllHistory();
                  }}
                  icon={{ source: Icon.ExclamationMark }}
                />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
