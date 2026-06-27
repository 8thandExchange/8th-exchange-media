interface LegalSection {
  title: string;
  paragraphs: string[];
  list?: string[];
}

export function LegalProse({ sections }: { sections: LegalSection[] }) {
  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="type-h3 text-navy">{section.title}</h2>
          <div className="type-body mt-4 space-y-4 text-ink/70">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.list ? (
              <ul className="list-disc space-y-2 pl-5">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}
