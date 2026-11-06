
interface PageHeadingProps {
  title: string;
  description: string;
}

export function PageHeading({
  title,
  description,
}: PageHeadingProps) {
  return (
    <div className="mb-7">
      <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>

      <h1 className="text-3xl font-semibold tracking-tight">
        {title}
      </h1>
    </div>
  );
}
