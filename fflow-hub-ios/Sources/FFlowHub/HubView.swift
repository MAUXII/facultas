import SwiftUI

struct HubView: View {
    @StateObject private var model = HubViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if model.loading && model.snapshot == nil {
                    ProgressView("Carregando hub…")
                } else if let error = model.error, model.snapshot == nil {
                    VStack(spacing: 12) {
                        Text(error)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(.secondary)
                        Button("Tentar de novo") {
                            Task { await model.reload() }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                } else if let snapshot = model.snapshot {
                    hubContent(snapshot)
                }
            }
            .navigationTitle(model.snapshot?.community.name ?? "Orbit Hub")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        Task { await model.reload() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(model.loading)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 8) {
                        if model.canSwitchCommunity, !model.communities.isEmpty {
                            Menu {
                                ForEach(model.communities) { community in
                                    Button(community.name) {
                                        Task { await model.open(community) }
                                    }
                                }
                            } label: {
                                Image(systemName: "rectangle.stack")
                            }
                        }
                        Text(model.modeLabel.uppercased())
                            .font(.caption2.weight(.semibold))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(.white.opacity(0.08), in: Capsule())
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .preferredColorScheme(.dark)
        .task {
            await model.reload()
        }
    }

    @ViewBuilder
    private func hubContent(_ snapshot: HubSnapshot) -> some View {
        ZStack(alignment: .bottom) {
            ScrollView {
                Group {
                    switch model.tab {
                    case .avisos:
                        avisosTab(snapshot.posts)
                    case .grade:
                        gradeTab(snapshot.aulas)
                    case .materiais:
                        materiaisTab(snapshot.materials)
                    case .membros:
                        membrosTab(snapshot.members)
                    case .sessoes:
                        sessoesTab(snapshot.sessions)
                    case .sobre:
                        sobreTab(snapshot.community.description)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)
                .padding(.bottom, 108)
            }

            InstagramGlassBar(tab: $model.tab, tabs: model.tabs)
                .padding(.horizontal, 18)
                .padding(.bottom, 10)
        }
    }

    private func gradeTab(_ aulas: [HubAula]) -> some View {
        LazyVStack(spacing: 10) {
            if aulas.isEmpty {
                emptyState(
                    icon: "calendar",
                    title: "Grade vazia",
                    text: "A semana da turma aparece aqui quando o representante cadastrar as aulas."
                )
            } else {
                ForEach(aulas.sorted { lhs, rhs in
                    let order = ["mon", "tue", "wed", "thu", "fri", "sat"]
                    let i = order.firstIndex(of: lhs.weekday) ?? 99
                    let j = order.firstIndex(of: rhs.weekday) ?? 99
                    return i == j ? lhs.startsAt < rhs.startsAt : i < j
                }) { aula in
                    GlassCard {
                        HStack {
                            Text(aula.dayLabel)
                                .font(.caption.weight(.semibold))
                                .frame(width: 36, alignment: .leading)
                                .foregroundStyle(.secondary)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(aula.subject)
                                    .font(.subheadline.weight(.medium))
                                Text("\(aula.teacher) · \(aula.room)")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text(aula.timeLabel)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
    }

    private func sessoesTab(_ sessions: [HubSession]) -> some View {
        LazyVStack(spacing: 10) {
            if sessions.isEmpty {
                emptyState(
                    icon: "qrcode",
                    title: "Nenhuma sessão",
                    text: "Check-in e encontros da comunidade ficam aqui."
                )
            } else {
                ForEach(sessions) { session in
                    GlassCard {
                        Text(session.title)
                            .font(.subheadline.weight(.medium))
                        Text(
                            [
                                formatDate(session.startsAt),
                                session.location,
                                session.status,
                            ]
                            .compactMap { $0 }
                            .joined(separator: " · ")
                        )
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }

    private func avisosTab(_ posts: [HubPost]) -> some View {
        LazyVStack(spacing: 12) {
            if posts.isEmpty {
                emptyState(
                    icon: "megaphone",
                    title: "Nenhum aviso ainda",
                    text: "Avisos e recados da turma ficam aqui."
                )
            } else {
                ForEach(posts) { post in
                    GlassCard {
                        HStack(spacing: 10) {
                            AvatarView(name: post.authorName, url: post.authorAvatar)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(post.authorName)
                                    .font(.subheadline.weight(.medium))
                                Text(formatDate(post.createdAt))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                        }
                        Text(post.body)
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.85))
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.top, 4)
                    }
                }
            }
        }
    }

    private func materiaisTab(_ materials: [HubMaterial]) -> some View {
        LazyVStack(spacing: 10) {
            if materials.isEmpty {
                emptyState(
                    icon: "book",
                    title: "Nenhum material",
                    text: "PDFs, Drive e links da disciplina."
                )
            } else {
                ForEach(materials) { item in
                    Link(destination: URL(string: item.url) ?? URL(string: "about:blank")!) {
                        GlassCard {
                            HStack {
                                Image(systemName: "link")
                                    .foregroundStyle(.secondary)
                                Text(item.title)
                                    .lineLimit(1)
                                Spacer()
                                Text("abrir")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func membrosTab(_ members: [HubMember]) -> some View {
        LazyVStack(spacing: 10) {
            if members.isEmpty {
                emptyState(
                    icon: "person.3",
                    title: "Só você por enquanto",
                    text: "Convide pelo Descobrir ou pelo código."
                )
            } else {
                ForEach(members) { member in
                    GlassCard {
                        HStack(spacing: 12) {
                            AvatarView(name: member.name, url: nil)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(member.name)
                                    .font(.subheadline.weight(.medium))
                                if let username = member.username {
                                    Text("@\(username)")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            Spacer()
                            Text(member.role == "admin" ? "Admin" : "Membro")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
    }

    private func sobreTab(_ html: String) -> some View {
        let plain = html
            .replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)

        return Group {
            if plain.isEmpty {
                emptyState(
                    icon: "text.alignleft",
                    title: "Sem descrição ainda",
                    text: "O Sobre conta o que é este grupo ou turma."
                )
            } else {
                Text(plain)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.8))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 8)
            }
        }
    }

    private func emptyState(icon: String, title: String, text: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(.white.opacity(0.2))
                .padding(.top, 32)
            Text(title)
                .font(.headline)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.bottom, 32)
        }
        .frame(maxWidth: .infinity)
    }

    private func formatDate(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        var date = formatter.date(from: iso)
        if date == nil {
            formatter.formatOptions = [.withInternetDateTime]
            date = formatter.date(from: iso)
        }
        guard let date else { return iso.prefix(10).description }
        return date.formatted(.dateTime.day().month(.abbreviated).locale(Locale(identifier: "pt_BR")))
    }
}

private struct InstagramGlassBar: View {
    @Binding var tab: HubTab
    let tabs: [HubTab]

    var body: some View {
        HStack(spacing: 0) {
            ForEach(tabs) { item in
                Button {
                    tab = item
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: item.icon)
                            .font(.system(size: 17, weight: .semibold))
                            .frame(height: 28)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background {
                                if tab == item {
                                    Capsule()
                                        .fill(.white.opacity(0.22))
                                }
                            }
                        Text(item.rawValue)
                            .font(.system(size: 9, weight: tab == item ? .semibold : .regular))
                            .lineLimit(1)
                    }
                    .foregroundStyle(tab == item ? .white : .white.opacity(0.45))
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 8)
        .padding(.top, 10)
        .padding(.bottom, 12)
        .hubGlass(in: RoundedRectangle(cornerRadius: 28, style: .continuous))
    }
}

private struct GlassCard<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            content
        }
        .padding(14)
        .hubGlass(in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

private struct AvatarView: View {
    let name: String
    let url: String?

    var body: some View {
        ZStack {
            Circle()
                .fill(.white.opacity(0.1))
            if let url, let imageUrl = URL(string: url) {
                AsyncImage(url: imageUrl) { phase in
                    if case .success(let image) = phase {
                        image.resizable().scaledToFill()
                    } else {
                        Text(initial)
                    }
                }
            } else {
                Text(initial)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.8))
            }
        }
        .frame(width: 32, height: 32)
        .clipShape(Circle())
    }

    private var initial: String {
        String(name.prefix(1)).uppercased()
    }
}

extension View {
    @ViewBuilder
    func hubGlass(in shape: some Shape) -> some View {
        if #available(iOS 26.0, *) {
            self.glassEffect(.regular, in: shape)
        } else {
            self
                .background(.ultraThinMaterial, in: shape)
                .overlay(shape.stroke(.white.opacity(0.22), lineWidth: 0.6))
        }
    }
}
