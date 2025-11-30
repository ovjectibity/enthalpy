export const metricAssetGenerationSchema = {
    "type": "object",
    "properties": {
        "assets": {
            "type": "array", 
            "items": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string"
                    },
                    "formula": {
                        "type": "string"
                    },
                    "description": {
                        "type": "string"
                    },
                    "priority": {
                        "type": "string" 
                    },
                    "metricTimeframe": {
                        "type": "string",
                        "nullable": true
                    },
                    "retrievalPolicy": {
                        "type": "string",
                        "nullable": true
                    }
                },
                "required": ["name","formula","description","priority"],
                "additionalProperties": false
            }   
        }
    },
    "required": ["assets"],
    "additionalProperties": false
} as const;