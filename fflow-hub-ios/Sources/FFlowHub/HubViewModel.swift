import Foundation

@MainActor
final class HubViewModel: ObservableObject {
    @Published private(set) var snapshot: HubSnapshot?
    @Published private(set) var communities: [Community] = []
    @Published private(set) var loading = true
    @Published private(set) var error: String?
    @Published var tab: HubTab = .avisos

    private let service: HubService
    private var communityRef: String
    let modeLabel: String
    let canSwitchCommunity: Bool

    var tabs: [HubTab] {
        HubTab.tabs(forKind: snapshot?.community.kind)
    }

    init(config: HubConfig = .load()) {
        communityRef = config.communityId ?? ""
        if config.supabaseUrl?.isEmpty == false, config.supabaseAnonKey?.isEmpty == false {
            service = SupabaseHubClient(config: config)
            modeLabel = "live"
            canSwitchCommunity = true
        } else {
            service = MockHubService()
            modeLabel = "mock"
            canSwitchCommunity = false
        }
    }

    func reload() async {
        loading = true
        error = nil
        do {
            if canSwitchCommunity {
                communities = (try? await service.discover()) ?? []
            }
            let ref = communityRef.isEmpty ? (communities.first?.publicId ?? communities.first?.id ?? "") : communityRef
            snapshot = try await service.loadHub(communityRef: ref)
            if !tabs.contains(tab) {
                tab = .avisos
            }
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }

    func open(_ community: Community) async {
        communityRef = community.publicId
        tab = .avisos
        await reload()
    }
}

enum HubTab: String, CaseIterable, Identifiable {
    case avisos = "Avisos"
    case grade = "Grade"
    case materiais = "Materiais"
    case membros = "Membros"
    case sessoes = "Sessões"
    case sobre = "Sobre"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .avisos: "megaphone.fill"
        case .grade: "calendar"
        case .materiais: "folder.fill"
        case .membros: "person.2.fill"
        case .sessoes: "qrcode"
        case .sobre: "ellipsis.circle.fill"
        }
    }

    static func tabs(forKind kind: String?) -> [HubTab] {
        var tabs: [HubTab] = [.avisos]
        if kind == "turma" {
            tabs.append(.grade)
        }
        tabs.append(contentsOf: [.materiais, .membros, .sessoes, .sobre])
        return tabs
    }
}
