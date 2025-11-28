interface XBRLPipelineProps {
    status: string;
}

export default function XBRLPipeline({ status }: XBRLPipelineProps) {
    const stages = [
        {
            id: 1,
            name: "XBRL 파싱",
            description: "XBRL 파일 파싱 및 컨텍스트 추출",
            statuses: ["extracting", "calculating", "analyzing", "generating", "completed"],
        },
        {
            id: 2,
            name: "데이터 추출",
            description: "재무 데이터 추출",
            statuses: ["calculating", "analyzing", "generating", "completed"],
        },
        {
            id: 3,
            name: "비율 계산",
            description: "재무 비율 자동 계산",
            statuses: ["analyzing", "generating", "completed"],
        },
        {
            id: 4,
            name: "LLM 분석",
            description: "AI 기반 재무 분석",
            statuses: ["generating", "completed"],
        },
        {
            id: 5,
            name: "리포트 생성",
            description: "분석 리포트 생성",
            statuses: ["completed"],
        },
    ];

    const getStageStatus = (stage: typeof stages[0]) => {
        if (status === "failed") {
            // Find which stage failed based on the last completed stage
            const currentStageIndex = stages.findIndex((s) => s.statuses.includes(status));
            const thisStageIndex = stages.findIndex((s) => s.id === stage.id);
            if (thisStageIndex === currentStageIndex + 1) {
                return "failed";
            }
        }

        if (stage.statuses.includes(status)) {
            return "complete";
        }

        // Check if this is the current/next stage
        const statusToStageMap: Record<string, number> = {
            pending: 0,
            extracting: 1,
            calculating: 2,
            analyzing: 3,
            generating: 4,
            completed: 5,
        };

        const currentStageNum = statusToStageMap[status] || 0;

        if (stage.id === currentStageNum) {
            return "in_progress";
        }

        if (stage.id === currentStageNum + 1) {
            return "next";
        }

        return "pending";
    };

    const getStageColor = (stageStatus: string) => {
        switch (stageStatus) {
            case "complete":
                return "bg-green-500 text-white";
            case "in_progress":
                return "bg-blue-500 text-white animate-pulse";
            case "next":
                return "bg-yellow-500 text-white";
            case "failed":
                return "bg-red-500 text-white";
            case "pending":
            default:
                return "bg-gray-300 text-gray-600";
        }
    };

    const getStageIcon = (stageStatus: string, stageId: number) => {
        switch (stageStatus) {
            case "complete":
                return "✓";
            case "in_progress":
                return "⟳";
            case "next":
                return "→";
            case "failed":
                return "✕";
            case "pending":
            default:
                return stageId.toString();
        }
    };

    const getStatusMessage = () => {
        switch (status) {
            case "pending":
                return "📝 분석을 시작하세요.";
            case "extracting":
                return "⚙️ XBRL 파일을 파싱하고 있습니다...";
            case "calculating":
                return "📊 재무 비율을 계산하고 있습니다...";
            case "analyzing":
                return "🤖 AI가 재무 분석을 수행하고 있습니다...";
            case "generating":
                return "📄 분석 리포트를 생성하고 있습니다...";
            case "completed":
                return "🎉 모든 분석이 완료되었습니다! 리포트를 다운로드할 수 있습니다.";
            case "failed":
                return "❌ 분석 중 오류가 발생했습니다.";
            default:
                return "상태를 확인 중입니다...";
        }
    };

    return (
        <div className="my-6">
            <h2 className="text-xl font-bold mb-4">XBRL 분석 파이프라인</h2>
            <div className="flex items-center justify-between overflow-x-auto pb-2">
                {stages.map((stage, index) => {
                    const stageStatus = getStageStatus(stage);
                    return (
                        <div key={stage.id} className="flex items-center flex-1 min-w-0">
                            {/* Stage Circle */}
                            <div className="flex flex-col items-center min-w-[80px]">
                                <div
                                    className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center font-bold text-sm md:text-lg ${getStageColor(
                                        stageStatus
                                    )}`}
                                >
                                    {getStageIcon(stageStatus, stage.id)}
                                </div>
                                <div className="text-center mt-2">
                                    <p className="font-semibold text-xs md:text-sm">{stage.name}</p>
                                    <p className="text-xs text-gray-500 hidden md:block">{stage.description}</p>
                                </div>
                            </div>

                            {/* Connector Arrow */}
                            {index < stages.length - 1 && (
                                <div className="flex-1 h-1 bg-gray-300 mx-1 md:mx-2 min-w-[10px]">
                                    <div
                                        className={`h-full transition-all ${
                                            getStageStatus(stages[index + 1]) === "complete"
                                                ? "bg-green-500"
                                                : getStageStatus(stages[index + 1]) === "in_progress"
                                                ? "bg-blue-500"
                                                : getStageStatus(stages[index + 1]) === "next"
                                                ? "bg-yellow-500"
                                                : "bg-gray-300"
                                        }`}
                                        style={{
                                            width:
                                                getStageStatus(stages[index + 1]) === "complete"
                                                    ? "100%"
                                                    : getStageStatus(stages[index + 1]) === "in_progress"
                                                    ? "75%"
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
            <div className="mt-6 flex items-center justify-center space-x-4 text-sm flex-wrap gap-2">
                <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                    <span>완료</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                    <span>진행중</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                    <span>대기중</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-gray-300 mr-2"></div>
                    <span>예정</span>
                </div>
            </div>

            {/* Current Status Message */}
            <div className={`mt-4 p-3 rounded text-center ${
                status === "failed" ? "bg-red-50" : "bg-blue-50"
            }`}>
                <p className="text-sm">{getStatusMessage()}</p>
            </div>
        </div>
    );
}
