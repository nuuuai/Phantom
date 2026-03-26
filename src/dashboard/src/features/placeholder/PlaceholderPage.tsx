interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="px-8 py-6">
      <h1 className="font-sans text-lg font-semibold text-ph-text-primary">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl font-sans text-sm text-ph-text-tertiary">
        {description}
      </p>
    </div>
  );
}
