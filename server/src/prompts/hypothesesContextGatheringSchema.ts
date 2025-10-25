export const hypothesesContextGatheringSchema = {
    "type": "object",
    "properties": {
        "contexts": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "enum": ["objective","product","metrics"],
                    },
                    "content": {
                        "type": "string",
                    }
                },
                "required": ["name","content"],
                "additionalProperties": false
            } 
        }
    },
    "required": ["contexts"],
    "additionalProperties": false
} as const;