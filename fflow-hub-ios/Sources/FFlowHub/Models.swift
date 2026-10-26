import Foundation

struct Community: Identifiable, Codable, Sendable {
    let id: String
    let publicId: String
    let name: String
    var description: String
    let coverUrl: String?
    let kind: String?

    enum CodingKeys: String, CodingKey {
        case id
        case publicId = "public_id"
        case name
        case description
        case coverUrl = "cover_url"
        case kind
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        publicId = try container.decodeIfPresent(String.self, forKey: .publicId) ?? id
        name = try container.decode(String.self, forKey: .name)
        description = try container.decodeIfPresent(String.self, forKey: .description) ?? ""
        coverUrl = try container.decodeIfPresent(String.self, forKey: .coverUrl)
        kind = try container.decodeIfPresent(String.self, forKey: .kind)
    }

    init(
        id: String,
        publicId: String,
        name: String,
        description: String,
        coverUrl: String?,
        kind: String?
    ) {
        self.id = id
        self.publicId = publicId
        self.name = name
        self.description = description
        self.coverUrl = coverUrl
        self.kind = kind
    }
}

struct HubPost: Identifiable, Codable, Sendable {
    let id: String
    let body: String
    let createdAt: String
    let authorName: String
    let authorAvatar: String?

    enum CodingKeys: String, CodingKey {
        case id, body
        case createdAt = "created_at"
        case authorName = "author_name"
        case authorAvatar = "author_avatar"
    }
}

struct HubMaterial: Identifiable, Codable, Sendable {
    let id: String
    let title: String
    let url: String
}

struct HubMember: Identifiable, Codable, Sendable {
    var id: String { userId }
    let userId: String
    let name: String
    let username: String?
    let role: String
    let status: String

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case name, username, role, status
    }
}

struct HubSession: Identifiable, Sendable {
    let id: String
    let title: String
    let location: String?
    let startsAt: String
    let status: String
}

struct HubAula: Identifiable, Sendable {
    let id: String
    let subject: String
    let teacher: String
    let weekday: String
    let startsAt: String
    let endsAt: String
    let room: String

    var dayLabel: String {
        switch weekday {
        case "mon": "Seg"
        case "tue": "Ter"
        case "wed": "Qua"
        case "thu": "Qui"
        case "fri": "Sex"
        case "sat": "Sáb"
        default: weekday
        }
    }

    var timeLabel: String {
        "\(startsAt.prefix(5))–\(endsAt.prefix(5))"
    }
}

struct HubSnapshot: Sendable {
    let community: Community
    let posts: [HubPost]
    let materials: [HubMaterial]
    let members: [HubMember]
    let sessions: [HubSession]
    let aulas: [HubAula]
}
