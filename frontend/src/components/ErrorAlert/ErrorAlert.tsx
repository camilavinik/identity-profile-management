export function ErrorAlert({ content }: { content: string }) {
  return (
    <div role="alert" className="alert alert-error alert-soft text-sm">
      <span>{content}</span>
    </div>
  );
}
