export const routes = {
  home: "/",
  communities: "/communities",
  community: (id: string) => `/communities/${id}`,
  communityOf: (community: { public_id?: string | null; id: string }) =>
    `/communities/${community.public_id || community.id}`,
  create: "/create",
  createWithKind: (kind: string) => `/create?kind=${kind}`,
  discover: "/discover",
  calendar: "/calendar",
  login: "/auth/login",
  signup: "/auth/signup",
  avatar: "/auth/avatar",
  onboarding: "/onboarding",
  profile: "/profile",
  privacy: "/privacy",
  terms: "/terms",
} as const;
