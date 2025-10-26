export const objectiveContextGatheringSchema = {
    "type": "object",
    "properties": {
        "contexts": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "content": {
                        "type": "string",
                    }
                },
                "required": ["content"],
                "additionalProperties": false
            } 
        }
    },
    "required": ["contexts"],
    "additionalProperties": false
} as const;