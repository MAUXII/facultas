import Foundation

enum HubClientError: LocalizedError {
    case missingConfig
    case badResponse(Int)
    case notFound

    var errorDescription: String? {
        switch self {
        case .missingConfig:
            "Configure hub-config.json com Supabase e communityId."
        case .badResponse(let code):
            "Supabase respondeu \(code)."
        case .notFound:
            "Comunidade não encontrada."
        }
    }
}

struct SupabaseHubClient: HubService {
    let config: HubConfig

    func loadHub(communityRef: String) async throws -> HubSnapshot {
        guard config.isLive || (config.supabaseUrl != nil && config.supabaseAnonKey != nil),
              let base = config.supabaseUrl,
              let key = config.supabaseAnonKey
        else {
            throw HubClientError.missingConfig
        }
        let ref = communityRef.isEmpty ? (config.communityId ?? "") : communityRef
        guard !ref.isEmpty else { throw HubClientError.missingConfig }

        let community = try await fetchCommunity(base: base, key: key, ref: ref)
        async let posts = fetchPosts(base: base, key: key, communityId: community.id)
        async let materials = fetchMaterials(base: base, key: key, communityId: community.id)
        async let members = fetchMembers(base: base, key: key, communityId: community.id)
        async let sessions = fetchSessions(base: base, key: key, communityId: community.id)
        async let aulas = fetchAulas(base: base, key: key, communityId: community.id)

        return try await HubSnapshot(
            community: community,
            posts: posts,
            materials: materials,
            members: members,
            sessions: sessions,
            aulas: aulas
        )
    }

    func discover() async throws -> [Community] {
        guard let base = config.supabaseUrl, let key = config.supabaseAnonKey else {
            throw HubClientError.missingConfig
        }
        let path =
            "/rest/v1/communities?visibility=eq.public"
            + "&select=id,public_id,name,description,cover_url,kind"
            + "&order=updated_at.desc"
        return try await get(base: base, key: key, path: path)
    }

    private func fetchCommunity(base: String, key: String, ref: String) async throws -> Community {
        let isUuid = ref.contains("-") && ref.count == 36
        let column = isUuid ? "id" : "public_id"
        let path = "/rest/v1/communities?\(column)=eq.\(ref)&select=*&limit=1"
        let rows: [Community] = try await get(base: base, key: key, path: path)
        guard let community = rows.first else { throw HubClientError.notFound }
        return community
    }

    private func fetchPosts(base: String, key: String, communityId: String) async throws -> [HubPost] {
        struct Row: Decodable {
            let id: String
            let authorId: String
            let body: String
            let createdAt: String

            enum CodingKeys: String, CodingKey {
                case id, body
                case authorId = "author_id"
                case createdAt = "created_at"
            }
        }

        let path =
            "/rest/v1/community_posts?community_id=eq.\(communityId)"
            + "&select=id,author_id,body,created_at&order=created_at.desc"
        let rows: [Row] = try await get(base: base, key: key, path: path)
        let authorIds = Array(Set(rows.map(\.authorId)))
        let profiles = try await fetchProfiles(base: base, key: key, ids: authorIds)

        return rows.map { row in
            let profile = profiles[row.authorId]
            return HubPost(
                id: row.id,
                body: row.body,
                createdAt: row.createdAt,
                authorName: profile?.name ?? "Membro",
                authorAvatar: profile?.avatarUrl
            )
        }
    }

    private func fetchMaterials(base: String, key: String, communityId: String) async throws -> [HubMaterial] {
        struct Row: Decodable {
            let id: String
            let title: String
            let url: String
        }

        let path =
            "/rest/v1/community_resources?community_id=eq.\(communityId)"
            + "&select=id,title,url&order=created_at.desc"
        let rows: [Row] = try await get(base: base, key: key, path: path)
        return rows.map { HubMaterial(id: $0.id, title: $0.title, url: $0.url) }
    }

    private func fetchMembers(base: String, key: String, communityId: String) async throws -> [HubMember] {
        struct Row: Decodable {
            let userId: String
            let role: String
            let status: String

            enum CodingKeys: String, CodingKey {
                case userId = "user_id"
                case role, status
            }
        }

        let path =
            "/rest/v1/community_members?community_id=eq.\(communityId)"
            + "&status=neq.removed&select=user_id,role,status&order=joined_at.asc"
        let rows: [Row] = try await get(base: base, key: key, path: path)
        let profiles = try await fetchProfiles(
            base: base,
            key: key,
            ids: rows.map(\.userId)
        )

        return rows.map { row in
            let profile = profiles[row.userId]
            return HubMember(
                userId: row.userId,
                name: profile?.name ?? "Membro",
                username: profile?.username,
                role: row.role,
                status: row.status
            )
        }
    }

    private struct ProfileRow: Decodable {
        let id: String
        let name: String?
        let username: String?
        let avatarUrl: String?

        enum CodingKeys: String, CodingKey {
            case id, name, username
            case avatarUrl = "avatar_url"
        }
    }

    private func fetchProfiles(
        base: String,
        key: String,
        ids: [String]
    ) async throws -> [String: ProfileRow] {
        guard !ids.isEmpty else { return [:] }
        let filter = ids.joined(separator: ",")
        let path = "/rest/v1/profiles?id=in.(\(filter))&select=id,name,username,avatar_url"
        let rows: [ProfileRow] = try await get(base: base, key: key, path: path)
        return Dictionary(uniqueKeysWithValues: rows.map { ($0.id, $0) })
    }

    private func fetchSessions(
        base: String,
        key: String,
        communityId: String
    ) async throws -> [HubSession] {
        struct Row: Decodable {
            let id: String
            let title: String
            let location: String?
            let startsAt: String
            let status: String

            enum CodingKeys: String, CodingKey {
                case id, title, location, status
                case startsAt = "starts_at"
            }
        }

        let path =
            "/rest/v1/sessions?community_id=eq.\(communityId)"
            + "&select=id,title,location,starts_at,status&order=starts_at.desc"
        let rows: [Row]
        do {
            rows = try await get(base: base, key: key, path: path)
        } catch {
            return []
        }
        return rows.map {
            HubSession(
                id: $0.id,
                title: $0.title,
                location: $0.location,
                startsAt: $0.startsAt,
                status: $0.status
            )
        }
    }

    private func fetchAulas(
        base: String,
        key: String,
        communityId: String
    ) async throws -> [HubAula] {
        struct Row: Decodable {
            let id: String
            let subject: String
            let teacher: String
            let weekday: String
            let startsAt: String
            let endsAt: String
            let room: String

            enum CodingKeys: String, CodingKey {
                case id, subject, teacher, weekday, room
                case startsAt = "starts_at"
                case endsAt = "ends_at"
            }
        }

        let path =
            "/rest/v1/aulas?community_id=eq.\(communityId)"
            + "&select=id,subject,teacher,weekday,starts_at,ends_at,room"
        let rows: [Row]
        do {
            rows = try await get(base: base, key: key, path: path)
        } catch {
            return []
        }
        return rows.map {
            HubAula(
                id: $0.id,
                subject: $0.subject,
                teacher: $0.teacher,
                weekday: $0.weekday,
                startsAt: $0.startsAt,
                endsAt: $0.endsAt,
                room: $0.room
            )
        }
    }

    private func get<T: Decodable>(base: String, key: String, path: String) async throws -> T {
        let trimmed = base.hasSuffix("/") ? String(base.dropLast()) : base
        guard let url = URL(string: trimmed + path) else {
            throw HubClientError.missingConfig
        }

        var request = URLRequest(url: url)
        request.setValue(key, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw HubClientError.badResponse(-1)
        }
        guard (200 ... 299).contains(http.statusCode) else {
            throw HubClientError.badResponse(http.statusCode)
        }

        let decoder = JSONDecoder()
        return try decoder.decode(T.self, from: data)
    }
}
