export function EmptyStateAlert({ content }: { content: string }) {
  return (
    <div role="alert" className="alert alert-soft text-sm">
      <span>{content}</span>
    </div>
  );
}
