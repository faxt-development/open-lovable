"use client";

import React from 'react';

export type CodeApplicationStage = 'analyzing' | 'installing' | 'applying' | 'complete' | null;

export interface CodeApplicationProgressState {
  stage: CodeApplicationStage;
  packages?: string[];
  installedPackages?: string[];
  filesGenerated?: string[];
}

interface Props {
  state: CodeApplicationProgressState;
}

const stageLabel: Record<Exclude<CodeApplicationStage, null>, string> = {
  analyzing: 'Analyzing project and preparing changes...',
  installing: 'Installing packages...',
  applying: 'Applying code changes...',
  complete: 'All done!',
};

export default function CodeApplicationProgress({ state }: Props) {
  if (!state.stage) return null;

  return (
    <div className="my-3 p-3 rounded-lg border border-gray-300 bg-white shadow-sm">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <div className="w-3 h-3 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
        <span className="font-medium">{stageLabel[state.stage]}</span>
      </div>

      {state.stage === 'installing' && state.packages && state.packages.length > 0 && (
        <div className="mt-2 text-xs text-gray-600">
          Installing: {state.packages.join(', ')}
          {state.installedPackages && state.installedPackages.length > 0 && (
            <div className="mt-1">Installed: {state.installedPackages.join(', ')}</div>
          )}
        </div>
      )}

      {state.stage === 'applying' && state.filesGenerated && state.filesGenerated.length > 0 && (
        <div className="mt-2 text-xs text-gray-600">
          Creating files: {state.filesGenerated.join(', ')}
        </div>
      )}

      {state.stage === 'complete' && (
        <div className="mt-2 text-xs text-green-700">Completed successfully.</div>
      )}
    </div>
  );
}
