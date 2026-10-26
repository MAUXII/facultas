import { LiveMedia } from "@/components/live-media/live-media";

type Person = {
  name: string;
  avatar_url: string | null;
};

export function AvatarStack({
  people,
  max = 5,
}: {
  people: Person[];
  max?: number;
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;

  if (people.length === 0) return null;

  return (
    <div className="flex items-center">
      <div className="flex">
        {shown.map((person, index) => (
          <span
            key={`${person.name}-${index}`}
            className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/10 text-[11px] font-semibold text-white/80 ring-2 ring-[var(--ff-bg)]"
            style={{
              marginLeft: index === 0 ? 0 : -10,
              zIndex: shown.length - index,
            }}
          >
            {person.avatar_url ? (
              <LiveMedia
                src={person.avatar_url}
                className="h-full w-full object-cover"
              />
            ) : (
              person.name.charAt(0).toUpperCase()
            )}
          </span>
        ))}
      </div>
      {extra > 0 ? (
        <span className="ml-2 text-sm text-white/45">+{extra}</span>
      ) : null}
    </div>
  );
}
