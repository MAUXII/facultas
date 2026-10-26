import Foundation

protocol HubService: Sendable {
    func discover() async throws -> [Community]
    func loadHub(communityRef: String) async throws -> HubSnapshot
}

struct MockHubService: HubService {
    func discover() async throws -> [Community] {
        [MockHubData.community]
    }

    func loadHub(communityRef _: String) async throws -> HubSnapshot {
        try await Task.sleep(for: .milliseconds(350))
        return MockHubData.snapshot
    }
}
