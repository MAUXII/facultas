// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "FFlowHub",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
    ],
    products: [
        .library(
            name: "FFlowHub",
            targets: ["FFlowHub"]
        ),
    ],
    targets: [
        .target(
            name: "FFlowHub",
            resources: [
                .process("Resources"),
            ]
        ),
    ]
)
