import Image from "next/image";

interface ServiceCardProps {
  tag: string;
  title: string;
  description: string;
  image: string;
}

export function ServiceCard({ tag, title, description, image }: ServiceCardProps) {
  return (
    <article className="group flex h-full flex-col border border-white/10 bg-navy transition-colors hover:border-gold/35">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-6 md:p-8">
        <p className="eyebrow eyebrow-on-dark mb-4 text-[0.6875rem]">{tag}</p>
        <h3 className="type-h3 text-cream">{title}</h3>
        <p className="type-body mt-4 text-cream/65">{description}</p>
      </div>
    </article>
  );
}
