import Foundation

enum HubMode: String, Codable {
    case mock
    case live
}

struct HubConfig: Codable {
    var mode: HubMode
    var supabaseUrl: String?
    var supabaseAnonKey: String?
    var communityId: String?

    static let mock = HubConfig(mode: .mock)

    static func load() -> HubConfig {
        if let env = loadFromEnvironment() {
            return env
        }

        if let bundled = loadFromBundle() {
            return bundled
        }

        if let file = loadFromFile(
            URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
                .appending(path: "hub-config.json")
        ) {
            return file
        }

        return .mock
    }

    private static func loadFromEnvironment() -> HubConfig? {
        let env = ProcessInfo.processInfo.environment
        guard
            let url = env["FFLOW_SUPABASE_URL"],
            let key = env["FFLOW_SUPABASE_ANON_KEY"],
            let communityId = env["FFLOW_COMMUNITY_ID"],
            !url.isEmpty, !key.isEmpty, !communityId.isEmpty
        else { return nil }

        return HubConfig(
            mode: .live,
            supabaseUrl: url,
            supabaseAnonKey: key,
            communityId: communityId
        )
    }

    private static func loadFromBundle() -> HubConfig? {
        if let local = Bundle.module.url(forResource: "hub-config.local", withExtension: "json"),
           let config = loadFromFile(local)
        {
            return config
        }
        guard let url = Bundle.module.url(forResource: "hub-config", withExtension: "json") else {
            return nil
        }
        return loadFromFile(url)
    }

    private static func loadFromFile(_ url: URL) -> HubConfig? {
        guard FileManager.default.fileExists(atPath: url.path(percentEncoded: false)),
              let data = try? Data(contentsOf: url),
              let config = try? JSONDecoder().decode(HubConfig.self, from: data)
        else { return nil }
        return config
    }

    var isLive: Bool {
        mode == .live
            && supabaseUrl?.isEmpty == false
            && supabaseAnonKey?.isEmpty == false
            && communityId?.isEmpty == false
    }
}
