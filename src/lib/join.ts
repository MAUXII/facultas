export const ACCESS_CODE_LENGTH = 6;

export type MemberStatus = "active" | "pending" | "removed";

export type JoinResult = {
  communityId: string;
  publicId: string;
  status: "active" | "pending";
};

export class JoinError extends Error {
  constructor(readonly code: "invalid" | "not_found") {
    super(code);
    this.name = "JoinError";
  }
}

export type JoinPort = {
  findByCode(
    code: string,
  ):
    | { id: string; publicId: string; requiresApproval: boolean }
    | null
    | Promise<{ id: string; publicId: string; requiresApproval: boolean } | null>;
  membership(
    communityId: string,
    userId: string,
  ): MemberStatus | null | Promise<MemberStatus | null>;
  insertMember(
    communityId: string,
    userId: string,
    status: "active" | "pending",
  ): void | Promise<void>;
};

export function normalizeCode(raw: string) {
  return raw.replace(/[\s-]+/g, "").toUpperCase();
}

export function createJoin(port: JoinPort) {
  return {
    async byCode(actorId: string, raw: string): Promise<JoinResult> {
      const code = normalizeCode(raw);
      if (!code) throw new JoinError("invalid");
      const community = await port.findByCode(code);
      if (!community) throw new JoinError("not_found");
      const existing = await port.membership(community.id, actorId);
      if (existing === "active" || existing === "pending") {
        return {
          communityId: community.id,
          publicId: community.publicId,
          status: existing,
        };
      }
      const status = community.requiresApproval ? "pending" : "active";
      await port.insertMember(community.id, actorId, status);
      return {
        communityId: community.id,
        publicId: community.publicId,
        status,
      };
    },
  };
}
