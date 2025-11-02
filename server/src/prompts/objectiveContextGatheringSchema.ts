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