interface FinancialPipelineProps {
    status: string;
}

export default function FinancialPipeline({ status }: FinancialPipelineProps) {
    const stages = [
        {
            id: 1,
            name: "PDF 추출",
            description: "PDF에서 재무 데이터 추출",
            statuses: ["pdf_uploaded", "ratios_calculated", "analysis_complete"],
        },
        {
            id: 2,
            name: "비율 계산",
            description: "재무 비율 자동 계산",
            statuses: ["ratios_calculated", "analysis_complete"],
        },
        {
            id: 3,
            name: "LLM 분석",
            description: "AI 기반 재무 분석",
            statuses: ["analysis_complete"],
        },
        {
            id: 4,
            name: "리포트 생성",
            description: "PDF 분석 리포트 생성",
            statuses: ["analysis_complete"],
        },
    ];

    const getStageStatus = (stage: typeof stages[0]) => {
        if (stage.statuses.includes(status)) {
            return "complete";
        }
        // Check if this is the next stage
        const currentStageIndex = stages.findIndex((s) => s.statuses.includes(status));
        const thisStageIndex = stages.findIndex((s) => s.id === stage.id);

        if (currentStageIndex === -1) {
            // metadata_only - all pending
            return "pending";
        }

        if (thisStageIndex === currentStageIndex + 1) {
            return "next";
        }

        return "pending";
    };

    const getStageColor = (stageStatus: string) => {
        switch (stageStatus) {
            case "complete":
                return "bg-green-500 text-white";
            case "next":
                return "bg-yellow-500 text-white animate-pulse";
            case "pending":
            default:
                return "bg-gray-300 text-gray-600";
        }
    };

    const getStageIcon = (stageStatus: string, stageId: number) => {
        switch (stageStatus) {
            case "complete":
                return "✓";
            case "next":
                return "⟳";
            case "pending":
            default:
                return stageId.toString();
        }
    };

    return (
        <div className="my-6">
            <h2 className="text-xl font-bold mb-4">분석 파이프라인</h2>
            <div className="flex items-center justify-between">
                {stages.map((stage, index) => {
                    const stageStatus = getStageStatus(stage);
                    return (
                        <div key={stage.id} className="flex items-center flex-1">
                            {/* Stage Circle */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${getStageColor(
                                        stageStatus
                                    )}`}
                                >
                                    {getStageIcon(stageStatus, stage.id)}
                                </div>
                                <div className="text-center mt-2">
                                    <p className="font-semibold text-sm">{stage.name}</p>
                                    <p className="text-xs text-gray-500">{stage.description}</p>
                                </div>
                            </div>

                            {/* Connector Arrow */}
                            {index < stages.length - 1 && (
                                <div className="flex-1 h-1 bg-gray-300 mx-2">
                                    <div
                                        className={`h-full transition-all ${
                                            getStageStatus(stages[index + 1]) === "complete"
                                                ? "bg-green-500"
                                                : getStageStatus(stages[index + 1]) === "next"
                                                ? "bg-yellow-500"
                                                : "bg-gray-300"
                                        }`}
                                        style={{
                                            width:
                                                getStageStatus(stages[index + 1]) === "complete"
                                                    ? "100%"
                                                    : getStageStatus(stages[index + 1]) === "next"
                                                    ? "50%"
                                                    : "0%",
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Status Legend */}
            <div className="mt-6 flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                    <span>완료</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                    <span>진행 가능</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-gray-300 mr-2"></div>
                    <span>대기중</span>
                </div>
            </div>

            {/* Current Status Message */}
            <div className="mt-4 p-3 bg-blue-50 rounded text-center">
                <p className="text-sm">
                    {status === "metadata_only" && "📝 PDF를 업로드하여 분석을 시작하세요."}
                    {status === "pdf_uploaded" && "✅ PDF 추출 완료! 분석 실행 버튼을 눌러 계속 진행하세요."}
                    {status === "ratios_calculated" && "⚙️ 비율 계산 완료! 분석을 계속 진행 중입니다..."}
                    {status === "analysis_complete" && "🎉 모든 분석이 완료되었습니다! 리포트를 다운로드할 수 있습니다."}
                </p>
            </div>
        </div>
    );
}
