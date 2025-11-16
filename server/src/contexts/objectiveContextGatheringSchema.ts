export const objectiveContextGatheringSchema = {
    "type": "object",
    "properties": {
        "contexts": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "description": {
                        "type": "string",
                        "title": "objective",
                        "description": "This is the project objective. All existing user workflow analysis, problem and opportunity identification within that, hypotheses generation and experiment designs will be oriented towards this objective. The objective is a clear 1-line statement usually aligning with some clear goal such as increasing conversions, engagement, retention, growing revenue etc. "
                    }
                },
                "required": ["description"],
                "additionalProperties": false
            } 
        }
    },
    "required": ["contexts"],
    "additionalProperties": false
} as const;