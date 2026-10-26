import SwiftUI

struct ContentView: View {
    var body: some View {
        HubView()
            .background {
                LinearGradient(
                    colors: [
                        Color(red: 0.42, green: 0.12, blue: 0.38),
                        Color(red: 0.08, green: 0.07, blue: 0.12),
                        Color(red: 0.18, green: 0.08, blue: 0.28),
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
            }
    }
}