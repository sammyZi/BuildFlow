'use client';

/**
 * Simple line-level diff algorithm.
 * Returns an array of { type, content } where type is 'same', 'add', or 'remove'.
 */

interface DiffLine {
  type: 'same' | 'add' | 'remove';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // LCS-based diff
  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to get diff
  const result: DiffLine[] = [];
  let i = m, j = n;
  const stack: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({ type: 'same', content: oldLines[i - 1], oldLineNum: i, newLineNum: j });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: 'add', content: newLines[j - 1], newLineNum: j });
      j--;
    } else {
      stack.push({ type: 'remove', content: oldLines[i - 1], oldLineNum: i });
      i--;
    }
  }

  stack.reverse();
  return stack;
}

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  oldLabel: string;
  newLabel: string;
}

export default function DiffViewer({ oldContent, newContent, oldLabel, newLabel }: DiffViewerProps) {
  const diff = computeDiff(oldContent, newContent);

  // Compute stats
  const additions = diff.filter(d => d.type === 'add').length;
  const deletions = diff.filter(d => d.type === 'remove').length;

  return (
    <div className="font-mono text-[13px] leading-relaxed">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-alt border border-border rounded-t-lg">
        <div className="flex items-center gap-3">
          <span className="text-text-muted text-[12px]">
            {oldLabel} → {newLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[12px]">
          <span className="text-emerald-600 font-semibold">+{additions}</span>
          <span className="text-red-500 font-semibold">-{deletions}</span>
        </div>
      </div>

      {/* Diff lines */}
      <div className="border border-t-0 border-border rounded-b-lg overflow-hidden max-h-[500px] overflow-y-auto custom-scrollbar">
        {diff.map((line, idx) => {
          const bgColor =
            line.type === 'add' ? 'bg-emerald-50' :
            line.type === 'remove' ? 'bg-red-50' :
            'bg-white';

          const textColor =
            line.type === 'add' ? 'text-emerald-800' :
            line.type === 'remove' ? 'text-red-700' :
            'text-text-secondary';

          const gutterBg =
            line.type === 'add' ? 'bg-emerald-100' :
            line.type === 'remove' ? 'bg-red-100' :
            'bg-gray-50';

          const symbol =
            line.type === 'add' ? '+' :
            line.type === 'remove' ? '-' :
            ' ';

          return (
            <div key={idx} className={`flex ${bgColor} border-b border-border/30 last:border-b-0`}>
              {/* Gutter */}
              <div className={`flex-shrink-0 w-8 text-right pr-2 select-none ${gutterBg} ${textColor} opacity-60 text-[11px] leading-6`}>
                {line.oldLineNum || ''}
              </div>
              <div className={`flex-shrink-0 w-8 text-right pr-2 select-none ${gutterBg} ${textColor} opacity-60 text-[11px] leading-6`}>
                {line.newLineNum || ''}
              </div>
              {/* Symbol */}
              <div className={`flex-shrink-0 w-5 text-center select-none ${textColor} font-bold leading-6`}>
                {symbol}
              </div>
              {/* Content */}
              <div className={`flex-1 px-2 leading-6 whitespace-pre-wrap break-all ${textColor}`}>
                {line.content || '\u00A0'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
