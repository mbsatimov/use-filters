/** Read-only JSON view of an object (e.g. the live `params`). Display only. */
export function JsonPreview({ label = 'params', value }: { label?: string; value: unknown }) {
  return (
    <div className='bg-muted/40 overflow-hidden rounded-lg border'>
      <div className='text-muted-foreground border-b px-3 py-1.5 font-mono text-xs'>{label}</div>
      <pre className='overflow-x-auto p-3 font-mono text-xs leading-relaxed'>
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
