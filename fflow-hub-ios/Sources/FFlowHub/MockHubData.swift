import Foundation

enum MockHubData {
    static let community = Community(
        id: "00000000-0000-4000-8000-000000000001",
        publicId: "turma-ad1",
        name: "Análise e Desenvolvimento — 1º sem.",
        description: "<p>Hub da turma de AD. Avisos, materiais e gente num só lugar.</p>",
        coverUrl: nil,
        kind: "turma"
    )

    static let snapshot = HubSnapshot(
        community: community,
        posts: [
            HubPost(
                id: "p1",
                body: "Prova de POO na quarta às 19h. Sala 12.",
                createdAt: "2026-08-18T14:00:00Z",
                authorName: "Maria",
                authorAvatar: nil
            ),
            HubPost(
                id: "p2",
                body: "Material da aula de hoje já está em Materiais.",
                createdAt: "2026-08-17T22:30:00Z",
                authorName: "João",
                authorAvatar: nil
            ),
        ],
        materials: [
            HubMaterial(id: "m1", title: "Lista 03 — POO", url: "https://example.com/lista3"),
            HubMaterial(id: "m2", title: "Drive da turma", url: "https://drive.google.com"),
        ],
        members: [
            HubMember(userId: "u1", name: "Maria Silva", username: "maria", role: "admin", status: "active"),
            HubMember(userId: "u2", name: "João Santos", username: "joao", role: "member", status: "active"),
            HubMember(userId: "u3", name: "Ana Costa", username: nil, role: "member", status: "active"),
        ],
        sessions: [
            HubSession(
                id: "s1",
                title: "Monitoria de POO",
                location: "Lab 3",
                startsAt: "2026-08-21T22:00:00Z",
                status: "scheduled"
            )
        ],
        aulas: [
            HubAula(
                id: "a1",
                subject: "POO",
                teacher: "Profa. Lima",
                weekday: "wed",
                startsAt: "19:00",
                endsAt: "22:30",
                room: "Sala 12"
            )
        ]
    )
}
