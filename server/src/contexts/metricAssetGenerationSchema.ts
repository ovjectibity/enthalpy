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
                        "type": "string"
                    }
                },
                "required": ["name","formula","description","priority","metricTimeframe"],
                "additionalProperties": false
            }   
        }
    },
    "required": ["assets"],
    "additionalProperties": false
} as const;