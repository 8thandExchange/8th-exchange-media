interface Step {
  num: string;
  title: string;
  body: string;
}

interface ApproachListProps {
  steps: Step[];
}

export function ApproachList({ steps }: ApproachListProps) {
  return (
    <div>
      {steps.map((step, i) => (
        <div
          key={step.num}
          className={`grid gap-6 border-t border-white/10 py-10 md:grid-cols-[5rem_1fr] md:gap-10 md:py-12 ${
            i === 0 ? "border-t-0 pt-0 md:pt-0" : ""
          }`}
        >
          <span className="font-display text-3xl text-gold md:text-4xl">{step.num}</span>
          <div>
            <h3 className="type-h3 text-cream">{step.title}</h3>
            <p className="type-body mt-4 text-cream/60">{step.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
